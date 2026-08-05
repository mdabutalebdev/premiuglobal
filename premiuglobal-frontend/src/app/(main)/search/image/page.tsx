"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiSearch, FiTag, FiDroplet } from 'react-icons/fi';

interface Product {
    _id: string;
    slug: string;
    name: string;
    price: number;
    discount: number;
    thumbnail: string;
    images: string[];
    rating: number;
    reviewCount: number;
    brand: string;
    searchScore?: number;
    category?: { name: string; slug: string };
}

interface SearchMeta {
    labels: string[];
    colors: Array<{ hex: string; name: string; percentage: number }>;
    brand: string | null;
    category: string | null;
    totalResults: number;
    matchType: string;
}

export default function ImageSearchPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
    const [searchImage, setSearchImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = sessionStorage.getItem('imageSearchResults');
        const storedImage = sessionStorage.getItem('imageSearchPreview');

        if (stored) {
            try {
                const data = JSON.parse(stored);
                setProducts(data.products || []);
                setSearchMeta(data.searchMeta || null);
            } catch (e) {
                console.error('Failed to parse search results:', e);
            }
        }

        if (storedImage) {
            setSearchImage(storedImage);
        }

        setIsLoading(false);
    }, []);

    const discountedPrice = (price: number, discount: number) => {
        return discount > 0 ? price - (price * discount) / 100 : price;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading search results...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                        <FiArrowLeft size={24} />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FiSearch size={20} />
                            Image Search Results
                        </h1>
                        <p className="text-sm text-gray-500">
                            {products.length} product{products.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Uploaded Image Preview */}
                        {searchImage && (
                            <div className="shrink-0">
                                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Searched Image</p>
                                <img
                                    src={searchImage}
                                    alt="Search"
                                    className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                                />
                            </div>
                        )}

                        {/* Analysis Results */}
                        {searchMeta && (
                            <div className="flex-1 space-y-4">
                                {/* Detected Labels */}
                                {searchMeta.labels.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider flex items-center gap-1">
                                            <FiTag size={12} /> Detected Objects
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {searchMeta.labels.slice(0, 10).map((label, i) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Detected Colors */}
                                {searchMeta.colors.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider flex items-center gap-1">
                                            <FiDroplet size={12} /> Dominant Colors
                                        </p>
                                        <div className="flex gap-3">
                                            {searchMeta.colors.slice(0, 5).map((color, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div
                                                        className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
                                                        style={{ backgroundColor: color.hex }}
                                                    />
                                                    <span className="text-sm text-gray-600 capitalize">{color.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Category & Brand */}
                                <div className="flex gap-4">
                                    {searchMeta.category && (
                                        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                            Category: <strong>{searchMeta.category}</strong>
                                        </div>
                                    )}
                                    {searchMeta.brand && (
                                        <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm">
                                            Brand: <strong className="capitalize">{searchMeta.brand}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Grid */}
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {products.map((product) => (
                            <Link
                                key={product._id}
                                href={`/product/${product.slug || product._id}`}
                                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                            >
                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <img
                                        src={product.thumbnail || product.images?.[0] || '/placeholder.png'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {product.discount > 0 && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                            -{product.discount}%
                                        </div>
                                    )}
                                    {product.searchScore && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            {product.searchScore}% match
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors">
                                        {product.name}
                                    </p>
                                    {product.brand && (
                                        <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
                                    )}
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-lg font-bold text-green-700">
                                            à§³{discountedPrice(product.price, product.discount).toLocaleString()}
                                        </span>
                                        {product.discount > 0 && (
                                            <span className="text-sm text-gray-400 line-through">
                                                à§³{product.price.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    {/* Rating */}
                                    {product.rating > 0 && (
                                        <div className="mt-1 flex items-center gap-1">
                                            <span className="text-yellow-500 text-xs">â˜…</span>
                                            <span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span>
                                            <span className="text-xs text-gray-400">({product.reviewCount})</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">ðŸ”</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No matching products found</h2>
                        <p className="text-gray-500 mb-6">Try uploading a different image or browse our categories</p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium"
                        >
                            <FiArrowLeft size={16} />
                            Back to Home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
