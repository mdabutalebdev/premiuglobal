import type { Metadata } from 'next';
import { FiHelpCircle } from 'react-icons/fi';
import LegalPageLayout from '@/components/shared/LegalPageLayout';

export const metadata: Metadata = {
    title: "FAQs",
    description: "Frequently asked questions about ordering, payment, delivery, and returns at Premium.",
    alternates: { canonical: "/faq" },
};

export default function FaqPage() {
    return (
        <LegalPageLayout
            slug="faq"
            fallbackTitle="FAQs"
            icon={<FiHelpCircle size={24} />}
            accentColor="var(--filter-accent)"
            ctaTitle="Still need help?"
            ctaDescription="Ask us directly — we usually reply within a few hours."
            ctaButtonText="Contact Us"
        />
    );
}
