"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FiShoppingBag } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { openCartModal } from '@/redux/slices/uiSlice';

const ORANGE = '#F47B20';

// The cart page and checkout already show the totals, so the tab would be noise.
const HIDDEN_ON = ['/cart', '/checkout'];

/**
 * Cart tab pinned to the middle of the right edge on every page, desktop and
 * mobile. Shows the live item count and order total, and links to the cart.
 */
const FloatingCart: React.FC = () => {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const { totalQuantity, totalPrice } = useAppSelector((state) => state.cart);

    // Cart state is restored from localStorage on the client, so render the tab
    // only after mount to keep the server and client markup identical.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;
    if (HIDDEN_ON.some((p) => pathname?.startsWith(p))) return null;
    if (pathname?.startsWith('/dashboard')) return null;

    return (
        <button
            onClick={() => dispatch(openCartModal())}
            aria-label={`Cart — ${totalQuantity} items, ৳${totalPrice.toLocaleString('en-US')}`}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col rounded-l-lg overflow-hidden shadow-[0_3px_14px_rgba(0,0,0,0.18)] hover:shadow-[0_5px_20px_rgba(0,0,0,0.25)] transition-shadow"
        >
            {/* Count */}
            <span
                className="flex flex-col items-center gap-1 px-3 py-2.5 text-white"
                style={{ background: ORANGE }}
            >
                <FiShoppingBag size={19} />
                <span className="text-[11.5px] font-medium leading-none whitespace-nowrap">
                    {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
                </span>
            </span>

            {/* Total */}
            <span
                className="px-3 py-1.5 bg-white text-center text-[12px] font-bold leading-none whitespace-nowrap"
                style={{ color: ORANGE }}
            >
                ৳{totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </button>
    );
};

export default FloatingCart;
