"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGetSiteContentQuery, useUpdateSiteContentMutation, useGetAllLegalPagesQuery, useUpdateLegalPageMutation } from '@/redux/api/siteContentApi';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
    FiPhone, FiMessageCircle, FiLayout, FiFileText, FiImage,
    FiSave, FiPlus, FiTrash2, FiCheckCircle, FiArrowUp, FiArrowDown, FiCreditCard,
    FiVideo, FiYoutube, FiUploadCloud, FiGrid, FiSearch, FiX,
    FiMenu, FiCornerDownRight, FiExternalLink, FiEdit2, FiAlertCircle, FiShare2, FiCheck,
} from 'react-icons/fi';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { SingleImageUploader, SingleVideoUploader } from '@/components/ui/ImageUploader';
import { isValidYouTube, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/utils/youtube';
import HeroCarousel from '@/components/home/HeroCarousel';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div style={{ height: '350px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} /> });
import 'react-quill-new/dist/quill.snow.css';

/* ─── Styles ─── */
const card: React.CSSProperties = { background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '20px', marginBottom: '16px' };
const label: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '5px' };
const input: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const };
const btn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' };
const btnPrimary: React.CSSProperties = { ...btn, background: 'var(--color-primary)', color: '#fff' };
const btnDanger: React.CSSProperties = { ...btn, background: '#fef2f2', color: '#dc2626', padding: '6px 10px' };
const btnSmall: React.CSSProperties = { ...btn, background: '#f3f4f6', color: '#333', padding: '6px 12px', fontSize: '12px' };

/* Card styling that matches the rest of the redesigned admin panel */
const cardV2: React.CSSProperties = {
    background: '#fff', border: '1px solid #eef0f2', borderRadius: '16px',
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
};
const headerRow: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '12px', flexWrap: 'wrap', padding: '18px 20px', borderBottom: '1px solid #f2f4f7',
};
const h3Style: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: '#101828', margin: 0 };
const pHint: React.CSSProperties = { fontSize: '12px', color: '#98a2b3', margin: '2px 0 0' };

/* ─── Sections ─── */
/* Also mirrored in the sidebar as sub menu items (see AdminLayout), so the keys
   here double as the ?tab= value in the URL. Keep the two lists in sync. */
const TABS = [
    { key: 'hero', label: 'Hero Slides', icon: FiImage },
    { key: 'navMenu', label: 'Navigation Menu', icon: FiMenu },
    { key: 'homeSections', label: 'Home Sections', icon: FiGrid },
    { key: 'contact', label: 'Contact Page', icon: FiPhone },
    { key: 'payment', label: 'Payment Numbers', icon: FiCreditCard },
    { key: 'floating', label: 'Floating Widget', icon: FiMessageCircle },
    { key: 'footer', label: 'Footer', icon: FiLayout },
    { key: 'social', label: 'Social Links', icon: FiShare2 },
    { key: 'legal', label: 'Legal Pages', icon: FiFileText },
];

/* One line of context under each section title */
const SECTION_HINT: Record<string, string> = {
    hero: 'The banner carousel at the top of your homepage',
    navMenu: 'The green menu bar under the header',
    homeSections: 'Product sliders on the homepage',
    contact: 'Phone, email, address and business hours',
    payment: 'bKash / Rocket / Nagad numbers shown at checkout',
    floating: 'The floating call and WhatsApp buttons',
    footer: 'Company name, copyright and footer links',
    social: 'Facebook, Instagram, WhatsApp and other footer social links',
    legal: 'Terms, Privacy, Refund, About Us and FAQs',
};

export default function SiteContentPage() {
    const { data: res, isLoading } = useGetSiteContentQuery({});
    const [updateContent, { isLoading: isSaving }] = useUpdateSiteContentMutation();
    const [activeTab, setActiveTab] = useState('hero');
    const activeSection = TABS.find(t => t.key === activeTab);

    /* Which fields each section sends on save — also what "unsaved" compares. */
    const SECTION_FIELDS: Record<string, string[]> = {
        hero: ['heroSlides', 'heroSideBanners', 'heroSideBanner'],
        navMenu: ['navMenu'],
        homeSections: ['homeSections'],
        contact: ['contact'],
        payment: ['payment'],
        floating: ['floating'],
        footer: ['footer'],
        social: ['contact'],
    };
    const [formData, setFormData] = useState<any>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (res?.data) {
            setFormData(JSON.parse(JSON.stringify(res.data)));
        }
    }, [res]);

    // The sidebar sub menu links here with ?tab=… — follow it both on load and
    // when a sub menu is clicked while already on this page.
    const tabParam = searchParams.get('tab');
    useEffect(() => {
        if (tabParam && TABS.some(t => t.key === tabParam)) setActiveTab(tabParam);
    }, [tabParam]);

    // Clicking a tab updates the URL so the sidebar highlights the matching sub
    // menu and the section survives a refresh.
    const selectTab = (key: string) => {
        setActiveTab(key);
        router.replace(`${pathname}?tab=${key}`, { scroll: false });
    };

    // True when the form holds edits that aren't in the database yet
    const isDirty = useMemo(() => {
        if (!formData || !res?.data) return false;
        const fields = SECTION_FIELDS[activeTab] || [];
        return fields.some(f => JSON.stringify(formData[f] ?? null) !== JSON.stringify(res.data[f] ?? null));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, res, activeTab]);

    const handleSave = async () => {
        if (activeTab === 'legal') return; // Legal pages have their own save
        try {
            const payload: any = {};
            if (activeTab === 'hero') {
                payload.heroSlides = formData.heroSlides;
                payload.heroSideBanners = formData.heroSideBanners || [];
                payload.heroSideBanner = formData.heroSideBanner || {};
            } else {
                // A tab may save fields under a different key (e.g. the Social Links
                // tab edits data that lives under `contact`), so use SECTION_FIELDS
                // instead of the tab key itself.
                const fields = SECTION_FIELDS[activeTab] || [activeTab];
                fields.forEach((f) => { payload[f] = formData[f]; });
            }
            await updateContent(payload).unwrap();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
            toast.success('Saved successfully!');
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading || !formData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Header — the section switcher lives in the sidebar sub menu now */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#101828', margin: 0, letterSpacing: '-0.4px' }}>
                        {activeSection?.label || 'Site Content'}
                    </h1>
                    <p style={{ fontSize: '13px', color: '#667085', margin: '4px 0 0' }}>
                        {SECTION_HINT[activeTab] || 'Manage dynamic content across your website'}
                    </p>
                </div>
                {activeTab !== 'legal' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Edits only live in the form until this is pressed — without
                            this cue it's easy to leave the page thinking it saved. */}
                        {isDirty && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '7px',
                                fontSize: '12.5px', fontWeight: 600, color: '#B45309',
                                background: '#FFFBEB', border: '1px solid #FDE68A',
                                padding: '7px 12px', borderRadius: '999px',
                            }}>
                                <FiAlertCircle size={13} /> Unsaved changes
                            </span>
                        )}
                        <button onClick={handleSave} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                            {/* Stable [icon][span] structure — swapping whole fragments here
                                can trip React's DOM reconciliation on some setups. */}
                            {saveSuccess ? <FiCheckCircle size={14} /> : <FiSave size={14} />}
                            <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Section content */}
            {activeTab === 'hero' && <HeroSlidesTab data={formData} setData={setFormData} onSave={handleSave} isSaving={isSaving} />}
            {activeTab === 'navMenu' && <NavMenuTab data={formData} setData={setFormData} />}
            {activeTab === 'homeSections' && <HomeSectionsTab data={formData} setData={setFormData} />}
            {activeTab === 'contact' && <ContactTab data={formData} setData={setFormData} />}
            {activeTab === 'payment' && <PaymentTab data={formData} setData={setFormData} />}
            {activeTab === 'floating' && <FloatingTab data={formData} setData={setFormData} />}
            {activeTab === 'footer' && <FooterTab data={formData} setData={setFormData} />}
            {activeTab === 'social' && <SocialTab data={formData} setData={setFormData} />}
            {activeTab === 'legal' && <LegalPagesTab />}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── CONTACT TAB ─── */
