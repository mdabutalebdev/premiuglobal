"use client";

import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { closeSearchModal } from '@/redux/slices/uiSlice';
import SearchBox from './Header/SearchBox';

/**
 * Full-width search sheet for phones/tablets, opened by the bottom nav's Search.
 * Reuses the header SearchBox (with its live product dropdown). Hidden on desktop,
 * where the header already has a search field.
 */
const MobileSearchOverlay: React.FC = () => {
    const dispatch = useAppDispatch();
    const open = useAppSelector((s) => s.ui.isSearchModalOpen);

    // Focus the field and lock body scroll while open.
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            document.querySelector<HTMLInputElement>('#mobile-search-sheet input')?.focus();
        }, 80);
        document.body.style.overflow = 'hidden';
        return () => { clearTimeout(t); document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="lg:hidden fixed inset-0 z-[90] bg-black/40" onClick={() => dispatch(closeSearchModal())}>
            <div
                id="mobile-search-sheet"
                className="bg-white p-3 flex items-center gap-2 shadow-md animate-[fadeIn_0.15s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1">
                    <SearchBox className="w-full" onNavigate={() => dispatch(closeSearchModal())} />
                </div>
                <button
                    type="button"
                    onClick={() => dispatch(closeSearchModal())}
                    aria-label="Close search"
                    className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <FiX size={22} />
                </button>
            </div>
        </div>
    );
};

export default MobileSearchOverlay;
