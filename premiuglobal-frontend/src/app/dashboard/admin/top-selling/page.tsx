"use client";

import React, { useEffect, useState } from 'react';
import { FiSearch, FiPlus, FiX, FiSave, FiCheckCircle, FiArrowUp, FiArrowDown, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useGetSiteContentQuery, useUpdateSiteSectionMutation } from '@/redux/api/siteContentApi';
import { useGetProductsQuery } from '@/redux/api/productApi';

/* ─── Styles ─── */
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '18px' };
const iconBtn: React.CSSProperties = { width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', color: '#888' };

const idOf = (p: any) => (typeof p === 'object' && p ? p._id : p) || '';

const TopSellingPage = () => {
    const { data: siteRes, isLoading } = useGetSiteContentQuery(undefined);
    const [updateSection, { isLoading: isSaving }] = useUpdateSiteSectionMutation();

    const [title, setTitle] = useState('Top Selling Products');
    const [active, setActive] = useState(true);
    const [ids, setIds] = useState<string[]>([]);
    const [term, setTerm] = useState('');

    // Hydrate the form once site content arrives.
    useEffect(() => {
        const ts = siteRes?.data?.topSelling;
        if (!ts) return;
        setTitle(ts.title || 'Top Selling Products');
        setActive(ts.active !== false);
        setIds((ts.products || []).map((p: any) => String(idOf(p))).filter(Boolean));
    }, [siteRes]);

    // Search results, and the full records for whatever is already picked (so we
    // can show names/thumbnails and keep the admin's order).
    const { data: searchRes } = useGetProductsQuery({ limit: 8, searchTerm: term }, { skip: term.trim().length < 2 });
    const { data: pickedRes } = useGetProductsQuery({ limit: 40, ids: ids.join(',') }, { skip: ids.length === 0 });

    const results: any[] = searchRes?.data || [];
    const pickedRecords: any[] = pickedRes?.data || [];
    const picked = ids
        .map((id) => pickedRecords.find((p) => String(p._id) === id))
        .filter(Boolean) as any[];

    const add = (id: string) => { if (!ids.includes(id)) setIds([...ids, id]); };
    const remove = (id: string) => setIds(ids.filter((x) => x !== id));
    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir;
        if (j < 0 || j >= ids.length) return;
        const next = [...ids];
        [next[i], next[j]] = [next[j], next[i]];
        setIds(next);
    };

    const handleSave = async () => {
        try {
            await updateSection({
                section: 'topSelling',
                data: { title: title.trim() || 'Top Selling Products', active, products: ids, limit: Math.max(ids.length, 1) },
            }).unwrap();
            toast.success('Top Selling section saved');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to save');
        }
    };

    return (
        <div style={{ maxWidth: '760px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiTrendingUp /> Top Selling
                    </h1>
                    <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>
                        Hand-pick the products shown in the home page “Top Selling” section
                    </p>
                </div>
                <button onClick={handleSave} disabled={isSaving} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', background: isSaving ? '#888' : 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer',
                }}>
                    <FiSave size={14} /> {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            {/* Info */}
            <div style={{ ...card, background: 'var(--color-primary-surface, #f0fdf4)', borderColor: '#bbf7d0', marginBottom: '14px' }}>
                <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, margin: 0 }}>
                    Pick any products you want and arrange them with the arrows — they appear in that exact order on the home page.
                    Leave the list empty to let the site fall back to automatic “most sold first”.
                </p>
            </div>

            {isLoading ? (
                <div style={{ ...card, textAlign: 'center', color: '#aaa' }}>Loading…</div>
            ) : (
                <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Title + active */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
                        <div>
                            <label style={lbl}>Section heading</label>
                            <input style={inp} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Top Selling Products" />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', paddingBottom: '9px' }}>
                            <span style={{ fontSize: '12.5px', color: '#555', fontWeight: 600 }}>{active ? 'Shown' : 'Hidden'}</span>
                            <div
                                onClick={() => setActive((a) => !a)}
                                style={{ position: 'relative', width: '38px', height: '21px', borderRadius: '999px', background: active ? 'var(--color-primary)' : '#ddd', transition: 'background 0.2s' }}
                            >
                                <div style={{ position: 'absolute', top: '3px', left: active ? '20px' : '3px', width: '15px', height: '15px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                            </div>
                        </label>
                    </div>

                    {/* Picked products (ordered) */}
                    <div>
                        <label style={lbl}>Selected products <span style={{ color: '#bbb', fontWeight: 400 }}>({ids.length})</span></label>
                        {ids.length === 0 ? (
                            <p style={{ fontSize: '12.5px', color: '#aaa', margin: 0 }}>Nothing picked yet — search below to add products.</p>
                        ) : (
                            <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                {ids.map((id, i) => {
                                    const p = picked.find((x) => String(x._id) === id);
                                    return (
                                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: i < ids.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#bbb', width: '18px' }}>{i + 1}</span>
                                            {p?.thumbnail
                                                ? <img src={p.thumbnail} alt="" style={{ width: '34px', height: '34px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                                                : <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#f3f4f6', flexShrink: 0 }} />}
                                            <span style={{ flex: 1, fontSize: '13px', color: '#222', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p?.name || <span style={{ color: '#aaa' }}>Loading…</span>}
                                                {p && i < 2 && <span style={{ marginLeft: '8px', fontSize: '9px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '1px 6px', borderRadius: '999px' }}>Best Selling badge</span>}
                                            </span>
                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                <button onClick={() => move(i, -1)} title="Move up" style={iconBtn}><FiArrowUp size={12} /></button>
                                                <button onClick={() => move(i, 1)} title="Move down" style={iconBtn}><FiArrowDown size={12} /></button>
                                                <button onClick={() => remove(id)} title="Remove" style={{ ...iconBtn, color: '#dc2626' }}><FiX size={13} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p style={{ fontSize: '11px', color: '#aaa', margin: '8px 0 0' }}>The first 2 products get the red “Best Selling” badge on the home page.</p>
                    </div>

                    {/* Search + add */}
                    <div>
                        <label style={lbl}>Add a product</label>
                        <div style={{ position: 'relative' }}>
                            <FiSearch size={13} style={{ position: 'absolute', left: '11px', top: '11px', color: '#aaa' }} />
                            <input style={{ ...inp, paddingLeft: '32px' }} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search a product by name…" />
                        </div>
                        {term.trim().length >= 2 && (
                            <div style={{ border: '1px solid #eee', borderRadius: '7px', marginTop: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                                {results.length === 0 ? (
                                    <p style={{ fontSize: '12.5px', color: '#aaa', padding: '10px 12px', margin: 0 }}>No products match “{term}”.</p>
                                ) : results.map((p) => {
                                    const already = ids.includes(String(p._id));
                                    return (
                                        <button
                                            key={p._id}
                                            onClick={() => !already && add(String(p._id))}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                                                padding: '8px 12px', border: 'none', borderBottom: '1px solid #f3f4f6',
                                                background: already ? '#f9fafb' : '#fff', cursor: already ? 'default' : 'pointer',
                                                fontSize: '13px', color: already ? '#aaa' : '#333', textAlign: 'left',
                                            }}
                                        >
                                            {p.thumbnail && <img src={p.thumbnail} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '5px' }} />}
                                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                            {already ? <FiCheckCircle size={14} color="#16a34a" /> : <FiPlus size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopSellingPage;
