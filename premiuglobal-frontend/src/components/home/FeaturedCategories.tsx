"use client";

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { resolveCategoryIcon } from '@/utils/categoryIcon';

interface Category {
    _id: string;
    name: string;
    icon?: string;
    image?: string;
    order?: number;
    showInHome?: boolean;
    parent?: { _id: string } | string | null;
}

const SECTION_BG = '#FBF7EF';
const HEADING = '#1F3347';
const ARROW = '#F47B20';

const FeaturedCategories: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    // Auto-slide pauses while the user is hovering / dragging the row.
    const pausedRef = useRef(false);
    const { data, isLoading } = useGetCategoriesQuery({});

    // Only top-level categories the admin has chosen to show on the homepage.
    const categories: Category[] = (data?.data || [])
        .filter((c: Category) => !c.parent && c.showInHome !== false)
        .sort((a: Category, b: Category) => (a.order ?? 0) - (b.order ?? 0));

    const scrollBy = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        // Roughly three cards per click, whichever is smaller than the viewport.
        const amount = Math.min(el.clientWidth * 0.8, 540);
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    // Auto-slide: nudge the row along every few seconds, looping back to the start
    // when it reaches the end. Pauses on hover and respects reduced-motion.
    useEffect(() => {
        if (categories.length === 0) return;
        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

        const id = setInterval(() => {
            const el = scrollRef.current;
            if (!el || pausedRef.current || document.hidden) return;
            // No overflow to scroll → nothing to do.
            if (el.scrollWidth <= el.clientWidth + 4) return;
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
            if (atEnd) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: Math.min(el.clientWidth * 0.5, 320), behavior: 'smooth' });
            }
        }, 3000);
        return () => clearInterval(id);
    }, [categories.length]);

    if (!isLoading && categories.length === 0) return null;

    return (
        <section style={{ background: SECTION_BG }} className="py-6 lg:py-11">
            <div className="mx-auto max-w-[1500px] px-4 lg:px-8">

                <h2
                    className="text-center text-[18px] lg:text-[26px] font-semibold mb-5 lg:mb-8"
                    style={{ color: HEADING }}
                >
                    Featured Categories
                </h2>

                <div className="relative">
                    {/* Arrows — vertically centred on the card, not the label */}
                    <button
                        onClick={() => scrollBy('left')}
                        aria-label="Previous categories"
                        className="flex absolute -left-3 lg:-left-4 top-[75px] -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center text-white shadow-md hover:brightness-95 transition"
                        style={{ background: ARROW }}
                    >
                        <FiChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => scrollBy('right')}
                        aria-label="Next categories"
                        className="flex absolute -right-3 lg:-right-4 top-[75px] -translate-y-1/2 z-10 w-9 h-9 rounded-full items-center justify-center text-white shadow-md hover:brightness-95 transition"
                        style={{ background: ARROW }}
                    >
                        <FiChevronRight size={20} />
                    </button>

                    <div
                        ref={scrollRef}
                        onMouseEnter={() => { pausedRef.current = true; }}
                        onMouseLeave={() => { pausedRef.current = false; }}
                        onTouchStart={() => { pausedRef.current = true; }}
                        className="flex gap-5 lg:gap-[46px] overflow-x-auto no-scrollbar scroll-smooth pb-1"
                    >
                        {isLoading
                            ? Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="shrink-0 w-[120px] lg:w-[140px]">
                                    <div className="w-full h-[130px] lg:h-[150px] rounded-2xl bg-white/70 animate-pulse" />
                                    <div className="mt-3 h-3 rounded bg-white/70 animate-pulse" />
                                </div>
                            ))
                            : categories.map((cat) => (
                                <Link
                                    key={cat._id}
                                    href={`/products?category=${cat._id}`}
                                    className="shrink-0 w-[120px] lg:w-[140px] group"
                                >
                                    <div className="w-full h-[130px] lg:h-[150px] rounded-2xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden">
                                        {cat.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={cat.image}
                                                alt={cat.name}
                                                className="w-[86px] h-[86px] lg:w-[100px] lg:h-[100px] object-contain transition-transform duration-300 ease-out group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="text-[44px] lg:text-[52px] leading-none transition-transform duration-300 ease-out group-hover:scale-105">
                                                {resolveCategoryIcon(cat.name, cat.icon)}
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className="mt-3 text-center text-[14px] lg:text-[15px]"
                                        style={{ color: HEADING }}
                                    >
                                        {cat.name}
                                    </p>
                                </Link>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedCategories;
