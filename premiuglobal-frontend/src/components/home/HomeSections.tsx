"use client";

import React from 'react';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import HomeProductSlider, { HomeSection } from './HomeProductSlider';
import ComboDeals from './ComboDeals';

/**
 * Home page product sliders. Everything — how many there are, their titles,
 * order, and which products they pull — comes from Admin → Site Content →
 * Home Sections. No section is hardcoded here.
 */
const HomeSections: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);
    const sections: HomeSection[] = data?.data?.homeSections || [];

    const visible = [...sections]
        .filter(s => s.active !== false && s.title)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (visible.length === 0) return null;

    return (
        <div className="container mx-auto px-2 pt-6 pb-0">
            {visible.map((s, i) => (
                // `index` staggers each slider's autoplay so they don't move in unison.
                // A section can opt into the orange "combo deals" card design.
                s.layout === 'combo'
                    ? <ComboDeals key={s._id || `${s.title}-${i}`} section={s} index={i} />
                    : <HomeProductSlider key={s._id || `${s.title}-${i}`} section={s} index={i} />
            ))}
        </div>
    );
};

export default HomeSections;
