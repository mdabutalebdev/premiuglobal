"use client";

import React from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

const TEXT = '#222831';

/**
 * Header above the product grids and sliders. Values are taken from the
 * reference storefront: 20px/700 title, a hairline closing the row, and a
 * 40×4px accent bar sitting *on* that hairline (bottom: -2px) rather than
 * floating above it. Only the link's text is underlined, not its arrow.
 */
const ShopSectionHeader: React.FC<{ title: string; href?: string; linkLabel?: string }> = ({
    title,
    href,
    linkLabel = 'View All Items',
}) => (
    <div className="relative flex items-center justify-between gap-4 border-b border-[#dddddd] pb-3 mb-4">
        <h2 className="text-[16px] lg:text-[20px] font-bold leading-6" style={{ color: TEXT }}>
            {title}
        </h2>

        {href && (
            <Link
                href={href}
                className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.7px] text-[var(--filter-accent)] hover:opacity-75 transition-opacity whitespace-nowrap"
            >
                <span className="underline">{linkLabel}</span>
                <FiArrowRight size={14} />
            </Link>
        )}

        <span className="absolute left-0 -bottom-[2px] w-10 h-1 bg-[var(--filter-accent)]" />
    </div>
);

export default ShopSectionHeader;
