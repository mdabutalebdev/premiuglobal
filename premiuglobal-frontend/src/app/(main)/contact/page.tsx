import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
    title: "Contact Us — Talk to a Sourcing Expert",
    description: "Get in touch with PremiuGlobal. Call, email, or WhatsApp our team for product sourcing, shipping quotes, and support — we reply within minutes during business hours.",
    alternates: { canonical: "/contact" },
};

export default function ContactPage() {
    return <ContactClient />;
}
