export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                {children}
            </div>
            <p className="mt-6 text-xs text-gray-400">
                © {new Date().getFullYear()} Premium. All rights reserved.
            </p>
        </div>
    );
}
