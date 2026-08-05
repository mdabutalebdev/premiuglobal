"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';
import { useAppDispatch } from '@/redux';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { clearImageSearch } from '@/redux/slices/imageSearchSlice';

const money = (n: number) => `৳${Number(n || 0).toLocaleString('en-US')}`;

interface Suggestion {
    _id: string;
    name: string;
    slug?: string;
    price: number;
    originalPrice?: number | null;
    thumbnail?: string;
    brand?: string;
}

/**
 * Header search field with a live product-suggestion dropdown. Typing (debounced)
 * queries products by name; each row shows thumbnail, name, price and brand, and
 * navigates straight to that product. Enter / the icon opens the full results page.
 */
const SearchBox: React.FC<{ className?: string; onNavigate?: () => void }> = ({ className = '', onNavigate }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    // Debounce so we don't fire a request on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 250);
        return () => clearTimeout(t);
    }, [query]);

    const { data, isFetching } = useGetProductsQuery(
        { limit: 10, searchTerm: debounced },
        { skip: debounced.length < 2 },
    );
    const results: Suggestion[] = data?.data || [];

    // Close the dropdown when clicking anywhere outside the box.
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const goToResults = () => {
        const t = query.trim();
        if (!t) return;
        setOpen(false);
        dispatch(clearImageSearch());
        onNavigate?.();
        // `?s=beef+achar` style — `s` param, spaces as `+` (URLSearchParams does both).
        router.push(`/products?${new URLSearchParams({ s: t }).toString()}`);
    };

    const goToProduct = (p: Suggestion) => {
        setOpen(false);
        setQuery('');
        onNavigate?.();
        router.push(`/product/${p.slug || p._id}`);
    };

    const showDropdown = open && debounced.length >= 2;

    return (
        <div ref={boxRef} className={`relative ${className}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => e.key === 'Enter' && goToResults()}
                placeholder="Search products..."
                className="w-full h-[47px] rounded-lg bg-[#f5f5f5] pl-4 pr-[42px] text-[14px] text-[#222831] placeholder-[#222831]/70 outline-none"
            />
            <button
                onClick={goToResults}
                aria-label="Search"
                className="absolute right-[14px] top-1/2 -translate-y-1/2 flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ color: '#252a34' }}
            >
                <FiSearch size={20} />
            </button>

            {showDropdown && (
                <div className="custom-scrollbar absolute left-0 right-0 top-[calc(100%+8px)] z-[70] bg-white rounded-md border border-[#e5e5e5] shadow-[0_10px_30px_rgba(0,0,0,0.12)] max-h-[420px] overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="px-4 py-6 text-center text-[13.5px] text-gray-400">
                            {isFetching ? 'Searching…' : `No products found for "${debounced}"`}
                        </div>
                    ) : (
                        results.map((p) => {
                            const hasDiscount = !!p.originalPrice && p.originalPrice > p.price;
                            return (
                                <button
                                    key={p._id}
                                    onClick={() => goToProduct(p)}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#f7f7f7] transition-colors"
                                >
                                    <span className="w-12 h-12 shrink-0 rounded-md border border-[#eee] bg-white overflow-hidden flex items-center justify-center p-1">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={p.thumbnail || '/images/categories/organic.svg'}
                                            alt={p.name}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[15px] leading-snug text-[#3a3a3a] truncate">{p.name}</span>
                                        <span className="block mt-1 text-[15px] font-semibold text-[var(--filter-accent)]">
                                            {money(p.price)}
                                            {hasDiscount && (
                                                <span className="ml-1.5 text-[13px] font-normal text-gray-400 line-through">{money(p.originalPrice as number)}</span>
                                            )}
                                        </span>
                                        {p.brand && <span className="block text-[13px] text-gray-400 mt-0.5 truncate">{p.brand}</span>}
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBox;
