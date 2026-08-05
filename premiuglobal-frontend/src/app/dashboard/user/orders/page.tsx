"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    FiPackage,
    FiSearch,
    FiChevronRight,
    FiClock,
    FiCheckCircle,
    FiTruck,
    FiXCircle,
    FiShoppingBag,
    FiFilter,
} from 'react-icons/fi';
import { useGetMyOrdersQuery } from '@/redux/api/orderApi';

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: FiClock },
    confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', icon: FiCheckCircle },
    processing: { bg: 'bg-purple-50', text: 'text-purple-700', icon: FiPackage },
    shipped: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: FiTruck },
    delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: FiCheckCircle },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: FiXCircle },
    returned: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FiPackage },
};

const StatusBadge = ({ status }: { status: string }) => {
    const { bg, text, icon: Icon } = statusConfig[status] || statusConfig.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${bg} ${text}`}>
            <Icon size={12} />
            {status}
        </span>
    );
};

const paymentLabel = (method: string) =>
    ({ bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', cod: 'COD' }[method] || (method || 'COD').toUpperCase());

export default function MyOrdersPage() {
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useGetMyOrdersQuery({
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
    });

    const orders = data?.data || [];
    const meta = data?.meta || { total: 0, totalPages: 1 };

    const statusTabs = [
        { id: 'all', label: 'All Orders' },
        { id: 'pending', label: 'Pending' },
        { id: 'processing', label: 'Processing' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'delivered', label: 'Delivered' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                        <p className="text-sm text-gray-400 mt-1">Track and manage your orders</p>
                    </div>
                    <Link
                        href="/"
                        className="px-5 py-2.5 bg-[var(--filter-accent)] text-white rounded-xl font-semibold text-sm hover:brightness-95 transition-all shadow-md shadow-[var(--filter-accent)]/25 flex items-center gap-2"
                    >
                        <FiShoppingBag size={16} />
                        Continue Shopping
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-gray-50 scrollbar-hide">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-[var(--filter-accent)] text-white shadow-md shadow-[var(--filter-accent)]/25'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search by order number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[var(--filter-accent)] focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-5 bg-gray-200 rounded w-32"></div>
                                <div className="h-6 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="h-4 bg-gray-100 rounded w-48 mb-2"></div>
                            <div className="h-4 bg-gray-100 rounded w-36"></div>
                        </div>
                    ))
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
                        <FiPackage size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600 mb-1">No orders found</h3>
                        <p className="text-sm text-gray-400">
                            {statusFilter !== 'all' ? 'Try changing the filter' : 'Start shopping to see your orders here'}
                        </p>
                    </div>
                ) : (
                    orders.map((order: any) => (
                        <Link
                            key={order._id}
                            href={`/dashboard/user/orders/${order._id}`}
                            className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group"
                        >
                            <div className="p-5">
                                {/* Top Row */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">
                                            {order.orderId || order.orderNumber || `Order #${order._id?.slice(-8).toUpperCase()}`}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>

                                {/* Items Preview */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex -space-x-2">
                                        {order.items?.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="w-10 h-10 rounded-lg bg-gray-50 border-2 border-white overflow-hidden shadow-sm">
                                                {item.thumbnail || item.image ? (
                                                    <img src={item.thumbnail || item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <FiPackage size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.items?.length > 3 && (
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm">
                                                +{order.items.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Bottom Row */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-500 font-bold tracking-wide">
                                            {paymentLabel(order.paymentMethod)}
                                        </span>
                                        <span className={`text-xs font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {order.paymentStatus || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-bold text-[var(--color-text-primary)]">৳{order.total?.toLocaleString()}</p>
                                        <FiChevronRight size={16} className="text-gray-300 group-hover:text-[var(--color-text-primary)] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-bold text-gray-500">
                        Page {page} of {meta.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
