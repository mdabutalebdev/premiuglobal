import type { Metadata } from 'next';

// The wishlist page is a client component, so its title lives here.
export const metadata: Metadata = {
    title: 'Wishlist',
    description: 'Your saved Premium products.',
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
    return children;
}
