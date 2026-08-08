"use client";

import React, { useState } from 'react';

const FALLBACK = '/images/premiuglobal-logo.jpeg';

/**
 * Brand logo image with a reliable fallback.
 *
 * The primary source is the theme/uploaded logo. If that file is missing it
 * 404s — often *before* React hydrates, so a plain `onError` handler misses it.
 * We also check `naturalWidth === 0` in a ref callback to catch that
 * pre-hydration failure and fall back to the bundled PremiuGlobal logo.
 */
export default function BrandLogo({
    src,
    alt = 'PremiuGlobal',
    className,
}: {
    src: string;
    alt?: string;
    className?: string;
}) {
    const [broken, setBroken] = useState(false);
    const finalSrc = broken ? FALLBACK : src;

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={finalSrc}
            alt={alt}
            className={className}
            onError={() => !broken && setBroken(true)}
            ref={(el) => {
                if (el && el.complete && el.naturalWidth === 0 && !broken) setBroken(true);
            }}
        />
    );
}
