import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// The product page is a client component, so its per-product <title> is built
// here from the product name. Cached for a few minutes so it doesn't hit the
// API (or bump the view count) on every crawl.
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    try {
        const { slug } = await params;
        const res = await fetch(`${API_URL}/products/slug/${slug}`, { next: { revalidate: 300 } });
        if (res.ok) {
            const json = await res.json();
            const p = json?.data;
            if (p?.name) {
                const desc = (p.description || '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 160);
                return {
                    title: p.name,
                    description: desc || `${p.name} — available now at PremiuGlobal.`,
                    openGraph: {
                        title: `${p.name} | PremiuGlobal`,
                        images: p.thumbnail ? [{ url: p.thumbnail }] : undefined,
                    },
                };
            }
        }
    } catch {
        // fall through to the generic title
    }
    return { title: 'Product' };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return children;
}
