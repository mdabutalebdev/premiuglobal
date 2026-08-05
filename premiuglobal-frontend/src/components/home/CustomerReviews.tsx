"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGetShowcaseReviewsQuery } from '@/redux/api/reviewApi';

/**
 * Approved customer reviews, shown as a card carousel just above the footer.
 * Only reviews an admin has approved reach this endpoint.
 */

const GAP = 24;
const AUTOPLAY_MS = 6000;
const SLIDE_MS = 500;
const DRAG_THRESHOLD = 6;

const perViewFor = (width: number) => (width >= 1024 ? 3 : width >= 640 ? 2 : 1);

const AVATAR_COLORS = ['#F48721', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const Stars = ({ value }: { value: number }) => (
    <span className="inline-flex gap-0.5 text-[15px] leading-none">
        {[1, 2, 3, 4, 5].map(i => (
            <span key={i} style={{ color: i <= Math.round(value) ? '#F5B301' : '#dcdcdc' }}>★</span>
        ))}
    </span>
);

function Avatar({ name, src }: { name: string; src?: string }) {
    const clean = (name || 'A').trim();
    const initial = clean.charAt(0).toUpperCase();
    const color = AVATAR_COLORS[clean.charCodeAt(0) % AVATAR_COLORS.length];

    if (src) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />;
    }
    return (
        <span
            className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white text-[20px] font-bold"
            style={{ background: color }}
        >
            {initial}
        </span>
    );
}

const CustomerReviews: React.FC = () => {
    const { data } = useGetShowcaseReviewsQuery(12);
    const reviews: any[] = data?.data || [];

    /* ── Track geometry ── */
    const viewportRef = useRef<HTMLDivElement>(null);
    const [perView, setPerView] = useState(3);
    const [cardWidth, setCardWidth] = useState(0);
    const step = cardWidth + GAP;
    const maxIndex = Math.max(0, reviews.length - perView);

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
    }, [reviews.length]);

    useEffect(() => { setIndex(i => Math.min(i, maxIndex)); }, [maxIndex]);

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

    /* ── Autoplay ── */
    const goNext = useCallback(() => setIndex(i => (i >= maxIndex ? 0 : i + 1)), [maxIndex]);

    useEffect(() => {
        if (maxIndex === 0 || isDragging) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const timer = setInterval(() => { if (!document.hidden) goNext(); }, AUTOPLAY_MS);
        return () => clearInterval(timer);
    }, [maxIndex, isDragging, goNext]);

    // Nothing approved yet — show nothing rather than an empty shell
    if (reviews.length === 0) return null;

    const offset = -index * step + dragX;

    return (
        <section className="w-full py-10 lg:py-14">
            <div className="container mx-auto px-4">
                <h2 className="text-[22px] lg:text-[26px] font-bold text-center text-[#222831] mb-2">
                    What Our Customers Say
                </h2>
                <span className="block w-10 h-1 rounded-full bg-[var(--filter-accent)] mx-auto mb-9" />

                <div
                    ref={viewportRef}
                    className="overflow-hidden"
                    style={{ touchAction: 'pan-y', cursor: maxIndex > 0 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onPointerLeave={endDrag}
                    onDragStart={e => e.preventDefault()}
                >
                    <div
                        className="flex select-none items-stretch"
                        style={{
                            gap: `${GAP}px`,
                            transform: `translate3d(${offset}px, 0, 0)`,
                            transition: isDragging ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                        }}
                    >
                        {reviews.map((r) => {
                            const name = r.userName
                                || [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ')
                                || 'Verified Customer';
                            return (
                                <div
                                    key={r._id}
                                    className="shrink-0"
                                    style={{ width: cardWidth ? `${cardWidth}px` : `calc((100% - ${GAP * 2}px) / 3)` }}
                                >
                                    <div className="h-full bg-white border border-[#ececec] rounded-lg p-7 flex flex-col">
                                        <p className="text-[15px] leading-[1.75] text-[#4a4a4a] mb-5">
                                            {r.comment}
                                        </p>

                                        <div className="mt-auto">
                                            <Stars value={r.rating} />
                                            <div className="flex items-center gap-3.5 mt-4">
                                                <Avatar name={name} src={r.user?.avatar} />
                                                <div className="min-w-0">
                                                    <p className="text-[16px] font-semibold text-[#222831] truncate">{name}</p>
                                                    <p className="text-[13px] text-[#8a8a8a] truncate">
                                                        {r.product?.name || 'Verified Customer'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {maxIndex > 0 && (
                    <div className="flex items-center justify-center gap-2.5 mt-8">
                        {Array.from({ length: maxIndex + 1 }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                aria-label={`Go to review ${i + 1}`}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === index
                                    ? 'bg-[var(--filter-accent)]'
                                    : 'border border-[var(--filter-accent)] hover:bg-[var(--filter-accent)]/30'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default CustomerReviews;
