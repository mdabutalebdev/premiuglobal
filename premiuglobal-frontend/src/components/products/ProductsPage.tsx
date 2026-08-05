"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { useAppSelector, useAppDispatch } from '@/redux';
import { clearImageSearch } from '@/redux/slices/imageSearchSlice';
import { toGaItem, trackViewItemList, trackSelectItem } from '@/lib/analytics/gtag';
import ShopProductCard from '@/components/shared/ShopProductCard';
import { FiX, FiFilter, FiCamera, FiMinus, FiPlus, FiChevronDown, FiCheck } from 'react-icons/fi';

const COUNTRIES = ['All', 'Bangladesh', 'Pakistan', 'UAE', 'USA', 'China'];

// Product flags an admin can set — kept in sync with the backend enum
const PRODUCT_FLAGS = [
    { value: 'best-selling', label: 'Best Selling' },
    { value: 'new-arrival', label: 'New Arrival' },
    { value: 'featured', label: 'Featured' },
    { value: 'on-sale', label: 'On Sale' },
    { value: 'combo', label: 'Exclusive Combo Deals' },
];

// How many options a filter list shows before the "+ More" toggle
const VISIBLE_OPTIONS = 5;

// '' = "Default". Matching the reference's Show 16 / 20 / 24 / 36 choices.
const DEFAULT_PER_PAGE = 24;
const PER_PAGE_OPTIONS = [
    { label: 'Default', value: '' },
    { label: 'Show 16', value: '16' },
    { label: 'Show 20', value: '20' },
    { label: 'Show 24', value: '24' },
    { label: 'Show 36', value: '36' },
];

const SORT_OPTIONS = [
    { label: 'Default Sorting', value: '-createdAt' },
    { label: 'Sort by Oldest', value: 'createdAt' },
    { label: 'Price Low to High', value: 'price' },
    { label: 'Price High to Low', value: '-price' },
    { label: 'Most Popular', value: '-totalSold' },
    { label: 'Top Rated', value: '-rating' },
];

const formatBDT = (n: number) => `৳ ${Math.round(n).toLocaleString('en-US')}`;

/**
 * True only after the first client render. Used to gate chrome whose *presence*
 * depends on the URL query — the server and client can disagree about search
 * params at hydration, and a whole element appearing or vanishing is a hard
 * hydration mismatch rather than a recoverable one.
 */
function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}

/* ── Collapsible sidebar card: uppercase title, accent underline, −/+ toggle ── */
function FilterCard({
    title,
    children,
    defaultOpen = true,
}: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded p-3 mb-1.5 shadow-[0_1px_1px_0_rgba(0,0,0,0.1)]">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between py-3.5 pr-1 border-b border-[#eeeeee] relative"
            >
                <span className="relative text-[13px] font-bold uppercase tracking-[0.6px] text-[#222222] leading-none">
                    {title}
                    <span className="absolute left-0 -bottom-[12px] w-full h-[2px] bg-[var(--filter-accent)]" />
                </span>
                <span className="text-[#999999]">
                    {open ? <FiMinus size={14} /> : <FiPlus size={14} />}
                </span>
            </button>
            {open && <div className="pt-3">{children}</div>}
        </div>
    );
}

