"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux';
import { openCartModal } from '@/redux/slices/uiSlice';

/**
 * The standalone cart page is gone — the slide-in cart panel replaced it.
 * The route is kept so old links and bookmarks don't 404: it sends people home
 * and opens the panel instead.
 */
export default function CartRedirectPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(openCartModal());
        router.replace('/');
    }, [dispatch, router]);

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--filter-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
