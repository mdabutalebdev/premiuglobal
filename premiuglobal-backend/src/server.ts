import dns from 'dns';
import mongoose from 'mongoose';
import app from './app';
import config from './app/config';

// Apply the optional DNS override before any driver lookup happens.
if (config.dns_servers.length) {
    dns.setServers(config.dns_servers);
    console.log('🧭 DNS servers overridden:', config.dns_servers.join(', '));
}

process.on('uncaughtException', (error) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.message);
    process.exit(1);
});

// ── MongoDB Connection Caching ────────────────────────────────────
interface CachedConnection {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cached;

// Give a buffered query up to 30s to wait for the connection before it errors,
// so the first requests after a deploy survive a slow database start.
mongoose.set('bufferTimeoutMS', 30000);

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        const opts: mongoose.ConnectOptions = {
            // Queue queries that arrive while the connection is still being
            // established instead of throwing "Cannot call X before initial
            // connection is complete". On a container host the API often boots
            // before the database is accepting connections.
            bufferCommands: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };

        console.log('🔌 Connecting to MongoDB...');
        cached.promise = mongoose.connect(config.database_url, opts).then((m) => {
            console.log('✅ MongoDB Connected:', redactUrl(config.database_url));
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error('❌ MongoDB Connection Error:', error);
        throw error;
    }

    return cached.conn;
}

// Never print the password in logs.
function redactUrl(url: string): string {
    return url.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:****@');
}

// ── Connect, retrying until it succeeds ───────────────────────────
// A single fire-and-forget attempt leaves the API permanently broken when the
// database is not reachable at boot, because nothing ever retries.
async function connectWithRetry(attempt = 1): Promise<void> {
    try {
        await connectDB();
    } catch {
        const delay = Math.min(30000, 2000 * attempt);
        console.error(`⏳ MongoDB unreachable (attempt ${attempt}). Retrying in ${delay / 1000}s...`);
        console.error('   URL in use:', redactUrl(config.database_url));
        setTimeout(() => void connectWithRetry(attempt + 1), delay);
    }
}

void connectWithRetry();

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected — mongoose will attempt to reconnect.');
});

// ── Start Server ─────────────────────────────────────────────────
const server = app.listen(config.port, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║                                                  ║');
    console.log('║   🛒 Fresh Food Bazar API Server Started!         ║');
    console.log('║                                                  ║');
    console.log(`║   🌐 URL: http://localhost:${config.port}                  ║`);
    console.log(`║   🔧 Env:  ${String(config.env).padEnd(37)}║`);
    console.log('║                                                  ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
});

process.on('unhandledRejection', (error: Error) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error(error.message);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => console.log('💤 Process terminated.'));
});

export default app;
