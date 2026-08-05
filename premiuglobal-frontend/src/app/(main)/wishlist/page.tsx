"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiTrash2, FiShoppingBag, FiHeart } from 'react-icons/fi';
import { useAppSelector, useAppDispatch } from '@/redux';
import { removeFromWishlist, WishlistItem } from '@/redux/slices/wishlistSlice';
import { addToCart } from '@/redux/slices/cartSlice';
import { openCartModal } from '@/redux/slices/uiSlice';

const ORANGE = '#F47B20';
const DARK = '#0C2E20';
const TEXT = '#1F3347';

const money = (n: number) => `৳${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function WishlistPage() {
    const items = useAppSelector((s) => s.wishlist.items);
    const dispatch = useAppDispatch();

    // Wishlist is hydrated from localStorage after mount, so wait for the client
    // before rendering (avoids a hydration mismatch and an empty-state flash).
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const addItemToCart = (w: WishlistItem) => {
        dispatch(addToCart({
            id: w.id,
            productId: w.id,
            name: w.name,
            price: w.price,
            mrp: w.mrp || w.price,
            image: w.image,
            category: w.category || 'General',
            quantity: 1,
        }));
        dispatch(openCartModal());
    };

    if (!mounted) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-[#F47B20] animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-background)] min-h-screen pb-16">

            {/* Hero — sits on the site's cream background (no white block) */}
            <div>
                <div className="mx-auto max-w-[1200px] px-4 lg:px-8 py-10 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-1 rounded-full" style={{ background: `${ORANGE}1a`, color: ORANGE }}>
                        <FiHeart size={13} /> Wishlist
                    </span>
                    <h1 className="mt-4 text-[26px] lg:text-[32px] font-bold" style={{ color: DARK }}>My Wishlist</h1>
                    <p className="mt-2 text-[14px] text-gray-500">
                        {items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''} saved` : 'Your saved products will appear here.'}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-[1200px] px-4 lg:px-8 mt-8">
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 py-16 flex flex-col items-center text-center">
                        <span className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${ORANGE}12`, color: ORANGE }}>
                            <FiHeart size={28} />
                        </span>
                        <p className="text-[16px] font-semibold" style={{ color: TEXT }}>Your wishlist is empty</p>
                        <p className="text-[13.5px] text-gray-500 mt-1 mb-5">Tap the heart on any product to save it here.</p>
                        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-[14px] font-semibold" style={{ background: ORANGE }}>
                            <FiShoppingBag size={16} /> Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
                        {items.map((w) => {
                            const href = w.slug ? `/product/${w.slug}` : '/products';
                            const hasDiscount = w.mrp && w.mrp > w.price;
                            return (
                                <div key={w.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col group">
                                    <div className="relative">
                                        <Link href={href} className="block aspect-square bg-white flex items-center justify-center p-3">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={w.image} alt={w.name} className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                                        </Link>
                                        <button
                                            onClick={() => dispatch(removeFromWishlist(w.id))}
                                            aria-label="Remove from wishlist"
                                            title="Remove from wishlist"
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="p-3 flex flex-col flex-1">
                                        <Link href={href} className="text-[13.5px] font-medium leading-snug line-clamp-2 hover:text-[#F47B20] transition-colors" style={{ color: TEXT }}>
                                            {w.name}
                                        </Link>
                                        <div className="mt-2 flex items-baseline gap-2">
                                            <span className="text-[15px] font-bold" style={{ color: ORANGE }}>{money(w.price)}</span>
                                            {hasDiscount && <span className="text-[12.5px] text-gray-400 line-through">{money(w.mrp)}</span>}
                                        </div>
                                        <button
                                            onClick={() => addItemToCart(w)}
                                            className="mt-3 h-9 rounded-md flex items-center justify-center gap-1.5 text-white text-[13px] font-semibold transition-opacity hover:opacity-90"
                                            style={{ background: ORANGE }}
                                        >
                                            <FiShoppingBag size={14} /> Add To Cart
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
