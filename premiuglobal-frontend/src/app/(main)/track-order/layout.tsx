import type { Metadata } from 'next';

// The track-order page is a client component, so its title lives here.
export const metadata: Metadata = {
    title: 'Track Order',
    description: 'Track the status of your Premium order.',
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
    return children;
}
