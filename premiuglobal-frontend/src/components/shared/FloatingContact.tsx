"use client";

import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

const FloatingContact: React.FC = () => {
    const { data: res } = useGetSiteContentQuery({});
    const f = res?.data?.floating;

    const showWhatsapp = f?.showWhatsapp !== false; // default true

    // Normalize to wa.me format: digits only, with BD country code (880)
    // Falls back to the main number before site content loads from DB
    const digits = (f?.whatsapp || '8801571541370').replace(/\D/g, '');
    const whatsappNumber = digits.startsWith('880')
        ? digits
        : digits.startsWith('0')
            ? '88' + digits
            : digits
                ? '880' + digits
                : '';

    if (!showWhatsapp || !whatsappNumber) return null;

    const whatsappLink = `https://wa.me/${whatsappNumber}`;

    return (
        <div className="fixed bottom-[74px] lg:bottom-6 right-4 z-[9999] flex flex-col items-center gap-2">
            <style>{`
                @keyframes fcRipple {
                    0%   { transform: scale(1);   opacity: 0.4; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                @keyframes fcBeat {
                    0%, 100% { transform: scale(1); }
                    10%, 30% { transform: scale(1.12); }
                    20%      { transform: scale(1.04); }
                    40%      { transform: scale(1); }
                }
                .fc-ring  { animation: fcRipple 2.8s ease-out infinite; }
                .fc-btn   { animation: fcBeat 2.6s ease-in-out infinite; }
                .group:hover .fc-btn { animation-play-state: paused; }
                @media (prefers-reduced-motion: reduce) {
                    .fc-ring, .fc-ring2, .fc-btn { animation: none; }
                }
            `}</style>

            {/* WhatsApp Button */}
            <div className="group relative flex items-center">
                {/* Tooltip on hover */}
                <div className="absolute right-full mr-2 bg-[#25D366] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 pointer-events-none transition-all duration-200 shadow-lg">
                    Chat with us
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-[#25D366]" />
                </div>

                {/* Single soft pulsing ripple (radar effect) */}
                <span className="fc-ring absolute left-0 top-0 w-12 h-12 rounded-full bg-[#25D366] pointer-events-none" />

                <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fc-btn relative w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 text-white shadow-lg"
                    style={{
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                    }}
                >
                    <FaWhatsapp size={24} />
                </a>
            </div>
        </div>
    );
};

export default FloatingContact;
