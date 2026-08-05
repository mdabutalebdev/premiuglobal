"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiGift, FiArrowRight } from 'react-icons/fi';
import { useGetProductsQuery } from '@/redux/api/productApi';
import type { HomeSection } from './HomeProductSlider';

/**
 * "Exclusive Combo Deals" section — an orange-framed slider with combo cards
 * (Save % + Combo Offer badges, View Details button). Same admin config as any
 * home section (source / category / hand-picked products); only the look differs.
 * Modelled on the reference storefront's combo block.
 */

const AUTOPLAY_MS = 4000;
const GAP = 20;
const SLIDE_MS = 500;
const STAGGER_MS = 1300;
const DRAG_THRESHOLD = 6;

const ORANGE = 'var(--filter-accent)';

const perViewFor = (width: number) => (width >= 992 ? 5 : width >= 768 ? 3 : 2);
const money = (n: number) => `৳${Number(n || 0).toLocaleString('en-US')}`;
const idOf = (v: any) => (typeof v === 'object' && v ? v._id : v) || '';

/** Query params + a "View all" target for one configured section. */
const resolveSection = (s: HomeSection) => {
    const limit = s.limit || 10;
    switch (s.source) {
        case 'best-selling':
            return { params: { limit, sort: '-totalSold' }, href: '/products?sort=-totalSold' };
        case 'top-rated':
            return { params: { limit, sort: '-rating' }, href: '/products?sort=-rating' };
        case 'category': {
            const id = idOf(s.category);
            return { params: { limit, category: id, sort: '-createdAt' }, href: `/products?category=${id}` };
        }
        case 'flag':
            return { params: { limit, flag: s.flag, sort: '-createdAt' }, href: `/products?flag=${s.flag}` };
        case 'manual': {
            const ids = (s.products || []).map(idOf).filter(Boolean);
            return { params: { limit: Math.max(ids.length, 1), ids: ids.join(',') }, href: '/products' };
        }
        default:
            return { params: { limit, sort: '-createdAt' }, href: '/products' };
    }
};

