"use client";

import React from 'react';
import Link from 'next/link';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import HeroCarousel, { HeroSlide } from './HeroCarousel';

interface HeroSideBanner {
    imageUrl?: string;
    link?: string;
    active?: boolean;
    order?: number;
}

// No shipped/default banners: the hero area only shows what an admin uploads in
// Admin → Site Content → Hero. Nothing configured → the whole hero stays empty.

// Both panels share this height so their top and bottom edges line up exactly.
const PANEL_HEIGHT = 'h-[200px] sm:h-[280px] md:h-[340px] lg:h-[392px]';

const HeroSection: React.FC = () => {
    // `undefined` (not `{}`) so this shares one cache entry with the header and
    // the home sliders, and refetch-on-mount so a banner saved in the admin shows
    // up on the next page load instead of serving a stale cached response.
    const { data: res } = useGetSiteContentQuery(undefined, { refetchOnMountOrArgChange: true });

    // Main carousel slides — admin-uploaded only, no default fallback.
    const slides: HeroSlide[] = res?.data?.heroSlides?.filter((s: HeroSlide) => s.active !== false) || [];

    // Side banners are an array now; the old single `heroSideBanner` is the fallback
    // for installs that haven't been migrated yet. No default banner beyond that.
    const legacySide: HeroSideBanner = res?.data?.heroSideBanner || {};
    const sideList: HeroSideBanner[] = (res?.data?.heroSideBanners || [])
        .filter((b: HeroSideBanner) => b.active !== false && b.imageUrl)
        .sort((a: HeroSideBanner, b: HeroSideBanner) => (a.order ?? 0) - (b.order ?? 0));

    const sideBanners: HeroSideBanner[] = sideList.length > 0
        ? sideList
        : legacySide.imageUrl && legacySide.active !== false
            ? [legacySide]
            : [];

    const showSide = sideBanners.length > 0;

    // Nothing uploaded yet → keep the hero area empty (client request: no default banner).
    if (slides.length === 0 && !showSide) return null;

    const single = sideBanners.length === 1 ? sideBanners[0] : null;

    return (
        <section className="w-full">
            <div className="mx-auto max-w-[1500px] px-4 lg:px-8 py-4 lg:py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-[18px]">

                    {/* Carousel — two thirds (full width when there's no side banner) */}
                    {slides.length > 0 && (
                    <div className={`${showSide ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-lg overflow-hidden ${PANEL_HEIGHT}`}>
                        <HeroCarousel slides={slides} className="h-full" />
                    </div>
                    )}

                    {/* Side banner — one third on desktop. Hidden on phones/tablets so
                        only the main slider shows there (like the reference mobile). */}
                    {showSide && (
                        <div className={`hidden lg:block ${slides.length > 0 ? 'lg:col-span-1' : 'lg:col-span-3'} rounded-lg overflow-hidden bg-[#0A2A1C] ${PANEL_HEIGHT}`}>
                            {single ? (
                                single.link ? (
                                    <Link href={single.link} className="block w-full h-full">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={single.imageUrl} alt="Premium" className="w-full h-full object-cover" />
                                    </Link>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={single.imageUrl} alt="Premium" className="w-full h-full object-cover" />
                                )
                            ) : (
                                <HeroCarousel
                                    slides={sideBanners.map(b => ({ mediaType: 'image' as const, imageUrl: b.imageUrl, link: b.link }))}
                                    className="h-full"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
