'use client';

import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/analytics/gtag';

/**
 * Loads gtag.js and initialises GA4. Renders nothing when
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is not configured, so it is safe in every
 * environment (local, preview, production).
 */
export default function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) return null;

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                        send_page_view: true,
                        currency: 'BDT'
                    });
                `}
            </Script>
        </>
    );
}