/* ── Dual-handle price slider (thumb styling lives in .ff-range, globals.css) ── */
function PriceRangeSlider({
    bounds,
    value,
    onChange,
}: {
    bounds: { min: number; max: number };
    value: { min: number; max: number };
    onChange: (v: { min: number; max: number }) => void;
}) {
    const span = Math.max(bounds.max - bounds.min, 1);
    const pct = (v: number) => ((Math.min(Math.max(v, bounds.min), bounds.max) - bounds.min) / span) * 100;
    const step = Math.max(1, Math.round(span / 100));
    const THUMB = 20; // keep in sync with .ff-range thumb size in globals.css
    const lo = pct(value.min);
    const hi = pct(value.max);

    return (
        <div className="px-1.5 pb-2">
            <div className="flex items-center justify-between mb-3.5 text-[13px] font-semibold text-[#444444]">
                <span>{formatBDT(value.min)}</span>
                <span>{formatBDT(value.max)}</span>
            </div>
            <div className="relative h-5 mx-1.5">
                <div className="absolute top-1/2 -translate-y-1/2 h-[6px] w-full rounded border border-[#dddddd] bg-[#eeeeee]" />
                {/* The thumb centre is inset by half its width at the extremes, so the
                    filled bar gets the same correction or it drifts past the handles. */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-[6px] rounded bg-[var(--filter-accent)]"
                    style={{
                        left: `calc(${lo}% + ${((0.5 - lo / 100) * THUMB).toFixed(2)}px)`,
                        width: `calc(${Math.max(hi - lo, 0)}% - ${(Math.max(hi - lo, 0) / 100 * THUMB).toFixed(2)}px)`,
                    }}
                />
                <div className="absolute inset-0">
                    <input
                        type="range"
                        className="ff-range"
                        min={bounds.min}
                        max={bounds.max}
                        step={step}
                        value={value.min}
                        onChange={e => onChange({ min: Math.min(Number(e.target.value), value.max), max: value.max })}
                        aria-label="Minimum price"
                    />
                    <input
                        type="range"
                        className="ff-range"
                        min={bounds.min}
                        max={bounds.max}
                        step={step}
                        value={value.max}
                        onChange={e => onChange({ min: value.min, max: Math.max(Number(e.target.value), value.min) })}
                        aria-label="Maximum price"
                    />
                </div>
            </div>
        </div>
    );
}

/* ── One checkbox row inside a filter card ── */
function CheckRow({
    checked,
    onChange,
    label,
    count,
    small = false,
}: {
    checked: boolean;
    onChange: () => void;
    label: string;
    count?: number;
    small?: boolean;
}) {
    const muted = count === 0;
    return (
        <label className={`flex items-center gap-[9px] py-[5px] cursor-pointer ${small ? 'text-[13px]' : 'text-[14px]'} ${muted ? 'text-[#aaaaaa]' : 'text-[#222831]'} hover:text-[var(--filter-accent)] transition-colors`}>
            {/* Custom box — a native checkbox picks its own tick colour from the
                accent, and against this orange Chrome picks black instead of white. */}
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <span
                className={`w-4 h-4 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--filter-accent)]/40 ${checked
                    ? 'bg-[var(--filter-accent)] border-[var(--filter-accent)]'
                    : 'bg-white border-[#cccccc]'}`}
            >
                {checked && <FiCheck size={11} strokeWidth={4} className="text-white" />}
            </span>
            <span className="flex-1">{label}</span>
            {typeof count === 'number' && count > 0 && (
                <span className="text-[11px] font-bold px-[7px] py-px rounded-full bg-[#f3e8ff] text-[#7c3aed]">
                    {count}
                </span>
            )}
        </label>
    );
}

function MoreToggle({ expanded, hidden, onClick }: { expanded: boolean; hidden: number; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mt-1.5 text-[12px] font-semibold text-[var(--filter-accent)] hover:underline"
        >
            {expanded ? '− Less' : `+ More (${hidden})`}
        </button>
    );
}

/* ── The whole filter column — shared by the desktop sidebar and the mobile drawer ── */
function FilterPanel(props: {
    topCategories: any[];
    childrenOf: (id: string) => any[];
    selectedCategory: string;
    selectedSubcategory: string;
    selectedCountry: string;
    selectedBrands: string[];
    selectedFlags: string[];
    brandFacet: { name: string; count: number }[];
    flagFacet: { name: string; count: number }[];
    onCategorySelect: (id: string) => void;
    onSubcategorySelect: (catId: string, subId: string) => void;
    onCountrySelect: (country: string) => void;
    onBrandToggle: (brand: string) => void;
    onFlagToggle: (flag: string) => void;
    priceBounds: { min: number; max: number };
    price: { min: number; max: number };
    setPrice: (v: { min: number; max: number }) => void;
    hasFilters: boolean;
    onClear: () => void;
}) {
    const {
        topCategories, childrenOf, selectedCategory, selectedSubcategory, selectedCountry,
        selectedBrands, selectedFlags, brandFacet, flagFacet,
        onCategorySelect, onSubcategorySelect, onCountrySelect, onBrandToggle, onFlagToggle,
        priceBounds, price, setPrice, hasFilters, onClear,
    } = props;

    const [showAllCats, setShowAllCats] = useState(false);
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showAllCountries, setShowAllCountries] = useState(false);
    const mounted = useMounted();

    // Keep an active-but-hidden option visible instead of silently collapsing it
    useEffect(() => {
        if (selectedCategory && topCategories.findIndex(c => c._id === selectedCategory) >= VISIBLE_OPTIONS) {
            setShowAllCats(true);
        }
    }, [selectedCategory, topCategories]);

    useEffect(() => {
        if (selectedCountry && COUNTRIES.indexOf(selectedCountry) >= VISIBLE_OPTIONS) {
            setShowAllCountries(true);
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedBrands.some(b => brandFacet.findIndex(f => f.name === b) >= VISIBLE_OPTIONS)) {
            setShowAllBrands(true);
        }
    }, [selectedBrands, brandFacet]);

    const visibleCats = showAllCats ? topCategories : topCategories.slice(0, VISIBLE_OPTIONS);
    const visibleBrands = showAllBrands ? brandFacet : brandFacet.slice(0, VISIBLE_OPTIONS);
    const visibleCountries = showAllCountries ? COUNTRIES : COUNTRIES.slice(0, VISIBLE_OPTIONS);
    const flagCount = (v: string) => flagFacet.find(f => f.name === v)?.count ?? 0;

    return (
        <>
            {/* Only shown once something is actually filtered — clearing the last
                filter by hand makes it disappear again on its own. Gated on
                `mounted` because whether it exists is derived from the URL, and
                the server and client don't always agree on that at hydration. */}
            {mounted && hasFilters && (
                <button
                    onClick={onClear}
                    className="w-full mb-3.5 py-[9px] px-3 rounded-md text-[13px] font-semibold tracking-[0.3px] text-white bg-[linear-gradient(135deg,#ff4444,#cc0000)] shadow-[0_2px_8px_rgba(255,68,68,0.3)] hover:opacity-85 transition-opacity flex items-center justify-center gap-2"
                >
                    <FiX size={14} /> Clear All Filters
                </button>
            )}

            <FilterCard title="Price Range">
                {priceBounds.max > priceBounds.min ? (
                    <PriceRangeSlider bounds={priceBounds} value={price} onChange={setPrice} />
                ) : (
                    <p className="text-[13px] text-gray-400 py-1">No price range available</p>
                )}
            </FilterCard>

            <FilterCard title="Filter By Category">
                <ul>
                    <li>
                        <CheckRow checked={!selectedCategory} onChange={() => onCategorySelect('')} label="All Categories" />
                    </li>
                    {visibleCats.map((cat: any) => {
                        const isOpen = selectedCategory === cat._id;
                        const subs = childrenOf(cat._id);
                        return (
                            <li key={cat._id}>
                                <CheckRow
                                    checked={isOpen}
                                    onChange={() => onCategorySelect(cat._id)}
                                    label={cat.name}
                                    count={cat.productCount}
                                />
                                {isOpen && subs.length > 0 && (
                                    <ul className="ml-4 pl-2 border-l border-gray-200">
                                        <li>
                                            <CheckRow
                                                small
                                                checked={!selectedSubcategory}
                                                onChange={() => onCategorySelect(cat._id)}
                                                label={`All ${cat.name}`}
                                            />
                                        </li>
                                        {subs.map((sub: any) => (
                                            <li key={sub._id}>
                                                <CheckRow
                                                    small
                                                    checked={selectedSubcategory === sub._id}
                                                    onChange={() => onSubcategorySelect(cat._id, sub._id)}
                                                    label={sub.name}
                                                    count={sub.productCount}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
                {topCategories.length > VISIBLE_OPTIONS && (
                    <MoreToggle
                        expanded={showAllCats}
                        hidden={topCategories.length - VISIBLE_OPTIONS}
                        onClick={() => setShowAllCats(v => !v)}
                    />
                )}
            </FilterCard>

            {brandFacet.length > 0 && (
                <FilterCard title="Brands">
                    <ul>
                        {visibleBrands.map(b => (
                            <li key={b.name}>
                                <CheckRow
                                    checked={selectedBrands.includes(b.name)}
                                    onChange={() => onBrandToggle(b.name)}
                                    label={b.name}
                                    count={b.count}
                                />
                            </li>
                        ))}
                    </ul>
                    {brandFacet.length > VISIBLE_OPTIONS && (
                        <MoreToggle
                            expanded={showAllBrands}
                            hidden={brandFacet.length - VISIBLE_OPTIONS}
                            onClick={() => setShowAllBrands(v => !v)}
                        />
                    )}
                </FilterCard>
            )}

            <FilterCard title="Product Flag">
                <ul>
                    {PRODUCT_FLAGS.map(f => (
                        <li key={f.value}>
                            <CheckRow
                                checked={selectedFlags.includes(f.value)}
                                onChange={() => onFlagToggle(f.value)}
                                label={f.label}
                                count={flagCount(f.value)}
                            />
                        </li>
                    ))}
                </ul>
            </FilterCard>
        </>
    );
}

const ProductsPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    // Image search results (set from the Header camera search)
    const imageSearch = useAppSelector((s: any) => s.imageSearch);
    const imageActive = !!imageSearch?.isActive;

    const categoryParam = searchParams.get('category') || '';
    const subcategoryParam = searchParams.get('subcategory') || '';
    // `s` is the current search param; `q` kept as a fallback so old links still resolve.
    const searchParam = searchParams.get('s') || searchParams.get('q') || '';
    const countryParam = searchParams.get('country') || '';
    const brandParam = searchParams.get('brand') || '';
    const flagParam = searchParams.get('flag') || '';

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState(categoryParam);
    const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam);
    const [selectedCountry, setSelectedCountry] = useState(countryParam);

    const selectedBrands = useMemo(() => brandParam.split(',').filter(Boolean), [brandParam]);
    const selectedFlags = useMemo(() => flagParam.split(',').filter(Boolean), [flagParam]);

    // Price: `price` follows the slider, `appliedPrice` is the debounced value that
    // actually hits the API. Both null until the user touches the slider.
    const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
    const [price, setPrice] = useState<{ min: number; max: number } | null>(null);
    const [appliedPrice, setAppliedPrice] = useState<{ min: number; max: number } | null>(null);

    // Category hierarchy helpers
    const topCategories = categories.filter((c: any) => !c.parent);
    const childrenOf = (id: string) => categories.filter((c: any) => (c.parent?._id || c.parent) === id);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
                const data = await res.json();
                if (data.success) setCategories(data.data || data.categories || []);
            } catch (e) { console.error(e); }
        };
        fetchCategories();
    }, []);

    // Sync URL params — a new category/search resets the price selection
    useEffect(() => {
        setSelectedCategory(categoryParam);
        setSelectedSubcategory(subcategoryParam);
        setSelectedCountry(countryParam);
        setPage(1);
        setPrice(null);
        setAppliedPrice(null);
    }, [categoryParam, subcategoryParam, searchParam, countryParam, brandParam, flagParam]);

    // Debounce the slider so dragging doesn't fire a request per pixel
    useEffect(() => {
        const t = setTimeout(() => setAppliedPrice(price), 400);
        return () => clearTimeout(t);
    }, [price]);

    // Build query
    const queryParams = useMemo(() => {
        const params: any = { page, limit: perPage ? Number(perPage) : DEFAULT_PER_PAGE, sort: sortBy };
        if (selectedCategory) params.category = selectedCategory;
        if (selectedSubcategory) params.subcategory = selectedSubcategory;
        if (selectedCountry && selectedCountry !== 'All') params.country = selectedCountry;
        if (searchParam) params.searchTerm = searchParam;
        if (brandParam) params.brand = brandParam;
        if (flagParam) params.flag = flagParam;
        if (appliedPrice) {
            params.minPrice = appliedPrice.min;
            params.maxPrice = appliedPrice.max;
        }
        return params;
    }, [page, perPage, sortBy, selectedCategory, selectedSubcategory, selectedCountry, searchParam, brandParam, flagParam, appliedPrice]);

    const { data, isFetching } = useGetProductsQuery(queryParams);
    const products = data?.data || [];
    const meta = data?.meta || { total: 0, totalPages: 1 };
    const totalPage = meta.totalPages ?? meta.totalPage ?? 1;
    const brandFacet = meta.brands || [];
    const flagFacet = meta.flags || [];

    // Slider bounds come from the API (price filter excluded), so they stay stable
    // while the user drags. Rounded outward to a tidy step.
    const metaMin = data?.meta?.minPrice;
    const metaMax = data?.meta?.maxPrice;
    useEffect(() => {
        if (typeof metaMax !== 'number' || metaMax <= 0) return;
        const lo = Math.max(0, Math.floor((metaMin ?? 0) / 10) * 10);
        const hi = Math.ceil(metaMax / 10) * 10;
        setPriceBounds(prev => (prev.min === lo && prev.max === hi ? prev : { min: lo, max: hi }));
    }, [metaMin, metaMax]);

    // When an image search is active, show those results instead of the catalog
    const displayProducts = imageActive ? (imageSearch.products || []) : products;

    // Central URL builder — only the passed keys change, the rest are preserved
    const pushFilters = (next: {
        category?: string; subcategory?: string; country?: string;
        s?: string; brand?: string; flag?: string;
    }) => {
        const category = next.category !== undefined ? next.category : selectedCategory;
        const subcategory = next.subcategory !== undefined ? next.subcategory : selectedSubcategory;
        const country = next.country !== undefined ? next.country : selectedCountry;
        const s = next.s !== undefined ? next.s : searchParam;
        const brand = next.brand !== undefined ? next.brand : brandParam;
        const flag = next.flag !== undefined ? next.flag : flagParam;
        const params = new URLSearchParams();
        // `.set` encodes spaces as `+`, giving the `?s=womens+shop` format.
        if (s && s.trim()) params.set('s', s.trim());
        if (category) params.set('category', category);
        if (subcategory) params.set('subcategory', subcategory);
        if (country && country !== 'All') params.set('country', country);
        if (brand) params.set('brand', brand);
        if (flag) params.set('flag', flag);
        router.push(`/products?${params.toString()}`);
        setShowMobileFilter(false);
    };

    // Selecting a category resets any active subcategory
    const handleCategorySelect = (catId: string) => pushFilters({ category: catId, subcategory: '' });
    const handleSubcategorySelect = (catId: string, subId: string) => pushFilters({ category: catId, subcategory: subId });
    const handleCountrySelect = (country: string) => pushFilters({ country });

    const toggleInCsv = (list: string[], value: string) =>
        (list.includes(value) ? list.filter(v => v !== value) : [...list, value]).join(',');
    const handleBrandToggle = (brand: string) => pushFilters({ brand: toggleInCsv(selectedBrands, brand) });
    const handleFlagToggle = (flag: string) => pushFilters({ flag: toggleInCsv(selectedFlags, flag) });

    const handlePriceChange = (v: { min: number; max: number }) => {
        setPrice(v);
        setPage(1);
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedSubcategory('');
        setSelectedCountry('');
        setPrice(null);
        setAppliedPrice(null);
        setShowMobileFilter(false);
        router.push('/products');
    };

    const activeCategoryName = categories.find(c => c._id === selectedCategory)?.name || '';
    const activeSubcategoryName = categories.find(c => c._id === selectedSubcategory)?.name || '';

    // Drives the "Clear All Filters" button — any one of these makes it appear
    const hasFilters = !!(
        selectedCategory
        || selectedSubcategory
        || (selectedCountry && selectedCountry !== 'All')
        || searchParam
        || brandParam
        || flagParam
        || appliedPrice
    );

    const pageTitle = imageActive
        ? 'Image Search Results'
        : searchParam
            ? `Results for "${searchParam}"`
            : activeSubcategoryName || activeCategoryName || 'All Products';

    const filterPanelProps = {
        topCategories,
        childrenOf,
        selectedCategory,
        selectedSubcategory,
        selectedCountry,
        selectedBrands,
        selectedFlags,
        brandFacet,
        flagFacet,
        onCategorySelect: handleCategorySelect,
        onSubcategorySelect: handleSubcategorySelect,
        onCountrySelect: handleCountrySelect,
        onBrandToggle: handleBrandToggle,
        onFlagToggle: handleFlagToggle,
        priceBounds,
        price: price ?? priceBounds,
        setPrice: handlePriceChange,
        hasFilters,
        onClear: clearFilters,
    };

    // GA4: which list this is, for view_item_list / select_item
    const listName = imageActive
        ? 'Image Search Results'
        : searchParam
            ? `Search: ${searchParam}`
            : activeSubcategoryName || activeCategoryName || 'All Products';
    const listId = imageActive
        ? 'image_search'
        : selectedSubcategory || selectedCategory || (searchParam ? 'search' : 'all_products');

    // GA4: view_item_list whenever a new set of products is shown.
    const lastListSig = useRef('');
    useEffect(() => {
        if (isFetching || displayProducts.length === 0) return;
        const sig = `${listId}|${page}|${displayProducts.map((p: any) => p._id).join(',')}`;
        if (sig === lastListSig.current) return;
        lastListSig.current = sig;
        trackViewItemList(
            displayProducts.map((p: any, index: number) =>
                toGaItem(p, { index, item_list_id: listId, item_list_name: listName }),
            ),
            listId,
            listName,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayProducts, isFetching, page]);

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <div className="container mx-auto px-4 py-5">

                {/* Page title + breadcrumb */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-semibold text-[#222831]">{pageTitle}</h1>
                    <nav className="hidden sm:flex items-center gap-2 text-[13px] text-[#222831]">
                        <a href="/" className="hover:text-[var(--filter-accent)]">Home</a>
                        <span className="text-gray-400">›</span>
                        {activeCategoryName && (
                            <>
                                <span
                                    className={activeSubcategoryName ? 'cursor-pointer hover:text-[var(--filter-accent)]' : ''}
                                    onClick={() => activeSubcategoryName && handleCategorySelect(selectedCategory)}
                                >
                                    {activeCategoryName}
                                </span>
                                {activeSubcategoryName && <span className="text-gray-400">›</span>}
                            </>
                        )}
                        <span className="text-gray-500">{activeSubcategoryName || (activeCategoryName ? '' : pageTitle)}</span>
                    </nav>
                </div>

                <div className="flex gap-5 items-start">

                    {/* ── Sidebar Filters (Desktop) ── */}
                    <aside className="hidden lg:block w-[290px] shrink-0 sticky top-24">
                        <FilterPanel {...filterPanelProps} />
                    </aside>

                    {/* ── Main Content ── */}
                    <div className="flex-1 min-w-0">

                        {/* Image search banner */}
                        {imageActive && (
                            <div className="mb-4 flex items-center justify-between gap-3 bg-[var(--filter-accent)]/5 border border-[var(--filter-accent)]/20 rounded px-4 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {imageSearch.previewImage && (
                                        <img src={imageSearch.previewImage} alt="search" className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                                            <FiCamera size={15} className="text-[var(--filter-accent)]" /> Image Search Results
                                        </div>
                                        <p className="text-xs text-gray-500">Found {displayProducts.length} matching products</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => dispatch(clearImageSearch())}
                                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 bg-white border border-gray-200 rounded-full px-3 py-1.5 shrink-0"
                                >
                                    <FiX size={13} /> Clear
                                </button>
                            </div>
                        )}

                        {/* Toolbar — sort on the left, page size on the right */}
                        <div className="bg-white rounded p-3 mb-4 shadow-[0_1px_1px_0_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                    onClick={() => setShowMobileFilter(true)}
                                    className="lg:hidden flex items-center gap-1.5 text-[12px] font-semibold text-[var(--filter-accent)] border border-[var(--filter-accent)] rounded-full px-3 py-2"
                                >
                                    <FiFilter size={13} /> Filters
                                </button>
                                <label className="hidden sm:inline text-[14px] font-semibold text-[#222831] shrink-0">Sort By :</label>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={e => { setSortBy(e.target.value); setPage(1); }}
                                        className="appearance-none text-[12px] text-[#222831] border border-[#e3e3e3] rounded-[3px] py-[9px] pl-[9px] pr-7 bg-white cursor-pointer focus:outline-none focus:border-[var(--filter-accent)]"
                                    >
                                        {SORT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <FiChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="relative shrink-0">
                                <select
                                    value={perPage}
                                    onChange={e => { setPerPage(e.target.value); setPage(1); }}
                                    className="appearance-none text-[12px] text-[var(--filter-accent)] border border-[var(--filter-accent)] rounded-[3px] py-[9px] pl-[9px] pr-7 bg-white cursor-pointer focus:outline-none"
                                >
                                    {PER_PAGE_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <FiChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--filter-accent)] pointer-events-none" />
                            </div>
                        </div>

                        {/* Product Grid */}
                        {(imageActive ? imageSearch.isSearching : (isFetching && products.length === 0)) ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white border border-[#cccccc] rounded p-2 animate-pulse">
                                        <div className="aspect-[183/165] bg-gray-200" />
                                        <div className="pt-3 space-y-2">
                                            <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                                            <div className="h-[34px] bg-gray-100 rounded mt-3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : displayProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                                <p className="text-gray-500 mb-6">Try different keywords or browse categories</p>
                                <button onClick={clearFilters} className="text-sm text-[var(--filter-accent)] hover:underline font-semibold">
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity ${(!imageActive && isFetching) ? 'opacity-60' : 'opacity-100'}`}>
                                {displayProducts.map((product: any, index: number) => (
                                    <ShopProductCard
                                        key={product._id}
                                        product={product}
                                        onSelect={() =>
                                            trackSelectItem(
                                                toGaItem(product, { index, item_list_id: listId, item_list_name: listName }),
                                                listId,
                                                listName,
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!imageActive && totalPage > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-4 py-2 text-sm border border-[#e3e3e3] rounded hover:border-[var(--filter-accent)] disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(totalPage, 5) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-10 h-10 text-sm rounded border transition-colors ${page === pageNum ? 'bg-[var(--filter-accent)] text-white border-[var(--filter-accent)]' : 'border-[#e3e3e3] hover:border-[var(--filter-accent)] bg-white text-[#222831]'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page >= totalPage}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 text-sm border border-[#e3e3e3] rounded hover:border-[var(--filter-accent)] disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile Filter Overlay ── */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-[#f5f5f5] p-3 overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-lg font-bold text-[#222831]">Filters</h3>
                            <button onClick={() => setShowMobileFilter(false)}><FiX size={20} /></button>
                        </div>

                        <FilterPanel {...filterPanelProps} />

                        <button
                            onClick={() => setShowMobileFilter(false)}
                            className="w-full text-[13px] py-2.5 mt-2 bg-[var(--filter-accent)] text-white rounded font-semibold"
                        >
                            Apply &amp; Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
