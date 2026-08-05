"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ShopProductCard from '@/components/shared/ShopProductCard';
import ShopSectionHeader from '@/components/shared/ShopSectionHeader';
import { useGetProductsQuery } from '@/redux/api/productApi';

export interface HomeSection {
    _id?: string;
    title: string;
    source: 'newest' | 'best-selling' | 'top-rated' | 'category' | 'flag' | 'manual';
    category?: { _id?: string } | string | null;
    flag?: string;
    products?: string[];
    layout?: 'slider' | 'combo';
    limit?: number;
    viewAllHref?: string;
    active?: boolean;
    order?: number;
}

// Matches the reference slider's Swiper config: one card per step, every 4s,
// 20px between cards, 2 / 3 / 5 cards per view at 0 / 768 / 992px.
const AUTOPLAY_MS = 4000;
const GAP = 20;
const SLIDE_MS = 500;
// Sliders are offset from each other so the page doesn't move as one block
const STAGGER_MS = 1300;
// How far a pointer must travel before it counts as a drag and not a click
const DRAG_THRESHOLD = 6;

const perViewFor = (width: number) => (width >= 992 ? 5 : width >= 768 ? 3 : 2);

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

const HomeProductSlider: React.FC<{ section: HomeSection; index?: number }> = ({ section, index: sectionIndex = 0 }) => {
    const { params, href } = resolveSection(section);
    const manualIds = section.source === 'manual' ? (section.products || []).map(idOf).filter(Boolean) : [];

    const skip = section.source === 'manual' && manualIds.length === 0;
    const { data, isLoading } = useGetProductsQuery(params, { skip });

    const products: any[] = React.useMemo(() => {
        const list = data?.data || [];
        if (section.source !== 'manual') return list;
        // Keep the admin's hand-picked order, which the API doesn't preserve
        return [...list].sort((a, b) => manualIds.indexOf(String(a._id)) - manualIds.indexOf(String(b._id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, section.source, manualIds.join(',')]);

    /* ── Track geometry ──────────────────────────────────────────────
       A transform-based track (like the reference's Swiper) rather than a
       scroll container: the transition is ours, so the slide is smooth and
       identical in every browser. */
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

    // A narrower viewport can leave the index past the last valid slide
    useEffect(() => {
        setIndex(i => Math.min(i, maxIndex));
    }, [maxIndex]);

    /* ── Drag to slide ─────────────────────────────────────────────── */
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
            // Claim the pointer so the cards' links don't swallow the rest of the drag
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

    // A drag that ends on a card would otherwise open that product
    const onClickCapture = (e: React.MouseEvent) => {
        if (draggedFar.current) {
            e.preventDefault();
            e.stopPropagation();
            draggedFar.current = false;
        }
    };

    /* ── Autoplay ──────────────────────────────────────────────────── */
    const goNext = useCallback(() => {
        setIndex(i => (i >= maxIndex ? 0 : i + 1));
    }, [maxIndex]);

    useEffect(() => {
        if (maxIndex === 0 || isDragging) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

        let interval: ReturnType<typeof setInterval>;
        // Offset each section so they don't all advance on the same beat
        const start = setTimeout(() => {
            interval = setInterval(() => {
                if (!document.hidden) goNext();
            }, AUTOPLAY_MS);
        }, sectionIndex * STAGGER_MS);

        return () => {
            clearTimeout(start);
            clearInterval(interval);
        };
    }, [maxIndex, isDragging, goNext, sectionIndex]);

    if (!isLoading && products.length === 0) return null;

    const offset = -index * step + dragX;

    return (
        <section className="mb-6">
            <ShopSectionHeader title={section.title} href={section.viewAllHref || href} />

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white border border-[#cccccc] rounded p-2 animate-pulse">
                            <div className="aspect-[183/165] bg-gray-200" />
                            <div className="pt-3 space-y-2">
                                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                                <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                                <div className="h-[34px] bg-gray-100 rounded mt-3" />
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
                        /* Without this, pressing on a card's image or link starts the
                           browser's own drag-and-drop, which cancels our pointer stream
                           — so dragging only worked on the gaps between cards. */
                        onDragStart={e => e.preventDefault()}
                    >
                        <div
                            className="flex select-none"
                            style={{
                                gap: `${GAP}px`,
                                transform: `translate3d(${offset}px, 0, 0)`,
                                transition: isDragging ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                            }}
                        >
                            {products.map((p: any) => (
                                <div
                                    key={p._id}
                                    className="shrink-0"
                                    style={{ width: cardWidth ? `${cardWidth}px` : `calc((100% - ${GAP * 4}px) / 5)` }}
                                >
                                    <ShopProductCard product={p} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {maxIndex > 0 && (
                        <div className="flex items-center justify-center gap-2.5 mt-[15px]">
                            {Array.from({ length: maxIndex + 1 }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    aria-label={`Go to slide ${i + 1}`}
                                    className={`h-2 rounded-full transition-all ${i === index
                                        ? 'w-5 bg-[var(--filter-accent)]'
                                        : 'w-2 bg-[var(--filter-accent)]/35 hover:bg-[var(--filter-accent)]/60'}`}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default HomeProductSlider;