function ContactTab({ data, setData }: { data: any; setData: any }) {
    const c = data.contact || {};

    const updateField = (field: string, value: any) => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, [field]: value } }));
    };

    const addHour = () => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, hours: [...(p.contact.hours || []), { day: '', time: '' }] } }));
    };
    const removeHour = (idx: number) => {
        setData((p: any) => ({ ...p, contact: { ...p.contact, hours: p.contact.hours.filter((_: any, i: number) => i !== idx) } }));
    };
    const updateHour = (idx: number, field: string, value: string) => {
        setData((p: any) => {
            const h = [...p.contact.hours]; h[idx] = { ...h[idx], [field]: value };
            return { ...p, contact: { ...p.contact, hours: h } };
        });
    };

    const addTip = () => updateField('tips', [...(c.tips || []), '']);
    const removeTip = (idx: number) => updateField('tips', c.tips.filter((_: any, i: number) => i !== idx));
    const updateTip = (idx: number, value: string) => {
        const tips = [...c.tips]; tips[idx] = value;
        updateField('tips', tips);
    };

    const addSubject = () => updateField('subjects', [...(c.subjects || []), '']);
    const removeSubject = (idx: number) => updateField('subjects', c.subjects.filter((_: any, i: number) => i !== idx));
    const updateSubject = (idx: number, value: string) => {
        const subs = [...c.subjects]; subs[idx] = value;
        updateField('subjects', subs);
    };

    return (
        <div>
            {/* Status Badge */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCheckCircle size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>Active — This data is used on the <strong>Contact Us</strong> page</span>
                </div>
            </div>

            {/* Basic Info */}
            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px' }}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div><label style={label}>Phone Number</label><input value={c.phone || ''} onChange={e => updateField('phone', e.target.value)} style={input} /></div>
                    <div><label style={label}>WhatsApp Number</label><input value={c.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} style={input} /></div>
                    <div><label style={label}>Email</label><input value={c.email || ''} onChange={e => updateField('email', e.target.value)} style={input} /></div>
                    <div><label style={label}>Address</label><input value={c.address || ''} onChange={e => updateField('address', e.target.value)} style={input} /></div>
                </div>
            </div>

            {/* Business Hours */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Business Hours</h3>
                    <button onClick={addHour} style={btnSmall}><FiPlus size={13} /> Add</button>
                </div>
                {(c.hours || []).map((h: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={h.day} onChange={e => updateHour(idx, 'day', e.target.value)} placeholder="Day (e.g. Sunday – Thursday)" style={{ ...input, flex: 1 }} />
                        <input value={h.time} onChange={e => updateHour(idx, 'time', e.target.value)} placeholder="Time (e.g. 9 AM – 6 PM)" style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeHour(idx)} style={btnDanger}><FiTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.hours || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No hours added yet.</p>}
            </div>

            {/* Subjects */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Form Subjects</h3>
                    <button onClick={addSubject} style={btnSmall}><FiPlus size={13} /> Add</button>
                </div>
                {(c.subjects || []).map((s: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={s} onChange={e => updateSubject(idx, e.target.value)} placeholder="Subject option..." style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeSubject(idx)} style={btnDanger}><FiTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.subjects || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No subjects added yet.</p>}
            </div>

            {/* Tips */}
            <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Quick Tips</h3>
                    <button onClick={addTip} style={btnSmall}><FiPlus size={13} /> Add</button>
                </div>
                {(c.tips || []).map((t: string, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input value={t} onChange={e => updateTip(idx, e.target.value)} placeholder="Tip text..." style={{ ...input, flex: 1 }} />
                        <button onClick={() => removeTip(idx)} style={btnDanger}><FiTrash2 size={13} /></button>
                    </div>
                ))}
                {(c.tips || []).length === 0 && <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '12px' }}>No tips added yet.</p>}
            </div>

        </div>
    );
}

/* ─── SOCIAL LINKS TAB ─── */
function SocialTab({ data, setData }: { data: any; setData: any }) {
    const c = data.contact || {};

    const SOCIAL_PLATFORMS = [
        { label: 'Facebook', color: '#1877F2', hint: 'https://facebook.com/yourpage' },
        { label: 'Instagram', color: '#E4405F', hint: 'https://instagram.com/yourpage' },
        { label: 'WhatsApp', color: '#25D366', hint: 'https://wa.me/8801XXXXXXXXX' },
        { label: 'TikTok', color: '#111111', hint: 'https://tiktok.com/@yourpage' },
        { label: 'LinkedIn', color: '#0A66C2', hint: 'https://linkedin.com/company/yourpage' },
        { label: 'YouTube', color: '#FF0000', hint: 'https://youtube.com/@yourchannel' },
    ];
    const cleanUrl = (u: string) => (u && u !== '#' ? u : '');
    const getSocial = (label: string) =>
        (c.socials || []).find((s: any) => (s.label || '').toLowerCase() === label.toLowerCase()) || {};
    const setSocial = (label: string, color: string, field: string, value: any) => {
        setData((p: any) => {
            const list = [...((p.contact?.socials) || [])];
            const idx = list.findIndex((s: any) => (s.label || '').toLowerCase() === label.toLowerCase());
            if (idx >= 0) list[idx] = { ...list[idx], [field]: value };
            else list.push({ label, url: '', color, active: true, [field]: value });
            return { ...p, contact: { ...p.contact, socials: list } };
        });
    };

    return (
        <div>
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCheckCircle size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                        Ticked platforms show in the <strong>footer</strong> &amp; <strong>Contact</strong> page. The URL is just where each icon links.
                    </span>
                </div>
            </div>

            <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>Social Links</h3>
                <p style={{ fontSize: '11.5px', color: '#9ca3af', margin: '0 0 14px' }}>Tick the platforms you want in the footer, then paste each one&apos;s URL (where the icon links) and press Save.</p>
                {SOCIAL_PLATFORMS.map((p) => {
                    const s: any = getSocial(p.label);
                    const url = cleanUrl(s.url);
                    const willShow = s.active !== false;
                    return (
                        <div key={p.label} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '135px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={s.active !== false}
                                    onChange={e => setSocial(p.label, p.color, 'active', e.target.checked)}
                                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                />
                                {/* Custom box: orange when ticked, always a white check */}
                                <span style={{
                                    width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                                    border: `1.5px solid ${s.active !== false ? '#F47B20' : '#cbd5e1'}`,
                                    background: s.active !== false ? '#F47B20' : '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                                }}>
                                    {s.active !== false && <FiCheck size={13} color="#fff" strokeWidth={3} />}
                                </span>
                                {p.label}
                            </label>
                            <input
                                value={url}
                                onChange={e => setSocial(p.label, p.color, 'url', e.target.value)}
                                placeholder={p.hint}
                                style={{ ...input, flex: 1 }}
                            />
                            <span style={{ width: '64px', flexShrink: 0, fontSize: '11px', fontWeight: 700, textAlign: 'center', color: willShow ? '#16a34a' : '#cbd5e1' }}>
                                {willShow ? '● Shown' : '○ Hidden'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── FLOATING TAB ─── */
function FloatingTab({ data, setData }: { data: any; setData: any }) {
    const f = data.floating || {};
    const update = (field: string, value: any) => setData((p: any) => ({ ...p, floating: { ...p.floating, [field]: value } }));

    return (
        <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Floating Contact Widget</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Manage the floating WhatsApp/Messenger/Phone button that appears on every page.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <label style={label}>Phone Number</label>
                    <input value={f.phone || ''} onChange={e => update('phone', e.target.value)} style={input} />
                </div>
                <div>
                    <label style={label}>Show Phone</label>
                    <select value={f.showPhone ? 'true' : 'false'} onChange={e => update('showPhone', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>WhatsApp Number (with country code)</label>
                    <input value={f.whatsapp || ''} onChange={e => update('whatsapp', e.target.value)} placeholder="8801XXXXXXXXX" style={input} />
                </div>
                <div>
                    <label style={label}>Show WhatsApp</label>
                    <select value={f.showWhatsapp ? 'true' : 'false'} onChange={e => update('showWhatsapp', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
                <div>
                    <label style={label}>Messenger Page Username</label>
                    <input value={f.messenger || ''} onChange={e => update('messenger', e.target.value)} placeholder="YOUR_PAGE_USERNAME" style={input} />
                </div>
                <div>
                    <label style={label}>Show Messenger</label>
                    <select value={f.showMessenger ? 'true' : 'false'} onChange={e => update('showMessenger', e.target.value === 'true')} style={input}>
                        <option value="true">Yes</option><option value="false">No</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

/* ─── PAYMENT TAB ─── */
function PaymentTab({ data, setData }: { data: any; setData: any }) {
    const methods = [
        { key: 'bkash', label: 'bKash', color: '#E2136E' },
        { key: 'rocket', label: 'Rocket', color: '#8332AC' },
        { key: 'nagad', label: 'Nagad', color: '#F47920' },
        { key: 'cod', label: 'Cash on Delivery', color: '#16a34a' },
    ];

    const p = data.payment || {};
    const updateMethod = (method: string, field: string, value: any) => {
        setData((prev: any) => ({
            ...prev,
            payment: {
                ...prev.payment,
                [method]: { ...(prev.payment?.[method] || {}), [field]: value },
            },
        }));
    };
    const updateInstructions = (value: string) => {
        setData((prev: any) => ({ ...prev, payment: { ...prev.payment, instructions: value } }));
    };

    return (
        <div>
            {/* Info */}
            <div style={{ ...card, background: 'var(--color-primary-lightest)', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCheckCircle size={16} color="#16a34a" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                        These numbers appear on the <strong>Checkout</strong> page. Customers send money to the active number.
                    </span>
                </div>
            </div>

            {/* Method cards */}
            {methods.map(m => {
                const md = p[m.key] || {};
                const isCOD = m.key === 'cod';
                return (
                    <div key={m.key} style={{ ...card, borderLeft: `3px solid ${m.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCOD ? 0 : '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.color }} />
                                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: m.color }}>{m.label}</h3>
                                {isCOD && <span style={{ fontSize: '11px', color: '#888', fontWeight: 400 }}>— no payment number needed</span>}
                            </div>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#555', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={md.active !== false}
                                    onChange={e => updateMethod(m.key, 'active', e.target.checked)}
                                    style={{ width: '15px', height: '15px', accentColor: m.color, cursor: 'pointer' }}
                                />
                                {md.active !== false ? 'Active' : 'Hidden'}
                            </label>
                        </div>
                        {!isCOD && (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={label}>{m.label} Number</label>
                                    <input
                                        value={md.number || ''}
                                        onChange={e => updateMethod(m.key, 'number', e.target.value)}
                                        placeholder="01XXXXXXXXX"
                                        style={input}
                                    />
                                </div>
                                <div>
                                    <label style={label}>Account Type</label>
                                    <select
                                        value={md.accountType || 'Personal'}
                                        onChange={e => updateMethod(m.key, 'accountType', e.target.value)}
                                        style={input}
                                    >
                                        <option value="Personal">Personal</option>
                                        <option value="Agent">Agent</option>
                                        <option value="Merchant">Merchant</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Instructions */}
            <div style={card}>
                <label style={label}>Payment Instructions (shown to customer)</label>
                <textarea
                    value={p.instructions || ''}
                    onChange={e => updateInstructions(e.target.value)}
                    placeholder="e.g. Send Money to the number above, then submit your number, transaction ID and time."
                    rows={2}
                    style={{ ...input, resize: 'vertical' as const, fontFamily: 'inherit' }}
                />
            </div>
        </div>
    );
}

/* ─── FOOTER TAB ─── */
function FooterTab({ data, setData }: { data: any; setData: any }) {
    const f = data.footer || {};
    const update = (field: string, value: any) => setData((p: any) => ({ ...p, footer: { ...p.footer, [field]: value } }));

    return (
        <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>Footer Settings</h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px' }}>Manage footer text displayed at the bottom of every page.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={label}>Company Name</label><input value={f.companyName || ''} onChange={e => update('companyName', e.target.value)} style={input} /></div>
                <div><label style={label}>Copyright Text (optional)</label><input value={f.copyright || ''} onChange={e => update('copyright', e.target.value)} placeholder="Leave empty for auto year" style={input} /></div>
            </div>
        </div>
    );
}

/* ─── LEGAL PAGES TAB ─── */
function LegalPagesTab() {
    const { data: legalRes, isLoading } = useGetAllLegalPagesQuery({});
    const [updateLegalPage, { isLoading: isSavingLegal }] = useUpdateLegalPageMutation();
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const pages = legalRes?.data || [];

    const LEGAL_PAGES = [
        { slug: 'terms', label: 'Terms & Conditions', icon: '📜', color: 'var(--color-primary)' },
        { slug: 'privacy', label: 'Privacy Policy', icon: '🛡️', color: '#2563eb' },
        { slug: 'refund', label: 'Refund Policy', icon: '🔄', color: '#d97706' },
        { slug: 'about', label: 'About Us', icon: 'ℹ️', color: '#0891b2' },
        { slug: 'faq', label: 'FAQs', icon: '❓', color: '#7c3aed' },
    ];

    const startEdit = (slug: string) => {
        const page = pages.find((p: any) => p.slug === slug);
        setEditingSlug(slug);
        setEditTitle(page?.title || LEGAL_PAGES.find(l => l.slug === slug)?.label || '');
        setEditContent(page?.content || '');
    };

    const handleSaveLegal = async () => {
        if (!editingSlug) return;
        try {
            await updateLegalPage({ slug: editingSlug, data: { title: editTitle, content: editContent } }).unwrap();
            toast.success(`${editTitle} saved!`);
            setEditingSlug(null);
        } catch {
            toast.error('Failed to save');
        }
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid #e5e7eb', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
        );
    }

    // Editing Mode
    if (editingSlug) {
        const meta = LEGAL_PAGES.find(l => l.slug === editingSlug);
        return (
            <div>
                <div style={{ ...card, borderColor: meta?.color + '40' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '20px' }}>{meta?.icon}</span>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Editing: {meta?.label}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingSlug(null)} style={{ ...btn, background: '#f3f4f6', color: '#555' }}>Cancel</button>
                            <button onClick={handleSaveLegal} disabled={isSavingLegal} style={{ ...btnPrimary, opacity: isSavingLegal ? 0.6 : 1 }}>
                                <FiSave size={13} /> {isSavingLegal ? 'Saving...' : 'Save Page'}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={label}>Page Title</label>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={input} placeholder="Page title..." />
                    </div>

                    <div>
                        <label style={label}>Page Content</label>
                        <div className="legal-editor-wrapper" style={{ background: '#fff', borderRadius: '8px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                            <ReactQuill
                                theme="snow"
                                value={editContent}
                                onChange={(value: string) => setEditContent(value)}
                                placeholder="Write your page content here..."
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                        [{ 'font': [] }],
                                        [{ 'size': ['small', false, 'large', 'huge'] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        [{ 'indent': '-1' }, { 'indent': '+1' }],
                                        [{ 'align': [] }],
                                        ['link', 'image', 'video'],
                                        ['blockquote', 'code-block'],
                                        ['clean'],
                                    ],
                                }}
                                style={{ minHeight: '400px' }}
                            />
                        </div>
                        <style>{`
                            .legal-editor-wrapper .ql-toolbar { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #f9fafb; padding: 10px 12px !important; }
                            .legal-editor-wrapper .ql-container { border: none !important; font-size: 14px; font-family: inherit; }
                            .legal-editor-wrapper .ql-editor { min-height: 400px; padding: 20px 24px; line-height: 1.8; }
                            .legal-editor-wrapper .ql-editor h1 { font-size: 22px; font-weight: 800; margin: 20px 0 10px; }
                            .legal-editor-wrapper .ql-editor h2 { font-size: 18px; font-weight: 700; margin: 18px 0 8px; }
                            .legal-editor-wrapper .ql-editor h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
                            .legal-editor-wrapper .ql-editor p { margin-bottom: 10px; }
                            .legal-editor-wrapper .ql-editor img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
                        `}</style>
                    </div>
                </div>
            </div>
        );
    }

    // List Mode
    return (
        <div>
            <div style={{ ...card, background: 'var(--color-primary-surface)', borderColor: '#bbf7d0' }}>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: 0 }}>
                    ✅ These pages are live at: <strong>/terms</strong>, <strong>/privacy</strong>, <strong>/refund</strong>, <strong>/about</strong>, <strong>/faq</strong>
                </p>
            </div>
            {LEGAL_PAGES.map(lp => {
                const page = pages.find((p: any) => p.slug === lp.slug);
                const hasContent = page?.content && page.content.length > 10;
                return (
                    <div key={lp.slug} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{lp.icon}</span>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px', color: '#111' }}>{lp.label}</h4>
                                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                                    {hasContent ? `${page.content.replace(/<[^>]+>/g, '').substring(0, 80)}...` : 'No content yet'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                                background: hasContent ? 'var(--color-primary-lightest)' : '#fef2f2',
                                color: hasContent ? '#16a34a' : '#dc2626',
                                textTransform: 'uppercase',
                            }}>
                                {hasContent ? 'Published' : 'Empty'}
                            </span>
                            <button onClick={() => startEdit(lp.slug)} style={{ ...btnSmall, fontWeight: 700 }}>
                                ✏️ Edit
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ─── HERO TAB ─── */
/* Both hero panels are managed from one table: the wide carousel on the left
   ("main") and the narrow panel on the right ("side"). A row's `position`
   tells them apart; adding or editing happens in a dialog. */

type HeroPos = 'main' | 'side';

/* Sizes below are the real panel ratios on the homepage (main ≈ 2.4 : 1,
   side ≈ 1.2 : 1). Off-ratio art still shows in full — the carousel puts a
   blurred copy behind it rather than cropping — but matching these looks best. */
const POSITIONS: { key: HeroPos; title: string; size: string; blurb: string }[] = [
    { key: 'main', title: 'Main Banner', size: '1200 × 500  (wide, 2.4 : 1)', blurb: 'The wide carousel on the left. Images, videos or YouTube links.' },
    { key: 'side', title: 'Side Banner', size: '480 × 400  (almost square, 1.2 : 1)', blurb: 'The narrow panel on the right. Images only.' },
];

function HeroSlidesTab({ data, setData, onSave, isSaving }: { data: any; setData: any; onSave: () => void; isSaving: boolean }) {
    const slides: any[] = data.heroSlides || [];
    const sides: any[] = data.heroSideBanners || [];

    const setSlides = (next: any[]) => setData((p: any) => ({ ...p, heroSlides: next }));
    const setSides = (next: any[]) =>
        setData((p: any) => ({ ...p, heroSideBanners: next.map((s, i) => ({ ...s, order: i })) }));

    /* ── Dialog state ── */
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<{ position: HeroPos; index: number } | null>(null);
    const [form, setForm] = useState<any>({ position: 'main', mediaType: 'image', imageUrl: '', videoUrl: '', youtubeUrl: '', link: '', active: true });
    const [videoSource, setVideoSource] = useState<'upload' | 'youtube'>('youtube');

    const openAdd = () => {
        setEditing(null);
        setForm({ position: 'main', mediaType: 'image', imageUrl: '', videoUrl: '', youtubeUrl: '', link: '', active: true });
        setVideoSource('youtube');
        setDialogOpen(true);
    };

    const openEdit = (position: HeroPos, index: number) => {
        const row = position === 'main' ? slides[index] : sides[index];
        setEditing({ position, index });
        setForm({
            position,
            mediaType: row.mediaType || 'image',
            imageUrl: row.imageUrl || '',
            videoUrl: row.videoUrl || '',
            youtubeUrl: row.youtubeUrl || '',
            link: row.link || '',
            active: row.active !== false,
        });
        setVideoSource(row.youtubeUrl ? 'youtube' : 'upload');
        setDialogOpen(true);
    };

    const saveDialog = () => {
        const isSide = form.position === 'side';

        if (isSide) {
            if (!form.imageUrl) return toast.error('Please upload an image first');
            const row = { imageUrl: form.imageUrl, link: form.link || '', active: form.active };
            if (editing && editing.position === 'side') {
                setSides(sides.map((s, i) => (i === editing.index ? { ...s, ...row } : s)));
            } else {
                // Position changed from main → side: drop the old row first
                if (editing) setSlides(slides.filter((_, i) => i !== editing.index));
                setSides([...sides, row]);
            }
        } else {
            const isVideo = form.mediaType === 'video';
            if (isVideo && videoSource === 'youtube' && !isValidYouTube(form.youtubeUrl)) {
                return toast.error('Please enter a valid YouTube link');
            }
            if (isVideo && videoSource === 'upload' && !form.videoUrl) return toast.error('Please upload a video first');
            if (!isVideo && !form.imageUrl) return toast.error('Please upload an image first');

            const row = {
                mediaType: form.mediaType,
                imageUrl: isVideo ? '' : form.imageUrl,
                videoUrl: isVideo && videoSource === 'upload' ? form.videoUrl : '',
                youtubeUrl: isVideo && videoSource === 'youtube' ? form.youtubeUrl.trim() : '',
                link: form.link || '',
                active: form.active,
            };
            if (editing && editing.position === 'main') {
                setSlides(slides.map((s, i) => (i === editing.index ? { ...s, ...row } : s)));
            } else {
                if (editing) setSides(sides.filter((_, i) => i !== editing.index));
                setSlides([...slides, { ...row, order: slides.length }]);
            }
        }

        setDialogOpen(false);
        toast.success(editing ? 'Banner updated' : 'Banner added — remember to save');
    };

    const removeRow = (position: HeroPos, index: number) => {
        if (!window.confirm('Delete this banner?')) return;
        if (position === 'main') setSlides(slides.filter((_, i) => i !== index));
        else setSides(sides.filter((_, i) => i !== index));
    };

    const toggleRow = (position: HeroPos, index: number) => {
        if (position === 'main') setSlides(slides.map((s, i) => (i === index ? { ...s, active: s.active === false } : s)));
        else setSides(sides.map((s, i) => (i === index ? { ...s, active: s.active === false } : s)));
    };

    const moveRow = (position: HeroPos, index: number, dir: -1 | 1) => {
        const list = position === 'main' ? [...slides] : [...sides];
        const j = index + dir;
        if (j < 0 || j >= list.length) return;
        [list[index], list[j]] = [list[j], list[index]];
        if (position === 'main') setSlides(list); else setSides(list);
    };

    /* ── Preview data ── */
    const activeSlides = slides.filter((s: any) => s.active !== false);
    const previewSlides = activeSlides.length > 0 ? activeSlides : [{ mediaType: 'image', imageUrl: '/images/hero%20banar01.png' }];
    const activeSides = sides.filter((s: any) => s.active !== false && s.imageUrl);
    const previewSides = activeSides.length > 0 ? activeSides : [{ imageUrl: '/images/hero%20banar02.png' }];

    /* ── Row helpers ── */
    const thumbOf = (row: any, position: HeroPos) => {
        if (position === 'side') {
            return <img src={row.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
        }
        if (row.mediaType === 'video' && row.youtubeUrl) {
            const thumb = getYouTubeThumbnail(row.youtubeUrl);
            return (
                <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                    {thumb && <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />}
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiYoutube size={22} color="#fff" />
                    </span>
                </div>
            );
        }
        if (row.mediaType === 'video' && row.videoUrl) {
            return <video src={row.videoUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />;
        }
        return <img src={row.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    };

    const typeOf = (row: any, position: HeroPos) => {
        if (position === 'side') return { text: 'Image', bg: '#F0FDF4', color: '#16A34A' };
        if (row.mediaType === 'video' && row.youtubeUrl) return { text: 'YouTube', bg: '#FEF2F2', color: '#DC2626' };
        if (row.mediaType === 'video') return { text: 'Video', bg: '#EFF6FF', color: '#2563EB' };
        return { text: 'Image', bg: '#F0FDF4', color: '#16A34A' };
    };

    const rows: { position: HeroPos; index: number; row: any }[] = [
        ...slides.map((row: any, index: number) => ({ position: 'main' as HeroPos, index, row })),
        ...sides.map((row: any, index: number) => ({ position: 'side' as HeroPos, index, row })),
    ];

    const th: React.CSSProperties = {
        fontSize: '11px', fontWeight: 700, color: '#667085', textTransform: 'uppercase',
        letterSpacing: '0.4px', padding: '11px 18px', textAlign: 'left', background: '#fafbfc', whiteSpace: 'nowrap',
    };
    const td: React.CSSProperties = { padding: '12px 18px', fontSize: '13px', color: '#475467', verticalAlign: 'middle' };
    const chip = (t: { text: string; bg: string; color: string }) => (
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: t.bg, color: t.color }}>
            {t.text}
        </span>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Live preview ── */}
            <div style={{ ...cardV2, padding: 0, overflow: 'hidden' }}>
                <div style={headerRow}>
                    <div>
                        <h3 style={h3Style}>
                            Homepage Preview
                            <span style={{
                                marginLeft: '8px', fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                                borderRadius: '999px', background: '#ECFDF5', color: '#047857', verticalAlign: 'middle',
                            }}>LIVE</span>
                        </h3>
                        <p style={pHint}>Exactly how the banner area will look on the homepage</p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#98a2b3' }}>
                        {activeSlides.length} main · {activeSides.length} side
                    </span>
                </div>

                <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div style={{ height: '250px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eceff2', background: '#000' }}>
                            <HeroCarousel slides={previewSlides} className="h-full" />
                        </div>
                        <div style={{ height: '250px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eceff2', background: '#0A2A1C' }}>
                            <HeroCarousel
                                slides={previewSides.map((b: any) => ({ mediaType: 'image' as const, imageUrl: b.imageUrl }))}
                                className="h-full"
                            />
                        </div>
                    </div>
                    <p style={{
                        fontSize: '12px', margin: '12px 0 0',
                        color: rows.length === 0 ? '#b45309' : '#98a2b3',
                        fontWeight: rows.length === 0 ? 600 : 400,
                    }}>
                        {rows.length === 0
                            ? 'No banners yet — the homepage is showing the built-in defaults. Add one below, then save.'
                            : 'Hover a banner to reveal its arrows. Changes go live only after you save.'}
                    </p>
                </div>
            </div>

            {/* ── Banner table ── */}
            <div style={{ ...cardV2, padding: 0, overflow: 'hidden' }}>
                <div style={headerRow}>
                    <div>
                        <h3 style={h3Style}>Banners</h3>
                        <p style={pHint}>Every hero banner, main and side, in display order</p>
                    </div>
                    <button onClick={openAdd} style={btnPrimary}>
                        <FiPlus size={14} /> Add New
                    </button>
                </div>

                {rows.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                        <FiImage size={30} color="#d0d5dd" />
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#475467', margin: '10px 0 2px' }}>No banners yet</p>
                        <p style={{ fontSize: '12.5px', color: '#98a2b3', margin: '0 0 14px' }}>
                            Add your first banner — you choose whether it goes in the big or the small panel.
                        </p>
                        <button onClick={openAdd} style={btnPrimary}><FiPlus size={14} /> Add New</button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...th, width: '54px' }}>#</th>
                                    <th style={th}>Preview</th>
                                    <th style={th}>Position</th>
                                    <th style={th}>Type</th>
                                    <th style={th}>Source</th>
                                    <th style={th}>Status</th>
                                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ position, index, row }, i) => {
                                    const t = typeOf(row, position);
                                    const isOn = row.active !== false;
                                    const list = position === 'main' ? slides : sides;
                                    return (
                                        <tr key={`${position}-${index}`} style={{ borderTop: '1px solid #f2f4f7', opacity: isOn ? 1 : 0.6 }}>
                                            <td style={{ ...td, color: '#98a2b3', fontWeight: 700 }}>{i + 1}</td>
                                            <td style={td}>
                                                <div style={{
                                                    width: position === 'main' ? '132px' : '86px', height: '58px',
                                                    borderRadius: '8px', overflow: 'hidden', border: '1px solid #eceff2', background: '#f6f6f6',
                                                }}>
                                                    {thumbOf(row, position)}
                                                </div>
                                            </td>
                                            <td style={td}>
                                                {chip(position === 'main'
                                                    ? { text: 'Main (big)', bg: '#EEF2FF', color: '#4338CA' }
                                                    : { text: 'Side (small)', bg: '#FFF7ED', color: '#C2410C' })}
                                            </td>
                                            <td style={td}>{chip(t)}</td>
                                            <td style={{ ...td, maxWidth: '260px' }}>
                                                <span style={{
                                                    display: 'block', fontSize: '12px', color: '#98a2b3',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {row.youtubeUrl || row.videoUrl || row.imageUrl || '—'}
                                                </span>
                                                {row.link && (
                                                    <span style={{ display: 'block', fontSize: '11px', color: '#667085', marginTop: '2px' }}>
                                                        → {row.link}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={td}>
                                                <button
                                                    onClick={() => toggleRow(position, index)}
                                                    style={{
                                                        ...btn, padding: '5px 12px', fontSize: '11.5px',
                                                        background: isOn ? 'var(--color-primary-lightest)' : '#f2f4f7',
                                                        color: isOn ? 'var(--color-primary)' : '#98a2b3',
                                                    }}
                                                >
                                                    {isOn ? 'Shown' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'inline-flex', gap: '5px' }}>
                                                    <button onClick={() => moveRow(position, index, -1)} disabled={index === 0}
                                                        style={{ ...btnSmall, padding: '6px 8px', opacity: index === 0 ? 0.35 : 1 }} title="Move up">
                                                        <FiArrowUp size={12} />
                                                    </button>
                                                    <button onClick={() => moveRow(position, index, 1)} disabled={index === list.length - 1}
                                                        style={{ ...btnSmall, padding: '6px 8px', opacity: index === list.length - 1 ? 0.35 : 1 }} title="Move down">
                                                        <FiArrowDown size={12} />
                                                    </button>
                                                    <button onClick={() => openEdit(position, index)}
                                                        style={{ ...btnSmall, padding: '6px 8px', background: '#EFF6FF', color: '#2563EB' }} title="Edit">
                                                        <FiEdit2 size={12} />
                                                    </button>
                                                    <button onClick={() => removeRow(position, index)}
                                                        style={{ ...btnSmall, padding: '6px 8px', background: '#FEF3F2', color: '#D92D20' }} title="Delete">
                                                        <FiTrash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onSave} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.6 : 1 }}>
                    <FiSave size={13} /> {isSaving ? 'Saving…' : 'Save Banners'}
                </button>
            </div>

            {/* ── Add / edit dialog ── */}
            {dialogOpen && (
                <div
                    onClick={() => setDialogOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 200, padding: '20px',
                        background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(3px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '620px',
                            maxHeight: '88vh', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 20px 50px rgba(16,24,40,0.2)',
                        }}
                    >
                        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f2f4f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#101828', margin: 0 }}>
                                {editing ? 'Edit Banner' : 'Add New Banner'}
                            </h3>
                            <button onClick={() => setDialogOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#98a2b3', fontSize: '20px', lineHeight: 1 }}>×</button>
                        </div>

                        <div style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            {/* Step 1 — where does it go */}
                            <div>
                                <label style={{ ...label, marginBottom: '9px' }}>Where should this banner go?</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {POSITIONS.map(p => {
                                        const on = form.position === p.key;
                                        return (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => setForm({ ...form, position: p.key, mediaType: p.key === 'side' ? 'image' : form.mediaType })}
                                                style={{
                                                    textAlign: 'left', cursor: 'pointer', padding: '14px',
                                                    borderRadius: '12px', background: on ? 'var(--color-primary-lightest)' : '#fff',
                                                    border: `1.5px solid ${on ? 'var(--color-primary)' : '#e4e7ec'}`,
                                                }}
                                            >
                                                {/* Shape hint so it's obvious which panel this is */}
                                                <div style={{
                                                    width: p.key === 'main' ? '76px' : '38px', height: '26px',
                                                    borderRadius: '5px', marginBottom: '9px',
                                                    background: on ? 'var(--color-primary)' : '#d0d5dd',
                                                }} />
                                                <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: on ? 'var(--color-primary)' : '#101828' }}>
                                                    {p.title}
                                                </p>
                                                <p style={{ margin: '3px 0 0', fontSize: '11.5px', fontWeight: 600, color: '#667085' }}>{p.size}</p>
                                                <p style={{ margin: '5px 0 0', fontSize: '11.5px', color: '#98a2b3', lineHeight: 1.45 }}>{p.blurb}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 2 — the media */}
                            {form.position === 'main' && (
                                <div>
                                    <label style={{ ...label, marginBottom: '9px' }}>Media type</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                                        <button type="button" onClick={() => setForm({ ...form, mediaType: 'image' })} style={toggleBtn(form.mediaType === 'image')}>
                                            <FiImage size={14} /> Image
                                        </button>
                                        <button type="button" onClick={() => setForm({ ...form, mediaType: 'video' })} style={toggleBtn(form.mediaType === 'video')}>
                                            <FiVideo size={14} /> Video
                                        </button>
                                    </div>

                                    {form.mediaType === 'image' ? (
                                        <SingleImageUploader
                                            label="Banner Image"
                                            value={form.imageUrl}
                                            onChange={(url: string) => setForm({ ...form, imageUrl: url })}
                                        />
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                                <button type="button" onClick={() => setVideoSource('youtube')} style={{ ...toggleBtn(videoSource === 'youtube'), padding: '6px 13px', fontSize: '12px' }}>
                                                    <FiYoutube size={13} /> YouTube Link
                                                </button>
                                                <button type="button" onClick={() => setVideoSource('upload')} style={{ ...toggleBtn(videoSource === 'upload'), padding: '6px 13px', fontSize: '12px' }}>
                                                    <FiUploadCloud size={13} /> Upload Video
                                                </button>
                                            </div>

                                            {videoSource === 'youtube' ? (
                                                <>
                                                    <input
                                                        style={input}
                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                        value={form.youtubeUrl}
                                                        onChange={e => setForm({ ...form, youtubeUrl: e.target.value })}
                                                    />
                                                    {form.youtubeUrl && !isValidYouTube(form.youtubeUrl) && (
                                                        <p style={{ fontSize: '11.5px', color: '#ef4444', margin: '6px 0 0', fontWeight: 500 }}>Not a valid YouTube link</p>
                                                    )}
                                                    {form.youtubeUrl && isValidYouTube(form.youtubeUrl) && (
                                                        <div style={{ marginTop: '12px', maxWidth: '320px', aspectRatio: '16 / 9', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eceff2' }}>
                                                            <iframe src={getYouTubeEmbedUrl(form.youtubeUrl) || ''} title="preview" allow="autoplay; encrypted-media" style={{ width: '100%', height: '100%', border: 0 }} />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <SingleVideoUploader
                                                    label="Banner Video"
                                                    value={form.videoUrl}
                                                    onChange={(url: string) => setForm({ ...form, videoUrl: url })}
                                                />
                                            )}
                                        </>
                                    )}

                                    <div style={{ marginTop: '14px' }}>
                                        <label style={label}>Link when clicked <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
                                        <input
                                            style={input}
                                            value={form.link}
                                            onChange={e => setForm({ ...form, link: e.target.value })}
                                            placeholder="/products?s=Honey"
                                        />
                                    </div>
                                </div>
                            )}

                            {form.position === 'side' && (
                                <div>
                                    <SingleImageUploader
                                        label="Banner Image"
                                        value={form.imageUrl}
                                        onChange={(url: string) => setForm({ ...form, imageUrl: url })}
                                    />
                                    <div style={{ marginTop: '14px' }}>
                                        <label style={label}>Link when clicked <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
                                        <input
                                            style={input}
                                            value={form.link}
                                            onChange={e => setForm({ ...form, link: e.target.value })}
                                            placeholder="/products?s=Honey"
                                        />
                                    </div>
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', fontWeight: 600, color: '#344054', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                                Show this banner on the homepage
                            </label>
                        </div>

                        <div style={{ padding: '16px 22px', borderTop: '1px solid #f2f4f7', display: 'flex', justifyContent: 'flex-end', gap: '9px' }}>
                            <button onClick={() => setDialogOpen(false)} style={{ ...btn, background: '#fff', color: '#344054', border: '1px solid #e4e7ec' }}>Cancel</button>
                            <button onClick={saveDialog} style={btnPrimary}>
                                <FiCheckCircle size={14} /> {editing ? 'Update Banner' : 'Add Banner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* Media-type toggle used inside the hero dialog */
function toggleBtn(active: boolean): React.CSSProperties {
    return {
        ...btn, padding: '7px 16px', fontSize: '12.5px',
        background: active ? 'var(--color-primary)' : '#f3f4f6',
        color: active ? '#fff' : '#555',
    };
}


/* ------------------------------------------------------------------- */
/* --- HOME SECTIONS TAB --- */
/* Each row here renders one product slider on the home page. */
const SECTION_SOURCES = [
    { value: 'newest', label: 'Newest products' },
    { value: 'best-selling', label: 'Best selling (most sold)' },
    { value: 'top-rated', label: 'Top rated' },
    { value: 'category', label: 'From a category' },
    { value: 'flag', label: 'By product flag' },
    { value: 'manual', label: 'Hand-picked products' },
];

const SECTION_FLAGS = [
    { value: 'best-selling', label: 'Best Selling' },
    { value: 'new-arrival', label: 'New Arrival' },
    { value: 'featured', label: 'Featured' },
    { value: 'on-sale', label: 'On Sale' },
    { value: 'combo', label: 'Exclusive Combo Deals' },
];

function HomeSectionsTab({ data, setData }: { data: any; setData: any }) {
    const sections: any[] = data.homeSections || [];
    const { data: catRes } = useGetCategoriesQuery({});
    const categories: any[] = catRes?.data || [];

    const write = (next: any[]) => setData({ ...data, homeSections: next });

    const update = (i: number, field: string, value: any) => {
        const next = [...sections];
        next[i] = { ...next[i], [field]: value };
        write(next);
    };

    const add = () => write([
        ...sections,
        { title: 'New Section', source: 'newest', limit: 10, active: true, order: sections.length, products: [] },
    ]);

    const remove = (i: number) => write(sections.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx })));

    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= sections.length) return;
        const next = [...sections];
        [next[i], next[j]] = [next[j], next[i]];
        write(next.map((s, idx) => ({ ...s, order: idx })));
    };

    return (
        <div>
            <div style={{ ...card, background: 'var(--color-primary-surface)', borderColor: '#bbf7d0' }}>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: 0 }}>
                    Each section below becomes one product slider on the home page. Reorder, rename, hide or delete
                    them freely — then hit <strong>Save Changes</strong> at the top.
                </p>
            </div>

            {sections.length === 0 && (
                <div style={{ ...card, textAlign: 'center', color: '#888', fontSize: '13px' }}>
                    No sections yet. Add one to show a product slider on the home page.
                </div>
            )}

            {sections.map((s, i) => (
                <div key={i} style={{ ...card, opacity: s.active === false ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#999' }}>#{i + 1}</span>
                        <input
                            style={{ ...input, fontWeight: 700 }}
                            value={s.title || ''}
                            onChange={e => update(i, 'title', e.target.value)}
                            placeholder="Section title (e.g. Organic Certified)"
                        />
                        <button onClick={() => move(i, -1)} style={btnSmall} title="Move up"><FiArrowUp size={13} /></button>
                        <button onClick={() => move(i, 1)} style={btnSmall} title="Move down"><FiArrowDown size={13} /></button>
                        <button onClick={() => remove(i)} style={btnDanger} title="Delete"><FiTrash2 size={13} /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <div>
                            <label style={label}>Display style</label>
                            <select style={input} value={s.layout || 'slider'} onChange={e => update(i, 'layout', e.target.value)}>
                                <option value="slider">Normal slider</option>
                                <option value="combo">Combo Deals (orange cards)</option>
                            </select>
                        </div>

                        <div>
                            <label style={label}>Products from</label>
                            <select style={input} value={s.source || 'newest'} onChange={e => update(i, 'source', e.target.value)}>
                                {SECTION_SOURCES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {s.source === 'category' && (
                            <div>
                                <label style={label}>Category</label>
                                <select
                                    style={input}
                                    value={(typeof s.category === 'object' ? s.category?._id : s.category) || ''}
                                    onChange={e => update(i, 'category', e.target.value || null)}
                                >
                                    <option value="">— Select —</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}

                        {s.source === 'flag' && (
                            <div>
                                <label style={label}>Flag</label>
                                <select style={input} value={s.flag || ''} onChange={e => update(i, 'flag', e.target.value)}>
                                    <option value="">— Select —</option>
                                    {SECTION_FLAGS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={label}>How many products</label>
                            <input
                                type="number" min={1} max={40} style={input}
                                value={s.limit ?? 10}
                                onChange={e => update(i, 'limit', Number(e.target.value))}
                                disabled={s.source === 'manual'}
                            />
                        </div>

                        <div>
                            <label style={label}>&quot;View all&quot; link <span style={{ color: '#bbb' }}>(optional)</span></label>
                            <input
                                style={input}
                                value={s.viewAllHref || ''}
                                onChange={e => update(i, 'viewAllHref', e.target.value)}
                                placeholder="/products?category=..."
                            />
                        </div>

                        <div>
                            <label style={label}>Visible</label>
                            <button
                                onClick={() => update(i, 'active', s.active === false)}
                                style={{
                                    ...btn, width: '100%', justifyContent: 'center',
                                    background: s.active === false ? '#f3f4f6' : 'var(--color-primary)',
                                    color: s.active === false ? '#888' : '#fff',
                                }}
                            >
                                {s.active === false ? 'Hidden' : 'Shown'}
                            </button>
                        </div>
                    </div>

                    {s.source === 'manual' && (
                        <ManualProductPicker
                            selected={s.products || []}
                            onChange={(ids) => update(i, 'products', ids)}
                        />
                    )}
                </div>
            ))}

            <button onClick={add} style={{ ...btnPrimary, marginTop: '4px' }}>
                <FiPlus size={14} /> Add Section
            </button>
        </div>
    );
}

/* Search-and-pick list for "Hand-picked products" sections. */
function ManualProductPicker({ selected, onChange }: { selected: any[]; onChange: (ids: string[]) => void }) {
    const [term, setTerm] = useState('');
    const ids = selected.map((p: any) => (typeof p === 'object' && p ? p._id : p)).filter(Boolean);

    const { data: searchRes } = useGetProductsQuery({ limit: 8, searchTerm: term }, { skip: term.trim().length < 2 });
    const { data: pickedRes } = useGetProductsQuery({ limit: 40, ids: ids.join(',') }, { skip: ids.length === 0 });

    const results: any[] = searchRes?.data || [];
    const picked: any[] = pickedRes?.data || [];
    const orderedPicked = [...picked].sort((a, b) => ids.indexOf(String(a._id)) - ids.indexOf(String(b._id)));

    return (
        <div style={{ marginTop: '14px', borderTop: '1px dashed #e5e7eb', paddingTop: '14px' }}>
            <label style={label}>Picked products <span style={{ color: '#bbb' }}>({ids.length})</span></label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {orderedPicked.map(p => (
                    <span key={p._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f3f4f6', borderRadius: '20px', padding: '4px 10px', fontSize: '12px' }}>
                        {p.name?.slice(0, 34)}{p.name?.length > 34 ? '…' : ''}
                        <FiX
                            size={12}
                            style={{ cursor: 'pointer', color: '#dc2626' }}
                            onClick={() => onChange(ids.filter(id => id !== String(p._id)))}
                        />
                    </span>
                ))}
                {ids.length === 0 && <span style={{ fontSize: '12px', color: '#aaa' }}>Nothing picked yet</span>}
            </div>

            <div style={{ position: 'relative' }}>
                <FiSearch size={13} style={{ position: 'absolute', left: '10px', top: '11px', color: '#aaa' }} />
                <input
                    style={{ ...input, paddingLeft: '30px' }}
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    placeholder="Search a product to add..."
                />
            </div>

            {results.length > 0 && (
                <div style={{ border: '1px solid #eee', borderRadius: '7px', marginTop: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {results.map(p => {
                        const already = ids.includes(String(p._id));
                        return (
                            <button
                                key={p._id}
                                onClick={() => !already && onChange([...ids, String(p._id)])}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                                    padding: '8px 10px', border: 'none', borderBottom: '1px solid #f3f4f6',
                                    background: already ? '#f9fafb' : '#fff', cursor: already ? 'default' : 'pointer',
                                    fontSize: '12.5px', color: already ? '#aaa' : '#333', textAlign: 'left',
                                }}
                            >
                                {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />}
                                <span style={{ flex: 1 }}>{p.name}</span>
                                {already ? <FiCheckCircle size={13} /> : <FiPlus size={13} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


/* ------------------------------------------------------------------- */
/* --- NAVIGATION MENU TAB --- */
/* Builds the green header bar: top-level items with optional sub menus. */
function NavMenuTab({ data, setData }: { data: any; setData: any }) {
    const menu: any[] = data.navMenu || [];
    const [openItem, setOpenItem] = useState<number | null>(0);

    const write = (next: any[]) => setData({ ...data, navMenu: next.map((m, i) => ({ ...m, order: i })) });

    const update = (i: number, field: string, value: any) => {
        const next = [...menu];
        next[i] = { ...next[i], [field]: value };
        write(next);
    };

    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= menu.length) return;
        const next = [...menu];
        [next[i], next[j]] = [next[j], next[i]];
        write(next);
        setOpenItem(j);
    };

    const addItem = () => {
        write([...menu, { label: 'New Menu', href: '/products', active: true, position: 'after', children: [] }]);
        setOpenItem(menu.length);
    };

    const removeItem = (i: number) => write(menu.filter((_, idx) => idx !== i));

    /* Sub menu helpers */
    const setChildren = (i: number, children: any[]) =>
        update(i, 'children', children.map((c, idx) => ({ ...c, order: idx })));

    const addChild = (i: number) =>
        setChildren(i, [...(menu[i].children || []), { label: 'New Sub Menu', href: '/products', active: true }]);

    const updateChild = (i: number, ci: number, field: string, value: any) => {
        const kids = [...(menu[i].children || [])];
        kids[ci] = { ...kids[ci], [field]: value };
        setChildren(i, kids);
    };

    const removeChild = (i: number, ci: number) =>
        setChildren(i, (menu[i].children || []).filter((_: any, idx: number) => idx !== ci));

    const moveChild = (i: number, ci: number, dir: -1 | 1) => {
        const kids = [...(menu[i].children || [])];
        const j = ci + dir;
        if (j < 0 || j >= kids.length) return;
        [kids[ci], kids[j]] = [kids[j], kids[ci]];
        setChildren(i, kids);
    };

    const chip: React.CSSProperties = {
        fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px',
        background: '#f3f4f6', color: '#666',
    };

    return (
        <div>
            <div style={{ ...card, background: 'var(--color-primary-surface)', borderColor: '#bbf7d0' }}>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: 0 }}>
                    Your categories already show in the green menu bar automatically — every category with
                    <strong> Show in Menu</strong> on becomes an item, with its subcategories as the dropdown. Manage
                    those on the <strong>Categories</strong> page. Use this tab only for <strong>extra</strong> links
                    that are not categories (Offer Zone, About Us…), and pick whether each sits before or after the
                    categories. Then hit <strong>Save Changes</strong> at the top.
                </p>
            </div>

            {menu.length === 0 && (
                <div style={{ ...card, textAlign: 'center', color: '#888', fontSize: '13px' }}>
                    No extra items — the nav bar is showing your categories only. That is the normal setup.
                </div>
            )}

            {menu.map((m, i) => {
                const isOpen = openItem === i;
                const kids = m.children || [];
                return (
                    <div key={i} style={{ ...card, padding: 0, overflow: 'hidden', opacity: m.active === false ? 0.65 : 1 }}>
                        {/* Row header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: isOpen ? '#fafafa' : '#fff', borderBottom: isOpen ? '1px solid #eee' : 'none' }}>
                            <FiMenu size={14} style={{ color: '#bbb' }} />
                            <button
                                onClick={() => setOpenItem(isOpen ? null : i)}
                                style={{ ...btn, background: 'transparent', padding: 0, fontSize: '14px', fontWeight: 700, color: '#111', flex: 1, justifyContent: 'flex-start' }}
                            >
                                {m.label || 'Untitled'}
                                {kids.length > 0 && <span style={chip}>{kids.length} sub</span>}
                                {m.active === false && <span style={{ ...chip, background: '#fef2f2', color: '#dc2626' }}>hidden</span>}
                            </button>
                            <button onClick={() => move(i, -1)} style={btnSmall} title="Move up"><FiArrowUp size={13} /></button>
                            <button onClick={() => move(i, 1)} style={btnSmall} title="Move down"><FiArrowDown size={13} /></button>
                            <button onClick={() => removeItem(i)} style={btnDanger} title="Delete"><FiTrash2 size={13} /></button>
                        </div>

                        {isOpen && (
                            <div style={{ padding: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                    <div>
                                        <label style={label}>Menu name</label>
                                        <input style={input} value={m.label || ''} onChange={e => update(i, 'label', e.target.value)} placeholder="e.g. Honey" />
                                    </div>
                                    <div>
                                        <label style={label}>Link</label>
                                        <input style={input} value={m.href || ''} onChange={e => update(i, 'href', e.target.value)} placeholder="/products?category=..." />
                                    </div>
                                    <div>
                                        <label style={label}>Visible</label>
                                        <button
                                            onClick={() => update(i, 'active', m.active === false)}
                                            style={{
                                                ...btn, width: '100%', justifyContent: 'center',
                                                background: m.active === false ? '#f3f4f6' : 'var(--color-primary)',
                                                color: m.active === false ? '#888' : '#fff',
                                            }}
                                        >
                                            {m.active === false ? 'Hidden' : 'Shown'}
                                        </button>
                                    </div>
                                    <div>
                                        <label style={label}>Place in nav bar</label>
                                        <select
                                            style={input}
                                            value={m.position === 'before' ? 'before' : 'after'}
                                            onChange={e => update(i, 'position', e.target.value)}
                                        >
                                            <option value="before">Before the categories</option>
                                            <option value="after">After the categories</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Sub menus */}
                                <div style={{ marginTop: '18px', borderTop: '1px dashed #e5e7eb', paddingTop: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#555' }}>
                                            Sub menu items <span style={{ color: '#bbb' }}>({kids.length})</span>
                                        </span>
                                        <button onClick={() => addChild(i)} style={btnSmall}><FiPlus size={12} /> Add sub menu</button>
                                    </div>

                                    {kids.length === 0 && (
                                        <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 6px' }}>
                                            No sub menu — this item will be a plain link with no dropdown.
                                        </p>
                                    )}

                                    {kids.map((c: any, ci: number) => (
                                        <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <FiCornerDownRight size={14} style={{ color: '#ccc', flexShrink: 0 }} />
                                            <input
                                                style={{ ...input, flex: '1 1 160px' }}
                                                value={c.label || ''}
                                                onChange={e => updateChild(i, ci, 'label', e.target.value)}
                                                placeholder="Sub menu name"
                                            />
                                            <input
                                                style={{ ...input, flex: '1 1 200px' }}
                                                value={c.href || ''}
                                                onChange={e => updateChild(i, ci, 'href', e.target.value)}
                                                placeholder="/products?subcategory=..."
                                            />
                                            <button onClick={() => moveChild(i, ci, -1)} style={btnSmall} title="Move up"><FiArrowUp size={12} /></button>
                                            <button onClick={() => moveChild(i, ci, 1)} style={btnSmall} title="Move down"><FiArrowDown size={12} /></button>
                                            <button onClick={() => removeChild(i, ci)} style={btnDanger} title="Delete"><FiTrash2 size={12} /></button>
                                        </div>
                                    ))}
                                </div>

                                {m.href && (
                                    <a
                                        href={m.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#888', marginTop: '10px', textDecoration: 'none' }}
                                    >
                                        <FiExternalLink size={11} /> Preview link
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            <button onClick={addItem} style={{ ...btnPrimary, marginTop: '4px' }}>
                <FiPlus size={14} /> Add Menu Item
            </button>
        </div>
    );
}
