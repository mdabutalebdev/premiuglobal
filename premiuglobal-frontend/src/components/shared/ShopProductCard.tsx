"use client";

import React from 'react';
import Link from 'next/link';
import { FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { NO_IMAGE } from '@/utils/placeholder';
import { addToCart, updateQuantity, removeFromCart } from '@/redux/slices/cartSlice';
import { openCartModal } from '@/redux/slices/uiSlice';

/**
 * The one product card for the whole storefront — home, shop, search, related.
 * Design is a 1:1 match of the reference storefront (see the shop page notes):
 * 1px #ccc border, 4px radius, flag badge, orange price, outlined Add To Cart
 * that becomes a quantity stepper. Hover does nothing except zoom the image.
 */
export interface ShopProduct {
    _id?: string;
    id?: string | number;
    name: string;
    slug?: string;
    price: number;
    originalPrice?: number | null;
    mrp?: number | null;
    thumbnail?: string;
    image?: string;
    images?: string[];
    flags?: string[];
    stock?: number;
    status?: string;
    variants?: { stock?: number }[];
    category?: { name?: string } | string | null;
    categoryName?: string;
}

// Badge text for the flags an admin can set on a product
const FLAG_LABELS: Record<string, string> = {
    'best-selling': 'Best Selling',
    'new-arrival': 'New Arrival',
    'featured': 'Featured',
    'on-sale': 'On Sale',
};

const PLACEHOLDER = NO_IMAGE;

export const money = (n: number) => `৳${(n ?? 0).toLocaleString('en-US')}`;

const ShopProductCard: React.FC<{ product: ShopProduct; onSelect?: () => void }> = ({ product, onSelect }) => {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((s: any) => s.cart.items);

    const id = String(product._id || product.id || '');
    const inCart = cartItems.find((i: any) => i.id === id);
    const qty = inCart?.quantity || 0;

    const image = product.thumbnail || product.image || product.images?.[0] || PLACEHOLDER;
    const href = `/product/${product.slug || id}`;
    const flag = product.flags?.find(f => FLAG_LABELS[f]);
    const original = product.originalPrice || product.mrp || 0;
    const categoryName = product.categoryName
        || (typeof product.category === 'object' ? product.category?.name : undefined);

    // A variable product is in stock while any variant has stock left.
    const variantStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0);
    const totalStock = product.variants?.length ? variantStock : product.stock;
    const outOfStock = product.status === 'out-of-stock' || totalStock === 0;

    const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

    const handleAdd = (e: React.MouseEvent) => {
        stop(e);
        dispatch(addToCart({
            id,
            productId: id,
            name: product.name,
            price: product.price,
            mrp: original || product.price,
            image,
            category: categoryName || 'General',
        }));
        dispatch(openCartModal()); // slide the cart panel in, like the reference store
    };

    const handleStep = (e: React.MouseEvent, next: number) => {
        stop(e);
        if (next <= 0) dispatch(removeFromCart(id));
        else dispatch(updateQuantity({ id, quantity: next }));
    };

    return (
        <div className="bg-white border border-[#cccccc] rounded p-2 group">
            <Link href={href} onClick={onSelect} className="block">
                {/* Media — the image zoom is the card's only hover effect */}
                <div className="relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={product.name}
                        draggable={false}
                        className="w-full aspect-[183/165] object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                    {flag && (
                        <span className="absolute top-1.5 left-1.5 bg-[var(--filter-accent)] text-white text-[10px] leading-none px-1.5 py-1 rounded">
                            {FLAG_LABELS[flag]}
                        </span>
                    )}
                </div>

                {/* Details */}
                <div className="pt-3">
                    <h4 className="text-[15px] font-medium text-[#222831] leading-[1.2] mb-2 line-clamp-2 min-h-[36px]">
                        {product.name}
                    </h4>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[16px] font-semibold text-[var(--filter-accent)]">
                            {money(product.price)}
                        </span>
                        {original > product.price && (
                            <span className="text-[12px] line-through text-gray-400">{money(original)}</span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Add to cart — swaps to a stepper once the item is in the cart */}
            <div className="mt-3">
                {outOfStock ? (
                    <div className="w-full h-[34px] flex items-center justify-center border border-red-400 rounded text-[12px] font-semibold text-red-500">
                        Stock Out
                    </div>
                ) : qty > 0 ? (
                    <div className="flex items-center justify-between h-[34px] border border-[var(--filter-accent)] rounded overflow-hidden">
                        <button
                            onClick={e => handleStep(e, qty - 1)}
                            className="w-9 h-full flex items-center justify-center text-[var(--filter-accent)] hover:bg-[var(--filter-accent)] hover:text-white transition-colors"
                            aria-label="Decrease quantity"
                        >
                            <FiMinus size={13} />
                        </button>
                        <span className="text-[13px] font-semibold text-[#222831]">{qty}</span>
                        <button
                            onClick={e => handleStep(e, qty + 1)}
                            className="w-9 h-full flex items-center justify-center text-[var(--filter-accent)] hover:bg-[var(--filter-accent)] hover:text-white transition-colors"
                            aria-label="Increase quantity"
                        >
                            <FiPlus size={13} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleAdd}
                        className="w-full h-[34px] flex items-center justify-center gap-1.5 border border-[var(--filter-accent)] rounded text-[12px] font-semibold text-[var(--filter-accent)] hover:bg-[var(--filter-accent)] hover:text-white transition-colors"
                    >
                        <FiShoppingCart size={14} /> Add To Cart
                    </button>
                )}
            </div>
        </div>
    );
};

export default ShopProductCard;
