"use client";

import React from 'react';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import HomeProductSlider, { HomeSection } from './HomeProductSlider';
import ComboDeals from './ComboDeals';

/**
 * Automatic home-page sliders driven by the product "flags" an admin sets on the
 * Add/Edit Product form. Set a flag on a product → it shows up in the matching
 * section here, no extra config needed. Each section hides itself when no product
 * carries its flag (HomeProductSlider / ComboDeals return null on an empty list).
 *
 * "Best Selling" is intentionally excluded — it has its own dedicated block
 * (TopSellingProducts). If an admin hand-builds a flag slider in Admin → Site
 * Content, that one wins and the automatic one for the same flag is skipped.
 */
const DEFAULT_FLAG_SECTIONS: HomeSection[] = [
    { title: 'New Arrivals',          source: 'flag', flag: 'new-arrival', layout: 'slider', limit: 15 },
    { title: 'Featured Products',     source: 'flag', flag: 'featured',    layout: 'slider', limit: 15 },
    { title: 'On Sale',               source: 'flag', flag: 'on-sale',     layout: 'slider', limit: 15 },
    { title: 'Exclusive Combo Deals', source: 'flag', flag: 'combo',       layout: 'combo',  limit: 15 },
];

const FlagSections: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const adminSections: HomeSection[] = data?.data?.homeSections || [];

    // Flags an admin already built a custom slider for — skip those so a section
    // never appears twice.
    const adminFlags = new Set(
        adminSections
            .filter((s) => s.active !== false && s.source === 'flag' && s.flag)
            .map((s) => s.flag),
    );

    const sections = DEFAULT_FLAG_SECTIONS.filter((s) => !adminFlags.has(s.flag));
    if (sections.length === 0) return null;

    return (
        <div className="container mx-auto px-2 pt-6 pb-0">
            {sections.map((s, i) =>
                s.layout === 'combo'
                    ? <ComboDeals key={s.flag} section={s} index={i} />
                    : <HomeProductSlider key={s.flag} section={s} index={i} />,
            )}
        </div>
    );
};

export default FlagSections;
