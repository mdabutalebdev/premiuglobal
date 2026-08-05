import type { Metadata } from 'next';

// The cart page itself is a client component, so its title lives here.
export const metadata: Metadata = {
    title: 'Cart',
    description: 'Review the items in your Premium cart before checkout.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
    return children;
}
