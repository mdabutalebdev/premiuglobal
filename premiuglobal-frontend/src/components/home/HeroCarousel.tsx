"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getYouTubeEmbedUrl } from '@/utils/youtube';

export interface HeroSlide {
    mediaType?: 'image' | 'video';
    imageUrl?: string;
    videoUrl?: string;
    youtubeUrl?: string;
    link?: string;
    active?: boolean;
}

/**
 * The actual hero banner carousel — shared between the public homepage
 * (HeroSection, fed from the API) and the admin live preview (fed from the
 * unsaved form state). Keeping a single renderer guarantees the preview looks
 * exactly like the real homepage.
 */
const HeroCarousel: React.FC<{ slides: HeroSlide[]; className?: string }> = ({ slides, className }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // Reset current if slides change
    useEffect(() => {
        if (current >= slides.length) setCurrent(0);
    }, [slides.length, current]);

    const renderSlide = (slide: HeroSlide, isActive: boolean) => {
        const isVideo = slide.mediaType === 'video';

        // YouTube video slide
        if (isVideo && slide.youtubeUrl) {
            const embed = getYouTubeEmbedUrl(slide.youtubeUrl);
            if (embed) {
                return (
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Container-relative cover: a 16:9 video fills the banner at every
                            breakpoint. The cover height = (9/16) ÷ (banner aspect):
                            mobile 16/9 → 100%, sm 16/7 → 128.57%, lg 16/5.5 → 163.64%. */}
                        <iframe
                            src={isActive ? embed : 'about:blank'}
                            title="PremiuGlobal"
                            allow="autoplay; encrypted-media"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full sm:h-[128.571%] lg:h-[163.636%] border-0"
                        />
                        {/* Transparent overlay captures every hover/tap so YouTube never
                            reveals its player controls (play/pause/prev/next). */}
                        <div className="absolute inset-0 z-[1]" />
                    </div>
                );
            }
        }

        // Uploaded video slide
        if (isVideo && slide.videoUrl) {
            return (
                <video
                    src={slide.videoUrl}
                    autoPlay={isActive}
                    muted
                    loop
                    playsInline
                    controls={false}
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
                    className="hero-video w-full h-full object-cover pointer-events-none"
                />
            );
        }

        // Image slide (default). Fills the panel edge to edge, like the
        // reference storefront — banners are authored at the panel's ~2.4 : 1.
        return (
            <img
                src={slide.imageUrl || '/images/hero%20banar01.png'}
                alt="PremiuGlobal"
                className="w-full h-full object-cover"
            />
        );
    };

    const go = (dir: -1 | 1) => setCurrent((prev) => (prev + dir + slides.length) % slides.length);

    return (
        <div
            className={`group relative w-full overflow-hidden bg-black ${className ?? 'aspect-[16/9] sm:aspect-[16/7] lg:aspect-[16/5.5]'}`}
        >
            {slides.map((slide, idx) => {
                const content = renderSlide(slide, idx === current);
                return (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        {/* A link makes the whole banner clickable; the arrows/dots sit
                            above it (z-10) so they keep working. */}
                        {slide.link ? (
                            <Link href={slide.link} className="block w-full h-full">{content}</Link>
                        ) : content}
                    </div>
                );
            })}

            {/* Arrows — 40px squares flush to each edge, hidden until the banner
                is hovered. White with an orange chevron, inverting on hover. */}
            {slides.length > 1 && (
                <>
                    {([
                        { dir: -1 as const, side: 'left-0', label: 'Previous slide', path: 'M15 18l-6-6 6-6' },
                        { dir: 1 as const, side: 'right-0', label: 'Next slide', path: 'M9 18l6-6-6-6' },
                    ]).map(({ dir, side, label, path }) => (
                        <button
                            key={label}
                            onClick={() => go(dir)}
                            aria-label={label}
                            className={`absolute ${side} top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center
                                bg-white text-[#F48721]
                                hover:bg-[#F48721] hover:text-white
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                focus-visible:opacity-100 focus-visible:visible
                                transition-all duration-300`}
                        >
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d={path} />
                            </svg>
                        </button>
                    ))}
                </>
            )}

            {/* Dots — 8px, bottom-left, white like the reference */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-6 flex items-center gap-2 z-10">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`w-2 h-2 rounded-full transition-opacity ${idx === current ? 'bg-white opacity-80' : 'bg-white opacity-40 hover:opacity-65'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HeroCarousel;
