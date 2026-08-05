"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiX, FiArrowRight, FiChevronLeft, FiChevronRight, FiShoppingBag, FiPlus } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { closeCartModal } from '@/redux/slices/uiSlice';
import { addToCart, removeFromCart, updateQuantity } from '@/redux/slices/cartSlice';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { NO_IMAGE } from '@/utils/placeholder';

const ORANGE = '#F47B20';
const PLACEHOLDER = NO_IMAGE;

const money = (n: number) =>
    `৳${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Slide-in cart panel. Opened by `openCartModal` — every "Add to Cart" button
 * dispatches it — and closed by the backdrop, the Close link, or Escape.
 */
const CartDrawer: React.FC = () => {
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const isOpen = useAppSelector((s: any) => s.ui.isCartModalOpen);
    const { items, totalPrice } = useAppSelector((s: any) => s.cart);

    const close = () => dispatch(closeCartModal());

    // Close on route change and on Escape; lock the page behind the panel
    useEffect(() => { if (isOpen) close(); /* eslint-disable-next-line */ }, [pathname]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    /* ── "You may also like" ── */
    const { data: suggestionsRes } = useGetProductsQuery({ limit: 10, sort: '-totalSold' }, { skip: !isOpen });
    const inCart = new Set(items.map((i: any) => i.id));
    const suggestions: any[] = (suggestionsRes?.data || []).filter((p: any) => !inCart.has(String(p._id))).slice(0, 8);

    const railRef = useRef<HTMLDivElement>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    // Fade whichever arrow can't go any further
    const syncArrows = () => {
        const el = railRef.current;
        if (!el) return;
        setAtStart(el.scrollLeft <= 2);
        setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };

    useEffect(() => { syncArrows(); }, [suggestions.length, isOpen]);

    const scrollRail = (dir: -1 | 1) => {
        const el = railRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
    };

    /* Suggestion cards add straight to the cart — the panel is already open, so
       the new line simply appears above. */
    const addSuggestion = (p: any) => {
        dispatch(addToCart({
            id: String(p._id),
            productId: String(p._id),
            name: p.name,
            price: p.price,
            mrp: p.originalPrice || p.price,
            image: p.thumbnail || p.images?.[0] || PLACEHOLDER,
            category: typeof p.category === 'object' ? p.category?.name || 'General' : 'General',
        }));
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={close}
                aria-hidden
                className={`fixed inset-0 z-[90] bg-black/45 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Panel */}
            <aside
                role="dialog"
                aria-label="Shopping cart"
                className={`fixed top-0 right-0 z-[95] h-full w-full max-w-[390px] bg-white shadow-[-6px_0_28px_rgba(0,0,0,0.16)]
                    flex flex-col transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-[52px] border-b border-gray-200 shrink-0">
                    <h2 className="text-[13px] font-bold tracking-wide uppercase text-[#222831]">Shopping Cart</h2>
                    <button
                        onClick={close}
                        className="flex items-center gap-1.5 text-[13px] text-[#222831] hover:opacity-70 transition-opacity"
                    >
                        Close <FiArrowRight size={15} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
                            <FiShoppingBag size={28} className="text-gray-300" />
                            <p className="text-[13px] font-semibold text-gray-700">Your cart is empty</p>
                            <p className="text-[11.5px] text-gray-400">Add something you like and it will show up here.</p>
                            <Link href="/products" onClick={close}
                                className="mt-1.5 px-4 py-2 rounded text-[12px] font-semibold text-white"
                                style={{ background: ORANGE }}>
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="px-4 py-4 flex flex-col gap-3">
                            {items.map((item: any) => (
                                <div key={item.id} className="flex gap-3 border border-gray-200 rounded p-2.5">
                                    <Link href={`/product/${item.productId}`} onClick={close} className="shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.image || PLACEHOLDER}
                                            alt=""
                                            className="w-[58px] h-[58px] object-cover rounded border border-gray-200"
                                        />
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12.5px] text-[#222831] leading-snug line-clamp-2">{item.name}</p>

                                        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 mt-2 text-[12px] text-[#222831]">
                                            <span className="inline-flex items-center border border-gray-300 rounded overflow-hidden">
                                                <button
                                                    onClick={() => item.quantity > 1
                                                        ? dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                                                        : dispatch(removeFromCart(item.id))}
                                                    aria-label="Decrease quantity"
                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                                >
                                                    −
                                                </button>
                                                <span className="w-6 text-center text-[12px]">{item.quantity}</span>
                                                <button
                                                    onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                                                    aria-label="Increase quantity"
                                                    className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                                >
                                                    +
                                                </button>
                                            </span>
                                            <span className="text-gray-400">×</span>
                                            <span>{money(item.price)}</span>
                                            <span className="text-gray-400">=</span>
                                            <span>{money(item.price * item.quantity)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => dispatch(removeFromCart(item.id))}
                                        aria-label={`Remove ${item.name}`}
                                        className="self-start w-6 h-6 flex items-center justify-center text-[#222831] hover:text-red-500 transition-colors"
                                    >
                                        <FiX size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer — pinned to the bottom, so suggestions and the total stay
                    in view however long the item list gets. */}
                {items.length > 0 && (
                    <div className="border-t border-gray-200 shrink-0">

                        {/* You may also like */}
                        {suggestions.length > 0 && (
                            <div className="px-4 pt-3.5 pb-3.5 bg-[#f7f7f7] border-b border-gray-200">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div>
                                        <h3 className="text-[13px] font-bold text-[#222831]">You May Also Like</h3>
                                        <span className="block w-7 h-[2px] mt-1" style={{ background: ORANGE }} />
                                    </div>
                                    <div className="flex gap-1.5">
                                        {([
                                            { dir: -1 as const, label: 'Previous', disabled: atStart, icon: <FiChevronLeft size={14} /> },
                                            { dir: 1 as const, label: 'Next', disabled: atEnd, icon: <FiChevronRight size={14} /> },
                                        ]).map(({ dir, label, disabled, icon }) => (
                                            <button
                                                key={label}
                                                onClick={() => scrollRail(dir)}
                                                disabled={disabled}
                                                aria-label={label}
                                                className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-white transition-opacity"
                                                style={{ background: ORANGE, opacity: disabled ? 0.4 : 1 }}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    ref={railRef}
                                    onScroll={syncArrows}
                                    className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth"
                                >
                                    {suggestions.map((p: any) => (
                                        <div key={p._id} className="shrink-0 w-[196px] bg-white border border-gray-200 rounded p-2 flex gap-2.5">
                                            <Link href={`/product/${p.slug || p._id}`} onClick={close} className="shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={p.thumbnail || p.images?.[0] || PLACEHOLDER}
                                                    alt=""
                                                    className="w-[44px] h-[44px] object-cover rounded"
                                                />
                                            </Link>
                                            <div className="min-w-0 flex flex-col">
                                                <p className="text-[11.5px] text-[#222831] leading-snug line-clamp-2">{p.name}</p>
                                                <p className="text-[11.5px] text-gray-500 mt-0.5">{money(p.price)}</p>
                                                <button
                                                    onClick={() => addSuggestion(p)}
                                                    className="mt-1 inline-flex items-center gap-1 self-start px-2.5 py-[3px] rounded text-[10.5px] font-semibold text-white hover:opacity-90 transition-opacity"
                                                    style={{ background: ORANGE }}
                                                >
                                                    <FiPlus size={10} /> Add
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="px-4 py-3.5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[13.5px] font-bold text-[#222831]">Total:</span>
                                <span className="text-[14.5px] font-bold" style={{ color: ORANGE }}>{money(totalPrice)}</span>
                            </div>
                            <Link
                                href="/checkout"
                                onClick={close}
                                className="block w-full text-center py-2.5 rounded text-[12.5px] font-bold tracking-wide uppercase text-white hover:opacity-90 transition-opacity"
                                style={{ background: ORANGE }}
                            >
                                Checkout
                            </Link>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default CartDrawer;
