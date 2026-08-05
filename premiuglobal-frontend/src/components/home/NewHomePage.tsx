"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ShopProductCard from '@/components/shared/ShopProductCard';
import ShopSectionHeader from '@/components/shared/ShopSectionHeader';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useAppSelector, useAppDispatch } from '@/redux';
import { clearImageSearch, loadSearchHistoryFromStorage } from '@/redux/slices/imageSearchSlice';
import { FiX, FiCamera } from 'react-icons/fi';
import { FiSearch } from 'react-icons/fi';
import HeroSection from './HeroSection';
import FeaturedCategories from './FeaturedCategories';
import TopSellingProducts from './TopSellingProducts';
import HomeSections from './HomeSections';
import FlagSections from './FlagSections';
import CustomerReviews from './CustomerReviews';

const LIMIT = 20;

const NewHomePage: React.FC = () => {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();

    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('searchTerm') || '');
    const [page, setPage] = useState(1);
    const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);
    // How many cards the "Just For You" feed reveals. Grows 10 at a time via the
    // See More button; resets whenever the feed's contents change.
    const [visibleCount, setVisibleCount] = useState(10);

    // Image search state from Redux
    const imageSearch = useAppSelector((state) => state.imageSearch);

    // Load search history from localStorage on mount
    useEffect(() => {
        dispatch(loadSearchHistoryFromStorage());
    }, [dispatch]);

    useEffect(() => {
        const cat = searchParams.get('category') || '';
        const search = searchParams.get('searchTerm') || '';
        setSelectedCategory(cat);
        setSearchTerm(search);
        setPage(1);
        setAccumulatedProducts([]);
        setVisibleCount(10);
    }, [searchParams]);

    const queryParams: Record<string, string | number | undefined> = {
        limit: LIMIT,
        page,
        sort: '-createdAt',
    };
    if (selectedCategory) queryParams.category = selectedCategory;
    if (searchTerm) queryParams.searchTerm = searchTerm;

    const { data: productsData, isLoading, isFetching } = useGetProductsQuery(queryParams);
    const { data: categoriesData } = useGetCategoriesQuery({});

    const products = productsData?.data || [];
    const meta = productsData?.meta;
    const categories = categoriesData?.data || [];

    // Accumulate products when new data arrives
    useEffect(() => {
        if (products.length > 0 && !isFetching) {
            if (page === 1) {
                setAccumulatedProducts(products);
            } else {
                setAccumulatedProducts(prev => {
                    const existingIds = new Set(prev.map((p: any) => p._id));
                    const newProducts = products.filter((p: any) => !existingIds.has(p._id));
                    return [...prev, ...newProducts];
                });
            }
        }
    }, [products, isFetching, page]);

    // ── Handle clearing image search — reset to normal product listing ──
    const handleClearImageSearch = () => {
        dispatch(clearImageSearch());
        setPage(1);
        if (products.length > 0) {
            setAccumulatedProducts(products);
        } else {
            setAccumulatedProducts([]);
        }
    };

    // ── Handle clearing text search ─────────────────────────────────
    const handleClearTextSearch = () => {
        setSearchTerm('');
        setPage(1);
        setAccumulatedProducts([]);
        setVisibleCount(10);
        window.history.pushState({}, '', '/');
    };

    // ── "See More" on the Just For You feed: reveal 10 more, and pull the next
    //    page from the server once we're about to run past what's loaded. ──
    const handleSeeMore = () => {
        const next = visibleCount + 10;
        setVisibleCount(next);
        const loaded = accumulatedProducts.length || products.length;
        const total = meta?.total ?? loaded;
        if (next >= loaded && loaded < total && !isFetching) {
            setPage((p) => p + 1);
        }
    };

    // ── Handle category change ──────────────────────────────────────
    const handleCategoryChange = (categoryId: string) => {
        dispatch(clearImageSearch());
        // If same category (e.g. clicking "View All" when already on all), restore from cache
        if (categoryId === selectedCategory) {
            if (products.length > 0) {
                setAccumulatedProducts(products);
            }
            return;
        }
        const params = new URLSearchParams();
        if (categoryId) params.set('category', categoryId);
        window.history.pushState({}, '', `/?${params.toString()}`);
        setSelectedCategory(categoryId);
        setPage(1);
        setAccumulatedProducts([]);
        setVisibleCount(10);
    };

    // ── Personalized sorting: boost products matching search history ──
    const sortByRelevance = (products: any[]) => {
        const history = imageSearch.lastSearchHistory;
        if (!history || (history.labels.length === 0 && history.colors.length === 0)) {
            return products;
        }

        return [...products].sort((a, b) => {
            const scoreA = getRelevanceScore(a, history);
            const scoreB = getRelevanceScore(b, history);
            // Higher relevance first, then keep original order
            return scoreB - scoreA;
        });
    };

    // Calculate how relevant a product is to the search history
    const getRelevanceScore = (product: any, history: { labels: string[]; colors: string[]; category: string | null; brand: string | null }) => {
        let score = 0;
        const productTags = (product.tags || []).map((t: string) => t.toLowerCase());
        const productColors = (product.colors || []).map((c: string) => c.toLowerCase());
        const productAiLabels = (product.aiLabels || []).map((l: string) => l.toLowerCase());
        const productName = (product.name || '').toLowerCase();
        const productBrand = (product.brand || '').toLowerCase();
        const productCategoryName = (product.category?.name || '').toLowerCase();

        // Match labels against tags & aiLabels
        for (const label of history.labels) {
            const lowerLabel = label.toLowerCase();
            if (productTags.some((t: string) => t.includes(lowerLabel) || lowerLabel.includes(t))) score += 10;
            if (productAiLabels.some((l: string) => l.includes(lowerLabel) || lowerLabel.includes(l))) score += 8;
            if (productName.includes(lowerLabel)) score += 5;
        }

        // Match colors
        for (const color of history.colors) {
            const lowerColor = color.toLowerCase();
            if (productColors.some((c: string) => c.includes(lowerColor) || lowerColor.includes(c))) score += 7;
        }

        // Match category
        if (history.category && productCategoryName.includes(history.category.toLowerCase())) {
            score += 15;
        }

        // Match brand
        if (history.brand && productBrand.includes(history.brand.toLowerCase())) {
            score += 12;
        }

        return score;
    };

    // ── Determine which products to display ─────────────────────────
    const displayProducts = useMemo(() => {
        if (imageSearch.isActive && imageSearch.products.length > 0) {
            return imageSearch.products;
        }
        // Use accumulated products, or fall back to current API products if accumulated is empty
        const productsToShow = accumulatedProducts.length > 0 ? accumulatedProducts : products;
        // Apply silent personalized sorting based on search history
        return sortByRelevance(productsToShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSearch.isActive, imageSearch.products, accumulatedProducts, products, imageSearch.lastSearchHistory]);

    // Get the selected category name
    const selectedCategoryName = useMemo(() => {
        if (!selectedCategory) return '';
        const cat = categories.find((c: any) => c._id === selectedCategory);
        return cat?.name || '';
    }, [selectedCategory, categories]);

    // No full-page loading skeleton: it replaced the hero, categories and
    // sliders with a grey grid on every visit. Each section shows its own
    // placeholder instead, so the page frame is there from the first paint.
    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Hero Banner */}
            <HeroSection />

            {/* Featured Categories — driven by Admin → Categories */}
            <FeaturedCategories />

            {/* Top Selling — products flagged "Best Selling", ranked by totalSold */}
            <TopSellingProducts />

            {/* Automatic flag sliders: New Arrivals, Featured, On Sale, Combo Deals.
                Driven purely by the flags set on each product; each hides when empty. */}
            <FlagSections />

            {/* Product sliders — added, titled and ordered in Admin → Site Content */}
            <HomeSections />

            {/* Search / category context — only takes up space when one is active,
                otherwise it left an empty padded band between the sliders and the feed. */}
            {(imageSearch.isActive || imageSearch.isSearching || searchTerm || selectedCategory) && (
            <div className="container mx-auto px-2 py-6">

                {/* ── Image Search Results Banner ── */}
                {imageSearch.isActive && (
                    <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-fadeIn">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                {imageSearch.previewImage && (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[var(--color-primary)]/20 shadow-sm flex-shrink-0">
                                        <img src={imageSearch.previewImage} alt="Search" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiCamera className="text-[var(--color-text-primary)]" size={16} />
                                        <h3 className="text-lg font-bold text-gray-800">Image Search Results</h3>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Found <span className="font-bold text-[var(--color-text-primary)]">{imageSearch.products.length}</span> matching products
                                        {(imageSearch.searchMeta?.labels?.length ?? 0) > 0 && (
                                            <span> — detected: <span className="font-medium">{imageSearch.searchMeta!.labels.slice(0, 5).join(', ')}</span></span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClearImageSearch}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full text-sm font-semibold transition-colors"
                            >
                                <FiX size={14} />
                                Clear
                            </button>
                        </div>

                        {/* Color chips */}
                        {(imageSearch.searchMeta?.colors?.length ?? 0) > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Colors:</span>
                                {imageSearch.searchMeta!.colors.map((color: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                                        <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />
                                        <span className="text-xs text-gray-600 font-medium capitalize">{color.name}</span>
                                        <span className="text-[10px] text-gray-400">{color.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Image Search Loading State ── */}
                {imageSearch.isSearching && (
                    <div className="mb-6 bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm animate-fadeIn">
                        <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Analyzing your image...</h3>
                        <p className="text-sm text-gray-500">Using AI to identify products and colors</p>
                    </div>
                )}

                {/* ── Text Search Results Banner ── */}
                {searchTerm && !imageSearch.isActive && (
                    <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-fadeIn">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <FiSearch className="text-[var(--color-text-primary)]" size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        Search results for &quot;<span className="text-[var(--color-text-primary)]">{searchTerm}</span>&quot;
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Found <span className="font-bold text-[var(--color-text-primary)]">{meta?.total || displayProducts.length}</span> products
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClearTextSearch}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full text-sm font-semibold transition-colors"
                            >
                                <FiX size={14} />
                                Clear
                            </button>
                        </div>
                    </div>
                )}
                {/* ── Selected Category Title ── */}
                {selectedCategory && (
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{selectedCategoryName || 'Category'}</h2>
                            <p className="text-sm text-gray-500 mt-1">Showing all products in this category</p>
                        </div>
                        <button
                            onClick={() => handleCategoryChange('')}
                            className="mt-4 text-[var(--color-text-primary)] hover:underline"
                        >
                            View all products
                        </button>
                    </div>
                )}

            </div>
            )}

            <div className="container mx-auto px-2 pt-0 pb-6">
                {/* ── Just For You Section ── */}
                <ShopSectionHeader title="Just For You" href="/products" />

                <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[21px] transition-opacity duration-200 ${(isFetching && page === 1) ? 'opacity-60' : 'opacity-100'}`}>
                    {displayProducts.slice(0, visibleCount).map((product: any) => (
                        <ShopProductCard key={`jfy-${product._id}`} product={product} />
                    ))}
                </div>

                {/* See More — reveals 10 more each click, fetching from the server
                    as needed. Hidden once every product is on screen. */}
                {(() => {
                    const loaded = accumulatedProducts.length || products.length;
                    const total = meta?.total ?? loaded;
                    const hasMore = visibleCount < displayProducts.length || loaded < total;
                    if (!hasMore || displayProducts.length === 0) return null;
                    return (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={handleSeeMore}
                                disabled={isFetching}
                                className="px-10 py-2.5 rounded-full border font-semibold text-[14px] uppercase tracking-[0.5px] transition-colors disabled:opacity-60"
                                style={{ borderColor: 'var(--filter-accent)', color: 'var(--filter-accent)' }}
                            >
                                {isFetching ? 'Loading…' : 'See More'}
                            </button>
                        </div>
                    );
                })()}

                {/* ── Empty State ── */}
                {!isFetching && displayProducts.length === 0 && !imageSearch.isSearching && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                        <p className="text-gray-500 mb-6">Try browsing another category</p>
                        <button
                            onClick={() => handleCategoryChange('')}
                            className="px-8 py-3 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-full font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                        >
                            View All Products
                        </button>
                    </div>
                )}

            </div>

            {/* Approved customer reviews — last thing before the footer */}
            <CustomerReviews />
        </div>
    );
};

export default NewHomePage;
