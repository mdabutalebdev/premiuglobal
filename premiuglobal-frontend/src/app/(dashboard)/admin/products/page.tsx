"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiMoreVertical } from 'react-icons/fi';

// Demo products
const productsData = [
    { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 2499, mrp: 3999, stock: 45, status: 'Active', image: '🎧' },
    { id: 2, name: 'Smart Watch Pro', category: 'Electronics', price: 4999, mrp: 7999, stock: 32, status: 'Active', image: '⌚' },
    { id: 3, name: 'Premium T-Shirt', category: 'Fashion', price: 799, mrp: 1299, stock: 120, status: 'Active', image: '👕' },
    { id: 4, name: 'Running Shoes', category: 'Sports', price: 3499, mrp: 5999, stock: 67, status: 'Active', image: '👟' },
    { id: 5, name: 'Laptop Bag', category: 'Accessories', price: 1499, mrp: 2499, stock: 89, status: 'Active', image: '💼' },
    { id: 6, name: 'Sunglasses', category: 'Fashion', price: 999, mrp: 1999, stock: 0, status: 'Out of Stock', image: '🕶️' },
    { id: 7, name: 'Bluetooth Speaker', category: 'Electronics', price: 1999, mrp: 3499, stock: 23, status: 'Active', image: '🔊' },
    { id: 8, name: 'Fitness Band', category: 'Sports', price: 1299, mrp: 2299, stock: 56, status: 'Active', image: '📿' },
];

export default function ProductsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredProducts = productsData.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                    <p className="text-gray-500">Manage your product inventory</p>
                </div>
                <Link href="/dashboard/admin/products/new" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg font-medium hover:opacity-90" style={{ textDecoration: 'none' }}>
                    <FiPlus size={20} />
                    Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border rounded-lg bg-white"
                        >
                            <option value="All">All Categories</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Sports">Sports</option>
                            <option value="Accessories">Accessories</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                            <FiFilter size={18} />
                            Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Stock</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                                                {product.image}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{product.name}</p>
                                                <p className="text-sm text-gray-500">#{product.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-800">৳{product.price}</p>
                                        <p className="text-sm text-gray-400 line-through">৳{product.mrp}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-medium ${product.stock > 0 ? 'text-gray-800' : 'text-red-600'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'Active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
                                                <FiEye size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600">
                                                <FiEdit2 size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600">
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center p-4 border-t">
                    <p className="text-sm text-gray-500">Showing 1-{filteredProducts.length} of {productsData.length} products</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg">1</button>
                        <button className="px-3 py-1 border rounded-lg hover:bg-gray-50">2</button>
                        <button className="px-3 py-1 border rounded-lg hover:bg-gray-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
