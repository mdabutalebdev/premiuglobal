"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';
import { FiMapPin, FiMail, FiPhone } from 'react-icons/fi';
import { FaFacebookF, FaLinkedinIn, FaYoutube, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter, FaTiktok } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/components/shared/ThemeProvider';
import BrandLogo from '@/components/shared/BrandLogo';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import type { IconType } from 'react-icons';

/* ─── Map a social label to its icon (case-insensitive) ─── */
const SOCIAL_ICONS: { match: string; icon: IconType }[] = [
    { match: 'facebook', icon: FaFacebookF },
    { match: 'instagram', icon: FaInstagram },
    { match: 'youtube', icon: FaYoutube },
    { match: 'linkedin', icon: FaLinkedinIn },
    { match: 'twitter', icon: FaXTwitter },
    { match: 'tiktok', icon: FaTiktok },
    { match: 'whatsapp', icon: FaWhatsapp },
];

const getSocialIcon = (label: string): IconType => {
    const found = SOCIAL_ICONS.find((s) => label.toLowerCase().includes(s.match));
    return found?.icon || FaFacebookF;
};

const NewFooter: React.FC = () => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { logoUrl } = useTheme();
    const { data: siteRes } = useGetSiteContentQuery(undefined);

    // Social links from DB (admin → site-content). Only show ones with a real URL.
    // Ticked (active) platforms show in the footer; the URL is just where the icon
    // links. A ticked platform with no URL yet still shows (its icon links to '#').
    const socials: { label: string; url: string }[] = (siteRes?.data?.contact?.socials || [])
        .filter((s: any) => s?.label && s.active !== false);

    // WhatsApp link for "Live Chat" — normalized to wa.me format (88 + local digits)
    const waDigits = (siteRes?.data?.contact?.whatsapp || siteRes?.data?.floating?.whatsapp || '8801961864327').replace(/\D/g, '');
    const waNumber = waDigits.startsWith('880') ? waDigits : waDigits.startsWith('0') ? '88' + waDigits : '880' + waDigits;
    const whatsappLink = `https://wa.me/${waNumber}`;

    // Contact info — dynamic from admin / site-content (same source as header)
    const contactPhone: string = siteRes?.data?.contact?.phone || '+8809666786000';
    const contactEmail: string = siteRes?.data?.contact?.email || 'support@freshfoodbazar.com';
    const contactAddress: string = siteRes?.data?.contact?.address || 'Plot 1020, Road 9, Avenue 9, Mirpur DOHS, Dhaka 1216';

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        toast.success('Logged out successfully');
        router.push('/');
    };

    return (
        <footer className="bg-white border-t border-gray-200">
            {/* ── Main Footer (single section) ── */}
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* Brand + Address + Social */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-flex items-center mb-4">
                            {/* This column's content is ~122px against a 165px row, so
                                a 56px logo still doesn't grow the footer. */}
                            <BrandLogo src={logoUrl} alt="Premium" className="h-28 md:h-32 w-auto object-contain" />
                        </Link>
                        <div className="space-y-2.5">
                            <div className="flex items-start gap-2.5">
                                <FiMapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-500">{contactAddress}</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <FiMail size={14} className="text-gray-400 shrink-0" />
                                <a href={`mailto:${contactEmail}`} className="text-sm text-gray-500 hover:text-[var(--color-text-primary)] transition-colors">{contactEmail}</a>
                            </div>
                        </div>
                        {/* Social Icons — dynamic from admin / site-content */}
                        {socials.length > 0 && (
                            <div className="flex items-center gap-3 mt-4">
                                {socials.map((s) => {
                                    const Icon = getSocialIcon(s.label);
                                    const realUrl = s.url && s.url !== '#' ? s.url : '';
                                    return (
                                        <a
                                            key={s.label}
                                            href={realUrl || '#'}
                                            target={realUrl ? '_blank' : undefined}
                                            rel="noopener noreferrer"
                                            aria-label={s.label}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90"
                                            style={{ background: '#F47B20' }}
                                        >
                                            <Icon size={14} />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Menu 1 - Quick Links */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Quick Links</h4>
                        <ul className="space-y-2.5">
                            <li><Link href="/" className="text-sm text-gray-500 hover:text-[var(--color-text-primary)] transition-colors">Home</Link></li>
                            <li><Link href="/products" className="text-sm text-gray-500 hover:text-[var(--color-text-primary)] transition-colors">All Products</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-500 hover:text-[var(--color-text-primary)] transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Menu 2 - Support */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Support</h4>
                        <ul className="space-y-2.5">
                            <li>
                                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] hover:underline">
                                    <FiPhone size={14} /> {contactPhone}
                                </a>
                            </li>
                            <li><a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-[var(--color-text-primary)] transition-colors">Live Chat (WhatsApp)</a></li>
                            {isAuthenticated ? (
                                <li><Link href={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'} className="text-sm text-gray-500 hover:text-[var(--color-text-primary)] transition-colors">My Account</Link></li>
                            ) : (
                                <li><Link href="/login" className="text-sm text-gray-500 hover:text-[var(--color-text-primary)] transition-colors">Sign In / Register</Link></li>
                            )}
                        </ul>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">We Accept</h4>
                        <div className="grid grid-cols-2 gap-2.5 max-w-[260px]">
                            {[
                                { name: 'bKash', logo: '/images/payment-bkash.jpg' },
                                { name: 'Nagad', logo: '/images/payment-nagad.svg' },
                                { name: 'Rocket', logo: '/images/payment-rocket.webp' },
                                { name: 'Upay', logo: '/images/payment-upay.webp' },
                            ].map((p) => (
                                <div key={p.name} className="bg-white border border-gray-200 rounded-lg h-12 flex items-center justify-center p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.logo} alt={p.name} className="max-h-full max-w-full object-contain" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Footer ── */}
            <div className="border-t border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                        <p className="text-xs text-gray-400">
                            Copyright © {new Date().getFullYear()} Premium
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="/terms" className="text-xs text-gray-400 hover:text-[var(--color-text-primary)] transition-colors">Terms & Conditions</Link>
                            <span className="text-gray-300">•</span>
                            <Link href="/privacy" className="text-xs text-gray-400 hover:text-[var(--color-text-primary)] transition-colors">Privacy Policy</Link>
                            <span className="text-gray-300">•</span>
                            <Link href="/refund" className="text-xs text-gray-400 hover:text-[var(--color-text-primary)] transition-colors">Refund Policy</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default NewFooter;
