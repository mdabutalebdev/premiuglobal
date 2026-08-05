import type { Metadata } from 'next';

// The checkout page is a client component, so its title lives here.
export const metadata: Metadata = {
    title: 'Checkout',
    description: 'Complete your Premium order — fast, secure checkout.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
