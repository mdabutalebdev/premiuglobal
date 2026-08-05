"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

interface ThemeContextType {
    primaryColor: string;
    primaryForeground: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    isLoaded: boolean;
}

// User's brand logo (transparent PNG so it blends into any header background —
// the old /logo.jpg had a solid white box). Falls back to /logo.svg via onError if missing.
const DEFAULT_LOGO = '/images/premiumlogo.png';

const defaultTheme: ThemeContextType = {
    primaryColor: '#003B88',
    primaryForeground: '#ffffff',
    secondaryColor: '#E4525C',
    logoUrl: DEFAULT_LOGO,
    faviconUrl: '',
    isLoaded: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

/* ─── Color Helpers ─── */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    try {
        hex = hex.replace('#', '');
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
        };
    } catch { return null; }
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(Math.max(0, rgb.r - amount), Math.max(0, rgb.g - amount), Math.max(0, rgb.b - amount));
}

function lighten(hex: string, factor: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(
        Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
        Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
        Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor)),
    );
}

// WCAG relative luminance (0 = black … 1 = white)
function luminance(hex: string): number {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const ch = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch(rgb.r) + 0.7152 * ch(rgb.g) + 0.0722 * ch(rgb.b);
}

const FG_LIGHT = '#ffffff';
const FG_DARK = '#111111';

// Most readable text color on top of the given background, by contrast ratio.
function readableText(hex: string): string {
    const L = luminance(hex);
    const contrastWhite = 1.05 / (L + 0.05);   // ratio vs white
    const contrastBlack = (L + 0.05) / 0.05;   // ratio vs black
    return contrastBlack >= contrastWhite ? FG_DARK : FG_LIGHT;
}

// Resolve the foreground for the primary color, honoring the admin override.
// 'auto' → computed from brightness | 'light' → white | 'dark' → near-black
export function resolvePrimaryForeground(hex: string, mode?: string): string {
    if (mode === 'light') return FG_LIGHT;
    if (mode === 'dark') return FG_DARK;
    return readableText(hex);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: res } = useGetSiteContentQuery({});
    const [themeData, setThemeData] = useState<ThemeContextType>(defaultTheme);

    useEffect(() => {
        if (res?.data?.theme) {
            const t = res.data.theme;
            const primary = t.primaryColor || '#003B88';
            const secondary = t.secondaryColor || '#E4525C';

            // Calculate derivative colors from primary
            const primaryDark = darken(primary, 20);
            const primaryLight = lighten(primary, 0.85);      // soft background
            const primaryLightest = lighten(primary, 0.93);    // very light bg
            const primaryBorder = lighten(primary, 0.7);       // border color
            const primarySurface = lighten(primary, 0.96);     // surface bg
            // Readable text color on top of the primary (auto / light / dark)
            const primaryForeground = resolvePrimaryForeground(primary, t.primaryTextMode);

            // Apply all to CSS variables
            const root = document.documentElement;
            root.style.setProperty('--color-primary', primary);
            root.style.setProperty('--color-primary-dark', primaryDark);
            root.style.setProperty('--color-primary-light', primaryLight);
            root.style.setProperty('--color-primary-lightest', primaryLightest);
            root.style.setProperty('--color-primary-border', primaryBorder);
            root.style.setProperty('--color-primary-surface', primarySurface);
            root.style.setProperty('--color-primary-foreground', primaryForeground);
            root.style.setProperty('--color-secondary', secondary);

            setThemeData({
                primaryColor: primary,
                primaryForeground,
                secondaryColor: secondary,
                logoUrl: t.logoUrl || DEFAULT_LOGO,
                faviconUrl: t.faviconUrl || '',
                isLoaded: true,
            });
        }
    }, [res]);

    return (
        <ThemeContext.Provider value={themeData}>
            {children}
        </ThemeContext.Provider>
    );
}
