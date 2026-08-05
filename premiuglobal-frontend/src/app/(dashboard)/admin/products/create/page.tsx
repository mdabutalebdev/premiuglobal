"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTrash2, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiImage, FiTag, FiPackage } from 'react-icons/fi';
import { useCreateProductMutation } from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';

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

/* ─── Input ─── */
const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb',
    borderRadius: '8px', fontSize: '13.5px', color: '#1a1a1a',
    background: '#fafafa', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
};
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '5px' };
const row: React.CSSProperties = { display: 'flex', gap: '14px', flexWrap: 'wrap' };
const col = (flex = '1 1 200px'): React.CSSProperties => ({ flex, display: 'flex', flexDirection: 'column' });

/* ─── Tag Input ─── */
function TagInput({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
    const [inp2, setInp2] = useState('');
    const add = () => { const t = inp2.trim(); if (t && !value.includes(t)) onChange([...value, t]); setInp2(''); };
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
                <input value={inp2} onChange={e => setInp2(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder || 'Type and press Enter'} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={add} style={{ padding: '8px 14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Add</button>
            </div>
        </div>
    );
}

/* ─── Page ─── */
export default function CreateProductPage() {
    const router = useRouter();
    const [createProduct, { isLoading }] = useCreateProductMutation();
    const { data: categoriesData } = useGetCategoriesQuery({});
    const categories = categoriesData?.data || [];

    /* Form State */
    const [form, setForm] = useState({
        name: '', description: '', tagline: '', priceType: 'negotiable',
        price: '', originalPrice: '',
        thumbnail: '', images: '',
        category: '', country: '', status: 'active', visibility: 'visible', stock: '0',
    });
    const [tags, setTags] = useState<string[]>([]);
    const [colors, setColors] = useState<string[]>([]);
    const [colorHex, setColorHex] = useState<string[]>([]);
    const [sizes, setSizes] = useState<string[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    /* Color Pair Helper */
    const [colorInput, setColorInput] = useState({ name: '', hex: '#000000' });
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

    /* Variants */
    const addVariant = () => setVariants(p => [...p, emptyVariant()]);
    const removeVariant = (i: number) => setVariants(p => p.filter((_, j) => j !== i));
    const setV = (i: number, k: keyof Variant, v: string) => setVariants(p => p.map((vr, j) => j === i ? { ...vr, [k]: v } : vr));

    /* Submit */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.description || !form.price || !form.thumbnail || !form.category) {
            setToast({ type: 'error', msg: 'Name, Description, Price, Thumbnail, Category — সব required!' });
            setTimeout(() => setToast(null), 4000);
            return;
        }

        const payload: any = {
            name:         form.name,
            description:  form.description,
            tagline:      form.tagline || undefined,
            priceType:    form.priceType,
            price:        Number(form.price),
            originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
            thumbnail:    form.thumbnail,
            images:       form.images ? form.images.split('\n').map(s => s.trim()).filter(Boolean) : [],
            category:     form.category,
            country:      form.country || undefined,
            status:       form.status,
            visibility:   form.visibility,
            stock:        Number(form.stock) || 0,
            tags, colors, colorHex, sizes,
            variants: variants.map(v => ({
                color:         v.color,
                colorHex:      v.colorHex,
                size:          v.size,
                price:         Number(v.price),
                originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
                stock:         Number(v.stock) || 0,
                sku:           v.sku || '',
                note:          v.note || '',
                images:        v.images ? v.images.split('\n').map(s => s.trim()).filter(Boolean) : [],
            })).filter(v => v.price > 0),
        };

        try {
            await createProduct(payload).unwrap();
            setToast({ type: 'success', msg: 'Product সফলভাবে তৈরি হয়েছে!' });
            setTimeout(() => router.push('/dashboard/admin/products'), 1500);
        } catch (err: any) {
            setToast({ type: 'error', msg: err?.data?.message || 'Something went wrong!' });
            setTimeout(() => setToast(null), 4000);
        }
    };

    return (
        <div>
            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: toast.type === 'success' ? 'var(--color-primary-lightest)' : '#fef2f2',
                    border: `1.5px solid ${toast.type === 'success' ? '#16a34a' : '#ef4444'}`,
                    color: toast.type === 'success' ? '#15803d' : '#dc2626',
                    padding: '12px 18px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    fontSize: '13px', fontWeight: 600, maxWidth: '360px',
                    animation: 'fadeIn 0.3s ease-out',
                }}>
                    {toast.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                    <FiArrowLeft size={15} /> Back
                </button>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Create New Product</h1>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>সব required (*) field পূরণ করুন</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* ════ LEFT COLUMN ════ */}
                    <div style={{ flex: '1 1 520px' }}>

                        {/* 1. Basic Info */}
                        <Section icon={<FiTag size={16} />} title="Basic Info">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={lbl}>Product Name <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Premium Cotton T-Shirt" style={inp} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                                <div>
                                    <label style={lbl}>Description <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <textarea value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Product এর বিস্তারিত বিবরণ লিখুন..." rows={5} style={{ ...inp, resize: 'vertical', minHeight: '120px' }} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                                <div style={row}>
                                    <div style={col()}>
                                        <label style={lbl}>Tagline</label>
                                        <input value={form.tagline} onChange={e => setF('tagline', e.target.value)} placeholder="Lower price than others but quality higher" style={inp} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                    <div style={col('0 0 160px')}>
                                        <label style={lbl}>Price Type</label>
                                        <select value={form.priceType} onChange={e => setF('priceType', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                            <option value="negotiable">Negotiable</option>
                                            <option value="fixed">Fixed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 2. Pricing */}
                        <Section icon={<span style={{ fontWeight: 800, fontSize: '14px' }}>৳</span>} title="Pricing">
                            <div style={row}>
                                <div style={col()}>
                                    <label style={lbl}>Selling Price (৳) <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="0" style={inp} min="0" onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                                <div style={col()}>
                                    <label style={lbl}>Original / MRP (৳) <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>— discount auto-calculate হবে</span></label>
                                    <input type="number" value={form.originalPrice} onChange={e => setF('originalPrice', e.target.value)} placeholder="0 (optional)" style={inp} min="0" onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            </div>
                            {form.price && form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--color-primary-lightest)', borderRadius: '8px', fontSize: '12.5px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                    ✅ Discount: {Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)}% (auto-calculated)
                                </div>
                            )}
                        </Section>

                        {/* 3. Images */}
                        <Section icon={<FiImage size={16} />} title="Images">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={lbl}>Thumbnail URL <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <input value={form.thumbnail} onChange={e => setF('thumbnail', e.target.value)} placeholder="https://example.com/image.jpg" style={inp} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    {form.thumbnail && (
                                        <img src={form.thumbnail} alt="thumb" style={{ marginTop: '8px', width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} onError={e => (e.currentTarget.style.display = 'none')} />
                                    )}
                                </div>
                                <div>
                                    <label style={lbl}>Extra Images <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>— প্রতিটা URL আলাদা লাইনে দিন</span></label>
                                    <textarea value={form.images} onChange={e => setF('images', e.target.value)} placeholder={"https://example.com/img1.jpg\nhttps://example.com/img2.jpg"} rows={3} style={{ ...inp, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            </div>
                        </Section>

                        {/* 4. Variants */}
                        <Section icon={<FiPackage size={16} />} title="Product Variants (Color / Size)">
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 14px' }}>
                                ভিন্ন color বা size এর জন্য আলাদা দাম, stock এবং image দিতে পারবেন।
                                {variants.length === 0 && ' Variant না থাকলে base price ব্যবহার হবে।'}
                            </p>

                            {variants.map((v, i) => (
                                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '12px', background: '#fafafa', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>Variant #{i + 1} {v.color && v.size ? `— ${v.color} / ${v.size}` : v.color || v.size || ''}</span>
                                        <button type="button" onClick={() => removeVariant(i)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FiTrash2 size={12} /> Remove
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
                                        {/* Color */}
                                        <div>
                                            <label style={lbl}>Color Name</label>
                                            <input value={v.color} onChange={e => setV(i, 'color', e.target.value)} placeholder="Red" style={inp} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                        {/* Color Hex */}
                                        <div>
                                            <label style={lbl}>Color Hex</label>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input type="color" value={v.colorHex} onChange={e => setV(i, 'colorHex', e.target.value)} style={{ width: '40px', height: '38px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                                                <input value={v.colorHex} onChange={e => setV(i, 'colorHex', e.target.value)} placeholder="#000000" style={{ ...inp, flex: 1 }} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                            </div>
                                        </div>
                                        {/* Size */}
                                        <div>
                                            <label style={lbl}>Size</label>
                                            <input value={v.size} onChange={e => setV(i, 'size', e.target.value)} placeholder="S / M / L / XL / 1kg" style={inp} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                        {/* Price */}
                                        <div>
                                            <label style={lbl}>Price (৳) *</label>
                                            <input type="number" value={v.price} onChange={e => setV(i, 'price', e.target.value)} placeholder="0" style={inp} min="0" onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                        {/* Original Price */}
                                        <div>
                                            <label style={lbl}>MRP (৳)</label>
                                            <input type="number" value={v.originalPrice} onChange={e => setV(i, 'originalPrice', e.target.value)} placeholder="0" style={inp} min="0" onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                        {/* Stock */}
                                        <div>
                                            <label style={lbl}>Stock</label>
                                            <input type="number" value={v.stock} onChange={e => setV(i, 'stock', e.target.value)} placeholder="0" style={inp} min="0" onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                        {/* SKU */}
                                        <div>
                                            <label style={lbl}>SKU (optional)</label>
                                            <input value={v.sku} onChange={e => setV(i, 'sku', e.target.value)} placeholder="TSHIRT-RED-M" style={inp} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                        {/* Note */}
                                        <div>
                                            <label style={lbl}>Note (optional)</label>
                                            <input value={v.note} onChange={e => setV(i, 'note', e.target.value)} placeholder="Limited stock" style={inp} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        </div>
                                    </div>

                                    {/* Variant Images */}
                                    <div style={{ marginTop: '10px' }}>
                                        <label style={lbl}>Variant Images <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>— প্রতিটা URL আলাদা লাইনে</span></label>
                                        <textarea value={v.images} onChange={e => setV(i, 'images', e.target.value)} placeholder={"https://example.com/red-front.jpg\nhttps://example.com/red-back.jpg"} rows={2} style={{ ...inp, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>

                                    {/* Auto discount preview */}
                                    {v.price && v.originalPrice && Number(v.originalPrice) > Number(v.price) && (
                                        <p style={{ fontSize: '11.5px', color: 'var(--color-primary)', fontWeight: 600, margin: '8px 0 0', background: 'var(--color-primary-lightest)', padding: '5px 10px', borderRadius: '6px', display: 'inline-block' }}>
                                            ✅ Discount: {Math.round(((Number(v.originalPrice) - Number(v.price)) / Number(v.originalPrice)) * 100)}%
                                        </p>
                                    )}
                                </div>
                            ))}

                            <button type="button" onClick={addVariant} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--color-primary-lightest)', border: '1.5px dashed var(--color-primary)', color: 'var(--color-primary)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                                <FiPlus size={15} /> Add Variant
                            </button>
                        </Section>


                    </div>

                    {/* ════ RIGHT COLUMN ════ */}
                    <div style={{ flex: '0 0 300px' }}>

                        {/* Category & Status */}
                        <Section icon={<span style={{ fontSize: '14px' }}>📂</span>} title="Category & Status">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={lbl}>Category <span style={{ color: 'var(--color-secondary)' }}>*</span></label>
                                    <select value={form.category} onChange={e => setF('category', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                        <option value="">— Select Category —</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Country <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(sourcing origin)</span></label>
                                    <select value={form.country} onChange={e => setF('country', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                        <option value="">— Select Country —</option>
                                        <option value="Bangladesh">🇧🇩 Bangladesh</option>
                                        <option value="Pakistan">🇵🇰 Pakistan</option>
                                        <option value="UAE">🇦🇪 UAE</option>
                                        <option value="USA">🇺🇸 USA</option>
                                        <option value="China">🇨🇳 China</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Status</label>
                                    <select value={form.status} onChange={e => setF('status', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                        <option value="active">Active</option>
                                        <option value="draft">Draft</option>
                                        <option value="out-of-stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Visibility</label>
                                    <select value={form.visibility} onChange={e => setF('visibility', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                                        <option value="visible">Visible</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Base Stock <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>(variant না থাকলে)</span></label>
                                    <input type="number" value={form.stock} onChange={e => setF('stock', e.target.value)} placeholder="0" style={inp} min="0" onFocus={e => e.target.style.borderColor = 'var(--color-primary)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            </div>
                        </Section>

                        {/* Filter / Search Tags */}
                        <Section icon={<FiTag size={16} />} title="Filter Tags">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Colors */}
                                <div>
                                    <label style={lbl}>Colors (name + hex)</label>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                        {colors.map((c, i) => (
                                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', fontSize: '12px', padding: '3px 8px', fontWeight: 500 }}>
                                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: colorHex[i], border: '1px solid #ddd', flexShrink: 0 }} />
                                                {c}
                                                <button type="button" onClick={() => removeColor(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <input type="color" value={colorInput.hex} onChange={e => setColorInput(p => ({ ...p, hex: e.target.value }))} style={{ width: '38px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', padding: '2px', flexShrink: 0 }} />
                                        <input value={colorInput.name} onChange={e => setColorInput(p => ({ ...p, name: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} placeholder="Color name" style={{ ...inp, flex: 1 }} />
                                        <button type="button" onClick={addColor} style={{ padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>+</button>
                                    </div>
                                </div>
                                {/* Sizes */}
                                <TagInput label="Sizes" value={sizes} onChange={setSizes} placeholder="S, M, L, XL, or 1kg..." />
                                {/* Tags */}
                                <TagInput label="Search Tags" value={tags} onChange={setTags} placeholder="nike, running, sport..." />
                            </div>
                        </Section>

                        {/* Submit */}
                        <div style={{ position: 'sticky', bottom: '20px' }}>
                            <button type="submit" disabled={isLoading} style={{
                                width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                background: isLoading ? '#6b7280' : 'linear-gradient(135deg, var(--color-primary), #0d5c30)',
                                color: '#fff', border: 'none', borderRadius: '10px',
                                fontSize: '14px', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 16px rgba(11,66,34,0.35)', transition: 'all 0.2s ease',
                            }}>
                                {isLoading
                                    ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'buttonSpin 0.8s linear infinite' }} /> Uploading...</>
                                    : <><FiCheckCircle size={16} /> Create Product</>
                                }
                            </button>
                            <p style={{ textAlign: 'center', fontSize: '11.5px', color: '#9ca3af', marginTop: '8px' }}>
                                Discount % automatically calculated হবে
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