const ComboDeals: React.FC<{ section: HomeSection; index?: number }> = ({ section, index: sectionIndex = 0 }) => {
    const { params, href } = resolveSection(section);
    const manualIds = section.source === 'manual' ? (section.products || []).map(idOf).filter(Boolean) : [];
    const skip = section.source === 'manual' && manualIds.length === 0;
    const { data, isLoading } = useGetProductsQuery(params, { skip });

    const products: any[] = React.useMemo(() => {
        const list = data?.data || [];
        if (section.source !== 'manual') return list;
        return [...list].sort((a, b) => manualIds.indexOf(String(a._id)) - manualIds.indexOf(String(b._id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, section.source, manualIds.join(',')]);

    /* ── Slider geometry (transform-based track, same as HomeProductSlider) ── */
    const viewportRef = useRef<HTMLDivElement>(null);
    const [perView, setPerView] = useState(5);
    const [cardWidth, setCardWidth] = useState(0);
    const step = cardWidth + GAP;
    const maxIndex = Math.max(0, products.length - perView);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const measure = () => {
            const w = viewportRef.current?.clientWidth || 0;
            if (!w) return;
            const pv = perViewFor(window.innerWidth);
            setPerView(pv);
            setCardWidth((w - GAP * (pv - 1)) / pv);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [products.length]);

    useEffect(() => { setIndex((i) => Math.min(i, maxIndex)); }, [maxIndex]);

    /* ── Drag ── */
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const startIndex = useRef(0);
    const draggedFar = useRef(false);

    const onPointerDown = (e: React.PointerEvent) => {
        if (maxIndex === 0 || e.button !== 0) return;
        startX.current = e.clientX;
        startIndex.current = index;
        draggedFar.current = false;
        setIsDragging(true);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > DRAG_THRESHOLD) {
            draggedFar.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        }
        setDragX(dx);
    };
    const endDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (step > 0 && draggedFar.current) {
            const moved = Math.round(-dragX / step);
            setIndex(Math.min(Math.max(startIndex.current + moved, 0), maxIndex));
        }
        setDragX(0);
    };
    const onClickCapture = (e: React.MouseEvent) => {
        if (draggedFar.current) { e.preventDefault(); e.stopPropagation(); draggedFar.current = false; }
    };

    /* ── Autoplay ── */
    const goNext = useCallback(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), [maxIndex]);
    useEffect(() => {
        if (maxIndex === 0 || isDragging) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        let interval: ReturnType<typeof setInterval>;
        const start = setTimeout(() => {
            interval = setInterval(() => { if (!document.hidden) goNext(); }, AUTOPLAY_MS);
        }, sectionIndex * STAGGER_MS);
        return () => { clearTimeout(start); clearInterval(interval); };
    }, [maxIndex, isDragging, goNext, sectionIndex]);

    if (!isLoading && products.length === 0) return null;

    const offset = -index * step + dragX;

    return (
        <section
            className="mb-6 rounded-2xl p-5 lg:p-6"
            style={{ background: 'linear-gradient(180deg, #FFF3E6 0%, #FEF7EF 100%)', border: '1px solid #FBE2C7' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                    <span
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                        style={{ background: ORANGE, boxShadow: '0 6px 14px rgba(244,135,33,0.3)' }}
                    >
                        <FiGift size={20} />
                    </span>
                    <h2 className="text-[16px] lg:text-[22px] font-extrabold text-[#3a2a12] truncate">
                        {section.title || 'Exclusive Combo Deals'}
                    </h2>
                </div>
                <Link
                    href={section.viewAllHref || href}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-[12.5px] font-bold whitespace-nowrap transition-all hover:brightness-95 shrink-0"
                    style={{ background: ORANGE, boxShadow: '0 6px 14px rgba(244,135,33,0.28)' }}
                >
                    View All Combos <FiArrowRight size={14} />
                </Link>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white border border-[#f0e2d0] rounded-xl p-2 animate-pulse">
                            <div className="aspect-square bg-gray-100 rounded-lg" />
                            <div className="pt-3 space-y-2">
                                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                                <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                                <div className="h-[36px] bg-gray-100 rounded mt-3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div
                        ref={viewportRef}
                        className="overflow-hidden"
                        style={{ touchAction: 'pan-y', cursor: maxIndex > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onPointerLeave={endDrag}
                        onClickCapture={onClickCapture}
                        onDragStart={(e) => e.preventDefault()}
                    >
                        <div
                            className="flex select-none items-stretch"
                            style={{
                                gap: `${GAP}px`,
                                transform: `translate3d(${offset}px, 0, 0)`,
                                transition: isDragging ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                            }}
                        >
                            {products.map((p) => {
                                const id = String(p._id || p.id);
                                const link = `/product/${p.slug || id}`;
                                const hasDiscount = p.originalPrice && p.originalPrice > p.price;
                                const savePct = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
                                return (
                                    <div
                                        key={id}
                                        className="shrink-0 bg-white rounded-xl border border-[#f0e2d0] overflow-hidden flex flex-col"
                                        style={{ width: cardWidth ? `${cardWidth}px` : `calc((100% - ${GAP * 4}px) / 5)` }}
                                    >
                                        {/* Image + badges */}
                                        <Link href={link} className="relative block p-3">
                                            {savePct > 0 && (
                                                <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-white text-[10px] font-bold" style={{ background: '#22a05b' }}>
                                                    Save {savePct}%
                                                </span>
                                            )}
                                            <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md text-white text-[10px] font-bold" style={{ background: ORANGE }}>
                                                Combo Offer
                                            </span>
                                            <span className="block aspect-square flex items-center justify-center overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.thumbnail || '/images/categories/organic.svg'}
                                                    alt={p.name}
                                                    draggable={false}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </span>
                                        </Link>

                                        {/* Info */}
                                        <div className="px-3 pb-3 flex flex-col flex-1">
                                            <Link href={link}>
                                                <h3 className="text-[13.5px] font-semibold text-[#33241a] leading-snug line-clamp-2 min-h-[38px] hover:text-[color:var(--filter-accent)] transition-colors">
                                                    {p.name}
                                                </h3>
                                            </Link>
                                            <div className="mt-1.5 flex items-baseline gap-2">
                                                <span className="text-[16px] font-extrabold" style={{ color: ORANGE }}>{money(p.price)}</span>
                                                {hasDiscount && (
                                                    <span className="text-[12.5px] text-gray-400 line-through">{money(p.originalPrice)}</span>
                                                )}
                                            </div>
                                            <Link
                                                href={link}
                                                className="mt-3 w-full py-2 rounded-lg text-center text-white text-[13px] font-bold transition-all hover:brightness-95"
                                                style={{ background: ORANGE }}
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dots */}
                    {maxIndex > 0 && (
                        <div className="flex items-center justify-center gap-2 mt-5">
                            {Array.from({ length: maxIndex + 1 }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                    className="rounded-full transition-all"
                                    style={{
                                        width: i === index ? '22px' : '8px',
                                        height: '8px',
                                        background: i === index ? ORANGE : '#f2d3ad',
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default ComboDeals;
