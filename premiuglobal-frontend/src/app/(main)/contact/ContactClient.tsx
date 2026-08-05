"use client";

import React, { useState } from 'react';
import { FiPhone, FiMail, FiMapPin, FiSend, FiCheckCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useCreateInquiryMutation } from '@/redux/api/inquiryApi';

/* Brand palette — same tokens the storefront uses (orange CTA, dark-green headings). */
const ORANGE = '#F47B20';
const DARK = '#0C2E20';
const TEXT = '#1F3347';

type FormState = { name: string; email: string; phone: string; subject: string; message: string };

export default function ContactClient() {
    const { data: res, isLoading: contentLoading } = useGetSiteContentQuery({});
    const c = res?.data?.contact;
    const [createInquiry] = useCreateInquiryMutation();

    const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Partial<FormState>>({});

    const validate = () => {
        const e: Partial<FormState> = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
        if (!form.message.trim()) e.message = 'Message is required';
        return e;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name as keyof FormState]) setErrors(p => ({ ...p, [name]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        try {
            await createInquiry({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                subject: form.subject || 'General Inquiry',
                message: form.message.trim(),
                type: 'contact',
            }).unwrap();
            setSubmitted(true);
            setForm({ name: '', email: '', phone: '', subject: '', message: '' });
            setTimeout(() => setSubmitted(false), 5000);
        } catch {
            setErrors({ message: 'Could not send your message. Please try again or call us.' });
        } finally {
            setLoading(false);
        }
    };

    if (contentLoading || !c) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-[#F47B20] animate-spin" />
            </div>
        );
    }

    // Normalize WhatsApp number to wa.me format (88 + local, digits only)
    const waDigits = (c.whatsapp || '').replace(/\D/g, '');
    const waNumber = waDigits.startsWith('880') ? waDigits : waDigits.startsWith('0') ? '88' + waDigits : waDigits ? '880' + waDigits : '';

    const CARDS = [
        { icon: <FiPhone size={20} />, label: 'Call Us', value: c.phone || '01XXXXXXXXX', href: `tel:${c.phone || ''}` },
        { icon: <FaWhatsapp size={20} />, label: 'WhatsApp', value: c.whatsapp || '01XXXXXXXXX', href: `https://wa.me/${waNumber}`, external: true },
        { icon: <FiMail size={20} />, label: 'Email Us', value: c.email || 'support@freshfoodbazar.com', href: `mailto:${c.email || ''}` },
        { icon: <FiMapPin size={20} />, label: 'Visit Us', value: c.address || 'Dhaka, Bangladesh', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || 'Dhaka, Bangladesh')}`, external: true },
    ];

    const SUBJECTS: string[] = c.subjects || [];
    const SOCIALS = (c.socials || []).filter((s: any) => s?.label && s.active !== false);

    const inputClass =
        'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[14px] text-gray-800 bg-gray-50 outline-none transition-colors focus:border-[#F47B20] focus:bg-white';
    const labelClass = 'block text-[13px] font-medium mb-1.5 text-gray-600';

    return (
        <div className="bg-[var(--color-background)] min-h-screen pb-16">

            {/* ── Hero ── */}
            <div className="bg-white border-b border-gray-200">
                <div className="mx-auto max-w-[1200px] px-4 lg:px-8 py-12 lg:py-14 text-center">
                    <span className="inline-block text-[13px] font-semibold px-3.5 py-1 rounded-full" style={{ background: `${ORANGE}1a`, color: ORANGE }}>
                        Contact Us
                    </span>
                    <h1 className="mt-4 text-[28px] lg:text-[36px] font-bold" style={{ color: DARK }}>
                        Get In Touch
                    </h1>
                    <p className="mt-3 text-[15px] text-gray-500 max-w-[520px] mx-auto leading-relaxed">
                        Have a question, feedback, or need help with your order? Our team is here for you.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-[1200px] px-4 lg:px-8">

                {/* ── Contact cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-8 mb-12">
                    {CARDS.map((card) => (
                        <a
                            key={card.label}
                            href={card.href}
                            target={card.external ? '_blank' : undefined}
                            rel={card.external ? 'noopener noreferrer' : undefined}
                            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                        >
                            <span
                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${ORANGE}14`, color: ORANGE }}
                            >
                                {card.icon}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-400">{card.label}</span>
                                <span className="block text-[14px] font-semibold truncate" style={{ color: TEXT }}>{card.value}</span>
                            </span>
                        </a>
                    ))}
                </div>

                {/* ── Form + side ── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8">

                    {/* Form */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8">
                        <h2 className="text-[19px] font-bold" style={{ color: DARK }}>Send us a message</h2>
                        <p className="text-[13.5px] text-gray-500 mt-1 mb-6">We&apos;ll get back to you within 24 hours.</p>

                        {submitted && (
                            <div className="flex items-center gap-2.5 rounded-lg px-4 py-3 mb-5" style={{ background: '#ecfdf3', border: '1px solid #a6e9c3', color: '#15803d' }}>
                                <FiCheckCircle size={18} />
                                <p className="text-[13px] font-medium m-0">Message sent! Our team will reply within 24 hours.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Full Name <span style={{ color: ORANGE }}>*</span></label>
                                    <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className={inputClass} />
                                    {errors.name && <p className="text-[11.5px] mt-1" style={{ color: ORANGE }}>{errors.name}</p>}
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" className={inputClass} />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Email Address <span style={{ color: ORANGE }}>*</span></label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" className={inputClass} />
                                {errors.email && <p className="text-[11.5px] mt-1" style={{ color: ORANGE }}>{errors.email}</p>}
                            </div>

                            {SUBJECTS.length > 0 && (
                                <div>
                                    <label className={labelClass}>Subject</label>
                                    <select name="subject" value={form.subject} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                                        <option value="">Select a topic…</option>
                                        {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Message <span style={{ color: ORANGE }}>*</span></label>
                                <textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="How can we help you?" className={`${inputClass} resize-y min-h-[130px]`} />
                                {errors.message && <p className="text-[11.5px] mt-1" style={{ color: ORANGE }}>{errors.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="self-start inline-flex items-center gap-2 px-7 py-3 rounded-lg text-white text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                                style={{ background: ORANGE }}
                            >
                                {loading
                                    ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Sending…</>
                                    : <><FiSend size={15} /> Send Message</>}
                            </button>
                        </form>
                    </div>

                    {/* Side */}
                    <div className="flex flex-col gap-6">
                        {/* Follow us */}
                        {SOCIALS.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                <p className="text-[14px] font-bold mb-3" style={{ color: DARK }}>Follow Us</p>
                                <div className="flex flex-wrap gap-2">
                                    {SOCIALS.map((s: any, i: number) => {
                                        const realUrl = s.url && s.url !== '#' ? s.url : '';
                                        return (
                                        <a
                                            key={i}
                                            href={realUrl || '#'}
                                            target={realUrl ? '_blank' : undefined}
                                            rel="noopener noreferrer"
                                            className="px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors"
                                            style={{ background: `${ORANGE}12`, color: ORANGE }}
                                        >
                                            {s.label}
                                        </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
