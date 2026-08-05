"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiTag, FiPackage } from 'react-icons/fi';
import { useCreateProductMutation } from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { SingleImageUploader, MultipleImageUploader } from '@/components/ui/ImageUploader';

/* ─── Types ─── */
type Variant = {
    color: string; colorHex: string; size: string;
    price: string; originalPrice: string; stock: string;
    sku: string; note: string; images: string;
};

const emptyVariant = (): Variant => ({
    color: '', colorHex: '#000000', size: '',
    price: '', originalPrice: '', stock: '0',
    sku: '', note: '', images: '',
});

/* ─── Section Heading ─── */
const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
            <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
    </div>
);

/* ─── Shared styles ─── */
const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
    borderRadius: '8px', fontSize: '13.5px', color: '#1a1a1a',
    background: '#fafafa', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
};
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' };
const row: React.CSSProperties = { display: 'flex', gap: '14px', flexWrap: 'wrap' };
const col = (flex = '1 1 200px'): React.CSSProperties => ({ flex, display: 'flex', flexDirection: 'column' });
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--color-primary)'; };
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.target.style.borderColor = '#e5e7eb'; };

/* ─── Tag Input Component ─── */
function TagInput({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
    const [text, setText] = useState('');
    const add = () => { const t = text.trim(); if (t && !value.includes(t)) onChange([...value, t]); setText(''); };
    return (
        <div>
            <label style={lbl}>{label}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {value.map((tag, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-primary-lightest)', border: '1px solid #bbf7d0', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 500, padding: '3px 8px', borderRadius: '999px' }}>
                        {tag}
                        <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder || 'Type and press Enter'} style={{ ...inp, flex: 1 }} onFocus={focus} onBlur={blur} />
                <button type="button" onClick={add} style={{ padding: '8px 14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
            </div>
        </div>
    );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function NewProductPage() {
    const router = useRouter();
    const [createProduct, { isLoading }] = useCreateProductMutation();
    const { data: categoriesData } = useGetCategoriesQuery({});
    const categories = categoriesData?.data || [];

    /* ── Form State ── */
    const [form, setForm] = useState({
        name: '', description: '', tagline: '', priceType: 'negotiable',
        price: '', originalPrice: '',
        category: '', status: 'active', visibility: 'visible', stock: '0',
    });
    const [thumbnail, setThumbnail]   = useState('');
    const [extraImages, setExtraImages] = useState<string[]>([]);
    const [tags, setTags]         = useState<string[]>([]);
    const [colors, setColors]     = useState<string[]>([]);
    const [colorHex, setColorHex] = useState<string[]>([]);
    const [sizes, setSizes]       = useState<string[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [colorInput, setColorInput] = useState({ name: '', hex: '#000000' });

    const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    /* ── Color helpers ── */
    const addColor = () => {
        const n = colorInput.name.trim();
        if (!n) return;
        setColors(p => [...p, n]);
        setColorHex(p => [...p, colorInput.hex]);
        setColorInput({ name: '', hex: '#000000' });
    };
    const removeColor = (i: number) => {
        setColors(p => p.filter((_, j) => j !== i));
        setColorHex(p => p.filter((_, j) => j !== i));
    };

    /* ── Variant helpers ── */
    const addVariant    = () => setVariants(p => [...p, emptyVariant()]);
    const removeVariant = (i: number) => setVariants(p => p.filter((_, j) => j !== i));
    const setV = (i: number, k: keyof Variant, v: string) =>
        setVariants(p => p.map((vr, j) => j === i ? { ...vr, [k]: v } : vr));

    /* ── Discount preview helper ── */
    const discPct = (price: string, orig: string) => {
        const p = Number(price), o = Number(orig);
        return p > 0 && o > p ? Math.round(((o - p) / o) * 100) : 0;
    };

    /* ── Submit ── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.description || !form.price || !thumbnail || !form.category) {
            setToast({ type: 'error', msg: 'Name, Description, Price, Thumbnail, Category — সব required!' });
            setTimeout(() => setToast(null), 4000);
            return;
        }

        const payload: any = {
            name:          form.name,
            description:   form.description,
            tagline:       form.tagline || undefined,
            priceType:     form.priceType,
            price:         Number(form.price),
            originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
            thumbnail:     thumbnail,
            images:        extraImages,
            category:      form.category,
            status:        form.status,
            visibility:    form.visibility,
            stock:         Number(form.stock) || 0,
            tags, colors, colorHex, sizes,
            variants: variants
                .map(v => ({
                    color:         v.color,
                    colorHex:      v.colorHex,
                    size:          v.size,
                    price:         Number(v.price),
                    originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
                    stock:         Number(v.stock) || 0,
                    sku:           v.sku  || '',
                    note:          v.note || '',
                    images:        v.images ? v.images.split('\n').map(s => s.trim()).filter(Boolean) : [],
                }))
                .filter(v => v.price > 0),
        };

        try {
            await createProduct(payload).unwrap();
            setToast({ type: 'success', msg: '✅ Product সফলভাবে তৈরি হয়েছে!' });
            setTimeout(() => router.push('/dashboard/admin/products'), 1500);
        } catch (err: any) {
            setToast({ type: 'error', msg: err?.data?.message || 'কিছু একটা সমস্যা হয়েছে!' });
            setTimeout(() => setToast(null), 5000);
        }
    };

    /* ════════════════ RENDER ════════════════ */
    return (
        <div>
            {/* ── Toast Notification ── */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: toast.type === 'success' ? 'var(--color-primary-lightest)' : '#fef2f2',
                    border: `1.5px solid ${toast.type === 'success' ? '#16a34a' : '#ef4444'}`,
                    color: toast.type === 'success' ? '#166534' : '#dc2626',
                    padding: '12px 18px', borderRadius: '10px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    fontSize: '13px', fontWeight: 600, maxWidth: '360px',
                }}>
                    {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                    <FiArrowLeft size={15} /> Back
                </button>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>New Product</h1>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>required (*) field সব পূরণ করুন</p>
                </div>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* ════ LEFT COLUMN ════ */}
                    <div style={{ flex: '1 1 520px', minWidth: 0 }}>

                        {/* 1. Basic Info */}
                        <Section icon={<FiTag size={16} />} title="Basic Info">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={lbl}>Product Name <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Premium Cotton T-Shirt" style={inp} onFocus={focus} onBlur={blur} />
                                </div>
                                <div>
                                    <label style={lbl}>Description <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Product এর বিস্তারিত বিবরণ..." rows={5} style={{ ...inp, resize: 'vertical', minHeight: '120px' }} onFocus={focus} onBlur={blur} />
                                </div>
                                <div style={row}>
                                    <div style={col()}>
                                        <label style={lbl}>Tagline</label>
                                        <input value={form.tagline} onChange={e => setF('tagline', e.target.value)} placeholder="Lower price than others but quality higher" style={inp} onFocus={focus} onBlur={blur} />
                                    </div>
                                    <div style={col('0 0 155px')}>
                                        <label style={lbl}>Price Type</label>
                                        <select value={form.priceType} onChange={e => setF('priceType', e.target.value)} style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                                            <option value="negotiable">Negotiable</option>
                                            <option value="fixed">Fixed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 2. Pricing */}
                        <Section icon={<span style={{ fontWeight: 800, fontSize: '15px' }}>৳</span>} title="Pricing">
                            <div style={row}>
                                <div style={col()}>
                                    <label style={lbl}>Selling Price (৳) <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0" style={inp} min="0" onFocus={focus} onBlur={blur} />
                                </div>
                                <div style={col()}>
                                    <label style={lbl}>Original / MRP (৳) <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>— discount auto হবে</span></label>
                                    <input type="number" value={form.originalPrice} onChange={e => setF('originalPrice', e.target.value)} placeholder="Optional" style={inp} min="0" onFocus={focus} onBlur={blur} />
                                </div>
                            </div>
                            {discPct(form.price, form.originalPrice) > 0 && (
                                <div style={{ marginTop: '10px', padding: '8px 14px', background: 'var(--color-primary-lightest)', borderRadius: '8px', fontSize: '12.5px', color: 'var(--color-primary)', fontWeight: 700 }}>
                                    ✅ Discount: {discPct(form.price, form.originalPrice)}% — automatically saved হবে
                                </div>
                            )}
                        </Section>

                        {/* 3. Images */}
                        <Section icon={<FiTag size={16} />} title="Images">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <SingleImageUploader
                                    label="Thumbnail"
                                    value={thumbnail}
                                    onChange={setThumbnail}
                                    required
                                />
                                <MultipleImageUploader
                                    label="Extra Images"
                                    values={extraImages}
                                    onChange={setExtraImages}
                                    max={8}
                                />
                            </div>
                        </Section>

                        {/* 4. Variations — WooCommerce-style */}
                        <Section icon={<FiPackage size={16} />} title="Product Variations">
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px 0', lineHeight: 1.6 }}>
                                Color ও Size যোগ করে <strong>"Generate Variants"</strong> ক্লিক করুন। প্রতিটা combination এর আলাদা price, stock ও images দিতে পারবেন।
                            </p>

                            {/* ── Step 1: Define Colors ── */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ ...lbl, fontSize: '13px', marginBottom: '8px' }}>🎨 Colors</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                    {colors.map((c, i) => (
                                        <span key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
                                            fontSize: '13px', padding: '6px 12px', fontWeight: 600,
                                        }}>
                                            <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: colorHex[i], border: '1px solid #ddd', flexShrink: 0 }} />
                                            {c}
                                            <button type="button" onClick={() => removeColor(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px', lineHeight: 1, padding: 0, marginLeft: '2px' }}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input type="color" value={colorInput.hex} onChange={e => setColorInput(p => ({ ...p, hex: e.target.value }))} style={{ width: '42px', height: '40px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                                    <input value={colorInput.name} onChange={e => setColorInput(p => ({ ...p, name: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} placeholder="Color নাম লিখুন (e.g. Sky Blue)" style={{ ...inp, flex: 1 }} onFocus={focus} onBlur={blur} />
                                    <button type="button" onClick={addColor} style={{ padding: '9px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                                </div>
                            </div>

                            {/* ── Step 2: Define Sizes ── */}
                            <div style={{ marginBottom: '16px' }}>
                                <TagInput label="📐 Sizes" value={sizes} onChange={setSizes} placeholder="S, M, L, XL, XXL, Free Size..." />
                            </div>

                            {/* ── Step 3: Generate / Bulk Actions ── */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                <button type="button" onClick={() => {
                                    const newVariants: Variant[] = [];
                                    const defPrice = form.price || '0';
                                    const defOrigPrice = form.originalPrice || '';
                                    if (colors.length > 0 && sizes.length > 0) {
                                        colors.forEach((c, ci) => {
                                            sizes.forEach(s => {
                                                // Skip if already exists
                                                if (variants.some(v => v.color === c && v.size === s)) return;
                                                newVariants.push({ ...emptyVariant(), color: c, colorHex: colorHex[ci] || '#000000', size: s, price: defPrice, originalPrice: defOrigPrice, stock: '0' });
                                            });
                                        });
                                    } else if (colors.length > 0) {
                                        colors.forEach((c, ci) => {
                                            if (variants.some(v => v.color === c && !v.size)) return;
                                            newVariants.push({ ...emptyVariant(), color: c, colorHex: colorHex[ci] || '#000000', price: defPrice, originalPrice: defOrigPrice, stock: '0' });
                                        });
                                    } else if (sizes.length > 0) {
                                        sizes.forEach(s => {
                                            if (variants.some(v => v.size === s && !v.color)) return;
                                            newVariants.push({ ...emptyVariant(), size: s, price: defPrice, originalPrice: defOrigPrice, stock: '0' });
                                        });
                                    }
                                    if (newVariants.length > 0) setVariants(p => [...p, ...newVariants]);
                                }} disabled={colors.length === 0 && sizes.length === 0} style={{
                                    padding: '10px 20px', background: (colors.length === 0 && sizes.length === 0) ? '#e5e7eb' : 'var(--color-primary)',
                                    color: (colors.length === 0 && sizes.length === 0) ? '#9ca3af' : '#fff',
                                    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                                    cursor: (colors.length === 0 && sizes.length === 0) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    🔄 Generate Variants {colors.length > 0 && sizes.length > 0 ? `(${colors.length} × ${sizes.length} = ${colors.length * sizes.length})` : ''}
                                </button>
                                {variants.length > 0 && (
                                    <button type="button" onClick={() => { if (confirm('সব variant মুছে ফেলবেন?')) setVariants([]); }} style={{ padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                        🗑 Clear All
                                    </button>
                                )}
                            </div>

                            {/* ── Bulk Set ── */}
                            {variants.length > 0 && (
                                <div style={{ background: 'var(--color-primary-lightest)', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 10px' }}>⚡ Bulk Set — সব variant এ একসাথে</p>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                        <div style={{ flex: '1 1 120px' }}>
                                            <label style={{ ...lbl, fontSize: '11px' }}>Price (৳)</label>
                                            <input type="number" placeholder="All price" style={inp} min="0" onFocus={focus} onBlur={blur}
                                                onChange={e => { const val = e.target.value; if (val) setVariants(p => p.map(v => ({ ...v, price: val }))); }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px' }}>
                                            <label style={{ ...lbl, fontSize: '11px' }}>MRP (৳)</label>
                                            <input type="number" placeholder="All MRP" style={inp} min="0" onFocus={focus} onBlur={blur}
                                                onChange={e => { const val = e.target.value; if (val) setVariants(p => p.map(v => ({ ...v, originalPrice: val }))); }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 120px' }}>
                                            <label style={{ ...lbl, fontSize: '11px' }}>Stock</label>
                                            <input type="number" placeholder="All stock" style={inp} min="0" onFocus={focus} onBlur={blur}
                                                onChange={e => { const val = e.target.value; if (val) setVariants(p => p.map(v => ({ ...v, stock: val }))); }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Variant Cards ── */}
                            {variants.length > 0 && (
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                                    {variants.length} variant{variants.length > 1 ? 's' : ''} — প্রতিটা expand করে edit করুন
                                </div>
                            )}
                            {variants.map((v, i) => (
                                <details key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '8px', background: '#fafafa', overflow: 'hidden' }}>
                                    <summary style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                                        cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#1a1a1a',
                                        listStyle: 'none', userSelect: 'none',
                                    }}>
                                        {v.colorHex && v.colorHex !== '#000000' && (
                                            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: v.colorHex, border: '1px solid #ddd', flexShrink: 0 }} />
                                        )}
                                        <span style={{ flex: 1 }}>
                                            {[v.color, v.size].filter(Boolean).join(' / ') || `Variant #${i + 1}`}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
                                            ৳{v.price || '0'} • Stock: {v.stock || '0'}
                                        </span>
                                        <button type="button" onClick={(e) => { e.preventDefault(); removeVariant(i); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <FiTrash2 size={11} /> ×
                                        </button>
                                    </summary>
                                    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                                            <div>
                                                <label style={lbl}>Color</label>
                                                <input value={v.color} onChange={e => setV(i, 'color', e.target.value)} placeholder="Red" style={inp} onFocus={focus} onBlur={blur} />
                                            </div>
                                            <div>
                                                <label style={lbl}>Color Hex</label>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <input type="color" value={v.colorHex} onChange={e => setV(i, 'colorHex', e.target.value)} style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                                                    <input value={v.colorHex} onChange={e => setV(i, 'colorHex', e.target.value)} style={{ ...inp, flex: 1 }} onFocus={focus} onBlur={blur} />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={lbl}>Size</label>
                                                <input value={v.size} onChange={e => setV(i, 'size', e.target.value)} placeholder="M" style={inp} onFocus={focus} onBlur={blur} />
                                            </div>
                                            <div>
                                                <label style={lbl}>Price (৳) <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                                <input type="number" value={v.price} onChange={e => setV(i, 'price', e.target.value)} placeholder="0" style={inp} min="0" onFocus={focus} onBlur={blur} />
                                            </div>
                                            <div>
                                                <label style={lbl}>MRP (৳)</label>
                                                <input type="number" value={v.originalPrice} onChange={e => setV(i, 'originalPrice', e.target.value)} placeholder="0" style={inp} min="0" onFocus={focus} onBlur={blur} />
                                            </div>
                                            <div>
                                                <label style={lbl}>Stock</label>
                                                <input type="number" value={v.stock} onChange={e => setV(i, 'stock', e.target.value)} placeholder="0" style={inp} min="0" onFocus={focus} onBlur={blur} />
                                            </div>
                                        </div>
                                        {/* Variant Images */}
                                        <div style={{ marginTop: '10px' }}>
                                            <label style={lbl}>Images <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>— প্রতিটা URL নতুন লাইনে</span></label>
                                            <textarea value={v.images} onChange={e => setV(i, 'images', e.target.value)} placeholder={"https://example.com/red-front.jpg\nhttps://example.com/red-back.jpg"} rows={2} style={{ ...inp, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
                                        </div>
                                        {discPct(v.price, v.originalPrice) > 0 && (
                                            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700, background: 'var(--color-primary-lightest)', padding: '5px 12px', borderRadius: '6px', display: 'inline-block' }}>
                                                ✅ Discount: {discPct(v.price, v.originalPrice)}%
                                            </div>
                                        )}
                                    </div>
                                </details>
                            ))}

                            {/* Manual add (fallback) */}
                            <button type="button" onClick={addVariant} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#fff', border: '1px dashed #d1d5db', color: '#6b7280', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, marginTop: '8px' }}>
                                <FiPlus size={14} /> Manually Add Single Variant
                            </button>
                        </Section>


                    </div>

                    {/* ════ RIGHT COLUMN ════ */}
                    <div style={{ flex: '0 0 290px', minWidth: '260px' }}>

                        {/* Category & Status */}
                        <Section icon={<span style={{ fontSize: '14px' }}>📂</span>} title="Category & Status">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={lbl}>Category <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <select value={form.category} onChange={e => setF('category', e.target.value)} style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                                        <option value="">— Select Category —</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Status</label>
                                    <select value={form.status} onChange={e => setF('status', e.target.value)} style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                                        <option value="active">Active</option>
                                        <option value="draft">Draft</option>
                                        <option value="out-of-stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Visibility</label>
                                    <select value={form.visibility} onChange={e => setF('visibility', e.target.value)} style={{ ...inp, cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                                        <option value="visible">Visible</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Base Stock <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(variant না থাকলে)</span></label>
                                    <input type="number" value={form.stock} onChange={e => setF('stock', e.target.value)} placeholder="0" style={inp} min="0" onFocus={focus} onBlur={blur} />
                                </div>
                            </div>
                        </Section>

                        {/* Filter Tags */}
                        <Section icon={<FiTag size={16} />} title="Search Tags">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <TagInput label="Tags" value={tags} onChange={setTags} placeholder="shoe, cotton, premium..." />
                            </div>
                        </Section>

                        {/* ── Submit Button — sticky ── */}
                        <div style={{ position: 'sticky', bottom: '20px' }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    width: '100%', padding: '14px 20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    background: isLoading ? '#6b7280' : 'linear-gradient(135deg, var(--color-primary) 0%, #0d5c30 100%)',
                                    color: '#fff', border: 'none', borderRadius: '10px',
                                    fontSize: '14px', fontWeight: 700,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 16px rgba(11,66,34,0.3)',
                                    transition: 'opacity 0.2s ease',
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                                        Saving...
                                    </>
                                ) : (
                                    <><FiCheckCircle size={16} /> Create Product</>
                                )}
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '11.5px', color: '#9ca3af', marginTop: '8px', margin: '8px 0 0' }}>
                                Discount % automatically calculated হবে
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
