import type { Metadata } from 'next';
import { FiInfo } from 'react-icons/fi';
import LegalPageLayout from '@/components/shared/LegalPageLayout';

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn about Premium — who we are, what we source, and how we deliver across Bangladesh.",
    alternates: { canonical: "/about" },
};

export default function AboutPage() {
    return (
        <LegalPageLayout
            slug="about"
            fallbackTitle="About Us"
            icon={<FiInfo size={24} />}
            accentColor="var(--filter-accent)"
            ctaTitle="Want to know more?"
            ctaDescription="Our team is happy to answer any question."
            ctaButtonText="Contact Us"
        />
    );
}
