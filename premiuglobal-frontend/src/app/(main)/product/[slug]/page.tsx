"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    FiChevronLeft, FiChevronRight, FiShoppingBag, FiPhone, FiMinus, FiPlus,
} from 'react-icons/fi';
import { FaWhatsapp, FaHeart, FaRegHeart } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useGetProductBySlugQuery, useGetProductsQuery } from '@/redux/api/productApi';
import { useGetProductReviewsQuery } from '@/redux/api/reviewApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import ProductReviews from '@/components/products/ProductReviews';
import ShopProductCard from '@/components/shared/ShopProductCard';
import ShopSectionHeader from '@/components/shared/ShopSectionHeader';
import { useAppDispatch, useAppSelector } from '@/redux';
import { addToCart } from '@/redux/slices/cartSlice';
import { toggleWishlist } from '@/redux/slices/wishlistSlice';
import { openCartModal } from '@/redux/slices/uiSlice';
import { toGaItem, trackViewItem } from '@/lib/analytics/gtag';

const ORANGE = '#F47B20';
const DARK = '#0C2E20';
const TEXT = '#1F3347';
const GREEN = '#22C55E';
const WHATSAPP = '#22A94F';
const CALL = '#2B3F8C';

const money = (n: number) =>
    `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// wa.me needs a full international number — a local "01…" would 404.
const toWhatsAppNumber = (raw: string) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('880')) return digits;
    if (digits.startsWith('0')) return `880${digits.slice(1)}`;
    return digits;
};

export default function ProductDetailsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [tab, setTab] = useState<'description' | 'reviews'>('description');

    const { data: res, isLoading, isError } = useGetProductBySlugQuery(slug as string, { skip: !slug });
    const product = res?.data;

    const inWishlist = useAppSelector((s) => s.wishlist.items.some((i) => i.id === String(product?._id || '')));

    // Same args as <ProductReviews> so RTK Query shares one fetch; summary.total
    // is the approved-review count shown on the "Customer Reviews" tab.
    const { data: reviewsRes } = useGetProductReviewsQuery(
        { productId: product?._id, limit: 50, sort: '-createdAt' },
        { skip: !product?._id }
    );
    const reviewCount: number = reviewsRes?.meta?.summary?.total ?? (reviewsRes?.data?.length || 0);

    const { data: siteRes } = useGetSiteContentQuery({});
    const contact = siteRes?.data?.contact || {};
    const whatsappNumber = toWhatsAppNumber(contact.whatsapp || contact.phone || '');
    const phoneNumber = (contact.phone || '').replace(/[^\d+]/g, '');

    useEffect(() => {
        window.scrollTo({ top: 0 });
        setActiveImage(0);
        setQuantity(1);
    }, [slug]);

    // GA4: view_item once the product has loaded.
    useEffect(() => {
        if (!product?._id) return;
        trackViewItem(toGaItem(product, { quantity: 1 }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?._id]);

    // ── Variants ──────────────────────────────────────────────────────
    const variants: any[] = useMemo(() => product?.variants || [], [product]);
    const hasVariants = variants.length > 0;

    const colorSwatches: { name: string; hex: string }[] = useMemo(() => {
        if (!product) return [];
        if (hasVariants) {
            const map = new Map<string, string>();
            variants.forEach((v) => { if (v.color) map.set(v.color, v.colorHex || v.color); });
            return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
        }
        return (product.colors || []).map((c: string, i: number) => ({
            name: c,
            hex: product.colorHex?.[i] || c,
        }));
    }, [product, variants, hasVariants]);

    const sizeList: string[] = useMemo(() => {
        if (!product) return [];
        if (hasVariants) return [...new Set(variants.filter((v) => v.size).map((v) => v.size))] as string[];
        return product.sizes || [];
    }, [product, variants, hasVariants]);

    // The variant matching the current color + size picks the price, stock and images.
    const activeVariant = useMemo(() => {
        if (!hasVariants) return null;
        return variants.find((v) =>
            (!selectedColor || v.color === selectedColor) &&
            (!selectedSize || v.size === selectedSize)
        ) || null;
    }, [hasVariants, variants, selectedColor, selectedSize]);

    const gallery: string[] = useMemo(() => {
        if (!product) return [];
        const base = [product.thumbnail, ...(product.images || [])].filter(Boolean);
        if (!hasVariants) return Array.from(new Set(base));
        const seen = new Set<string>(base);
        const out = [...base];
        const doneColors = new Set<string>();
        variants.forEach((v) => {
            const key = v.color || `__${v.size}`;
            if (doneColors.has(key)) return;
            doneColors.add(key);
            (v.images || []).forEach((img: string) => {
                if (!seen.has(img)) { seen.add(img); out.push(img); }
            });
        });
        return out;
    }, [product, variants, hasVariants]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-[#F47B20] animate-spin" />
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
                <p className="text-lg font-semibold" style={{ color: TEXT }}>Product not found</p>
                <Link href="/products" className="px-6 py-2.5 rounded-md text-white text-sm font-medium" style={{ background: ORANGE }}>
                    Browse all products
                </Link>
            </div>
        );
    }

    const price = activeVariant ? activeVariant.price : product.price;
    const original = (activeVariant ? activeVariant.originalPrice : product.originalPrice) || 0;
    const hasDiscount = original > price;
    const savePercent = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
    const categoryName = typeof product.category === 'object' ? product.category?.name : '';
    const categoryId = typeof product.category === 'object' ? product.category?._id : '';

    // Customers must pick their options before the product can go in the cart.
    const validateSelection = () => {
        if (colorSwatches.length > 0 && !selectedColor) {
            toast.error('Please select a colour first.');
            return false;
        }
        if (sizeList.length > 0 && !selectedSize) {
            toast.error('Please select a size first.');
            return false;
        }
        return true;
    };

    const buildCartItem = () => ({
        id: [product._id, selectedColor, selectedSize].filter(Boolean).join('_'),
        productId: String(product._id),
        name: product.name,
        price,
        mrp: original || price,
        image: activeVariant?.images?.[0] || gallery[activeImage] || product.thumbnail || '',
        category: categoryName || 'General',
        quantity,
        ...(selectedColor ? { color: selectedColor } : {}),
        ...(selectedSize ? { size: selectedSize } : {}),
    });

    const handleAddToCart = () => {
        if (!validateSelection()) return;
        dispatch(addToCart(buildCartItem()));
        dispatch(openCartModal()); // slide the cart panel in
    };

    const handleToggleWishlist = () => {
        dispatch(toggleWishlist({
            id: String(product._id),
            slug: product.slug || '',
            name: product.name,
            price,
            mrp: original || price,
            image: product.thumbnail || gallery[activeImage] || '',
            category: categoryName || 'General',
            rating: 0,
        }));
        toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    };

    const handleBuyNow = () => {
        if (!validateSelection()) return;
        dispatch(addToCart(buildCartItem()));
        router.push('/checkout');
    };

    const orderText = encodeURIComponent(
        `Hello! I would like to order:\n\n${product.name}\nQuantity: ${quantity}\nPrice: ${money(price)}`
    );

    return (
        <div className="bg-[var(--color-background)] min-h-screen pb-12">
            <div className="mx-auto max-w-[1500px] px-4 lg:px-8">

                <nav className="flex items-center gap-2 py-4 text-[13px] text-gray-500">
                    <Link href="/" className="hover:text-[#F47B20] transition-colors">Home</Link>
                    <FiChevronRight size={13} />
                    <Link href="/products" className="hover:text-[#F47B20] transition-colors">Products</Link>
                </nav>

                {/* ═══ Main card ═══ */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">

                        {/* ── Gallery ── */}
                        <div className="flex gap-3 lg:gap-4">
                            {gallery.length > 1 && (
                                <div className="flex flex-col gap-3 shrink-0">
                                    {gallery.slice(0, 5).map((img, i) => (
                                        <button
                                            key={img + i}
                                            onClick={() => setActiveImage(i)}
                                            aria-label={`View image ${i + 1}`}
                                            className={`w-[62px] h-[62px] lg:w-[68px] lg:h-[68px] rounded border p-1.5 bg-white transition-colors ${i === activeImage ? 'border-[#F47B20]' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img} alt="" className="w-full h-full object-contain" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="relative flex-1 border border-gray-200 rounded bg-white">
                                <div className="aspect-square flex items-center justify-center p-6">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={gallery[activeImage] || product.thumbnail || ''}
                                        alt={product.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>

                                {gallery.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length)}
                                            aria-label="Previous image"
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                        >
                                            <FiChevronLeft size={22} />
                                        </button>
                                        <button
                                            onClick={() => setActiveImage((i) => (i + 1) % gallery.length)}
                                            aria-label="Next image"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                        >
                                            <FiChevronRight size={22} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ── Details ── */}
                        <div className="pt-1">
                            <h1 className="text-[23px] lg:text-[28px] font-semibold leading-snug" style={{ color: TEXT }}>
                                {product.name}
                            </h1>

                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                <span className="text-[21px] lg:text-[24px] font-bold" style={{ color: ORANGE }}>
                                    {money(price)}
                                </span>
                                {hasDiscount && (
                                    <>
                                        <span className="text-[16px] lg:text-[17px] text-gray-400 line-through">
                                            {money(original)}
                                        </span>
                                        <span
                                            className="px-1.5 py-[2px] rounded text-white text-[11px] font-medium"
                                            style={{ background: GREEN }}
                                        >
                                            Save {savePercent}%
                                        </span>
                                    </>
                                )}
                            </div>

                            <hr className="my-5 border-gray-200" />

                            {/* Colour — only when the product actually has options */}
                            {colorSwatches.length > 0 && (
                                <div className="mb-4 flex items-center gap-5 flex-wrap">
                                    <span className="text-[14px]" style={{ color: TEXT }}>Colour:</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {colorSwatches.map((c) => (
                                            <button
                                                key={c.name}
                                                onClick={() => setSelectedColor(c.name)}
                                                title={c.name}
                                                aria-label={c.name}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c.name ? 'border-[#F47B20] scale-110' : 'border-gray-200'}`}
                                                style={{ background: c.hex }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size */}
                            {sizeList.length > 0 && (
                                <div className="mb-4 flex items-center gap-5 flex-wrap">
                                    <span className="text-[14px]" style={{ color: TEXT }}>Size:</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {sizeList.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setSelectedSize(s)}
                                                className={`min-w-[44px] h-9 px-3 rounded border text-[13.5px] transition-colors ${selectedSize === s
                                                    ? 'border-[#F47B20] text-[#F47B20] bg-orange-50'
                                                    : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity + Add to Wishlist */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-[14px]" style={{ color: TEXT }}>Quantity:</span>
                                <div className="inline-flex items-center gap-3 border border-gray-200 rounded-full px-2 py-1.5">
                                    <button
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        aria-label="Decrease quantity"
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                                        style={{ background: ORANGE }}
                                    >
                                        <FiMinus size={15} />
                                    </button>
                                    <span className="min-w-8 text-center text-[15px] font-semibold" style={{ color: TEXT }}>
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity((q) => q + 1)}
                                        aria-label="Increase quantity"
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90"
                                        style={{ background: ORANGE }}
                                    >
                                        <FiPlus size={15} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleToggleWishlist}
                                    className="inline-flex items-center gap-2 h-[42px] px-5 rounded-full border text-[14px] font-medium transition-opacity hover:opacity-90"
                                    style={{ borderColor: inWishlist ? ORANGE : '#e5e7eb', color: inWishlist ? ORANGE : TEXT, background: inWishlist ? '#F47B200f' : '#fff' }}
                                >
                                    {inWishlist ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
                                    {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="h-[46px] rounded flex items-center justify-center gap-2 text-white text-[14px] font-semibold tracking-wide hover:brightness-95 transition"
                                    style={{ background: ORANGE }}
                                >
                                    <FiShoppingBag size={17} />
                                    ADD TO CART
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    className="h-[46px] rounded flex items-center justify-center text-white text-[14px] font-semibold tracking-wide hover:brightness-125 transition"
                                    style={{ background: DARK }}
                                >
                                    BUY NOW
                                </button>

                                {whatsappNumber && (
                                    <a
                                        href={`https://wa.me/${whatsappNumber}?text=${orderText}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-[46px] rounded flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:brightness-95 transition"
                                        style={{ background: WHATSAPP }}
                                    >
                                        <FaWhatsapp size={18} />
                                        Order On WhatsApp
                                    </a>
                                )}
                                {phoneNumber && (
                                    <a
                                        href={`tel:${phoneNumber}`}
                                        className="h-[46px] rounded flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:brightness-110 transition"
                                        style={{ background: CALL }}
                                    >
                                        <FiPhone size={17} />
                                        Call For Order
                                    </a>
                                )}
                            </div>

                            {categoryName && (
                                <div className="mt-5 inline-flex items-center gap-2 border border-gray-200 rounded px-4 py-2.5">
                                    <span className="text-[14px] text-gray-500">Category:</span>
                                    <Link
                                        href={`/products?category=${categoryId}`}
                                        className="text-[14px] font-medium hover:opacity-75 transition-opacity"
                                        style={{ color: TEXT }}
                                    >
                                        {categoryName}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ Description / Customer Reviews — tabbed (like ghorerbazar) ═══ */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {([
                            { key: 'description', label: 'Description' },
                            { key: 'reviews', label: `Customer Reviews (${reviewCount})` },
                        ] as const).map(t => {
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className="px-5 sm:px-6 py-3.5 text-[14px] font-medium border-b-2 transition-colors"
                                    style={{
                                        color: active ? TEXT : '#8a94a0',
                                        background: active ? '#f9fafb' : 'transparent',
                                        borderColor: active ? ORANGE : 'transparent',
                                    }}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {tab === 'description' ? (
                        <div className="p-6">
                            {product.description ? (
                                <div
                                    className="text-[14.5px] leading-relaxed text-gray-600 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_p]:mb-3 [&_strong]:font-bold [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg"
                                    dangerouslySetInnerHTML={{ __html: product.description }}
                                />
                            ) : (
                                <p className="text-[14.5px] leading-relaxed text-gray-600">
                                    No description available for this product yet.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 lg:p-8">
                            {/* Approved reviews list only — the submit form lives below, always visible */}
                            <ProductReviews productId={product._id} part="list" embedded />
                        </div>
                    )}
                </div>

                {/* ═══ Submit Your Review — summary + form, always below the tabs (like before) ═══ */}
                <ProductReviews productId={product._id} part="submit" />

                {/* ═══ Related products ═══ */}
                <RelatedProducts product={product} />
            </div>
        </div>
    );
}

/* Products from the same category, minus the one being viewed. Products whose
   category reference is missing still get a row — best sellers stand in — so the
   section never silently disappears. */
function RelatedProducts({ product }: { product: any }) {
    const categoryId = typeof product.category === 'object' ? product.category?._id : product.category;

    const { data: sameCategory } = useGetProductsQuery(
        { limit: 6, category: categoryId, sort: '-createdAt' },
        { skip: !categoryId },
    );

    const exclude = (list: any[]) => list.filter((p: any) => p._id !== product._id).slice(0, 5);
    const categoryItems = exclude(sameCategory?.data || []);

    const needsFallback = !categoryId || categoryItems.length === 0;
    const { data: fallback } = useGetProductsQuery(
        { limit: 6, sort: '-totalSold' },
        { skip: !needsFallback },
    );

    const items = needsFallback ? exclude(fallback?.data || []) : categoryItems;
    if (items.length === 0) return null;

    return (
        <div className="mt-8">
            <ShopSectionHeader
                title="Related Products"
                href={categoryId && !needsFallback ? `/products?category=${categoryId}` : '/products'}
                linkLabel="More Products"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                {items.map((p) => (
                    <ShopProductCard key={p._id} product={p} />
                ))}
            </div>
        </div>
    );
}
