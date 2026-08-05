"use client";

import React, { useState } from 'react';
import { FiSearch, FiFilter, FiEye, FiPackage, FiTruck, FiCheck, FiX } from 'react-icons/fi';

// Demo orders
const ordersData = [
    { id: '#ORD-001', customer: 'John Doe', email: 'john@example.com', items: 3, total: '৳8,997', payment: 'Paid', status: 'Delivered', date: '2026-01-15' },
    { id: '#ORD-002', customer: 'Jane Smith', email: 'jane@example.com', items: 2, total: '৳6,498', payment: 'Paid', status: 'Processing', date: '2026-01-15' },
    { id: '#ORD-003', customer: 'Mike Johnson', email: 'mike@example.com', items: 1, total: '৳1,499', payment: 'Pending', status: 'Pending', date: '2026-01-14' },
    { id: '#ORD-004', customer: 'Sarah Wilson', email: 'sarah@example.com', items: 4, total: '৳12,496', payment: 'Paid', status: 'Shipped', date: '2026-01-14' },
    { id: '#ORD-005', customer: 'Tom Brown', email: 'tom@example.com', items: 2, total: '৳4,498', payment: 'Refunded', status: 'Cancelled', date: '2026-01-13' },
    { id: '#ORD-006', customer: 'Emily Davis', email: 'emily@example.com', items: 5, total: '৳15,995', payment: 'Paid', status: 'Delivered', date: '2026-01-12' },
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-700';
        case 'Processing': return 'bg-blue-100 text-blue-700';
        case 'Shipped': return 'bg-purple-100 text-purple-700';
        case 'Pending': return 'bg-yellow-100 text-yellow-700';
        case 'Cancelled': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const getPaymentColor = (payment: string) => {
    switch (payment) {
        case 'Paid': return 'text-green-600';
        case 'Pending': return 'text-yellow-600';
        case 'Refunded': return 'text-red-600';
        default: return 'text-gray-600';
    }
};

export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const filteredOrders = ordersData.filter(order => {
        const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = selectedStatus === 'All' || order.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = [
        { label: 'Total Orders', value: ordersData.length, icon: FiPackage, color: 'var(--color-primary)' },
        { label: 'Pending', value: ordersData.filter(o => o.status === 'Pending').length, icon: FiX, color: '#F59E0B' },
        { label: 'Shipped', value: ordersData.filter(o => o.status === 'Shipped').length, icon: FiTruck, color: '#A855F7' },
        { label: 'Delivered', value: ordersData.filter(o => o.status === 'Delivered').length, icon: FiCheck, color: '#22C55E' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
                <p className="text-gray-500">Manage and track customer orders</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${stat.color}20` }}
                            >
                                <stat.icon size={20} style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2 border rounded-lg bg-white"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            className="px-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Items</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Payment</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-[var(--color-text-primary)]">{order.id}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-800">{order.customer}</p>
                                        <p className="text-sm text-gray-500">{order.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{order.items} items</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{order.total}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-medium ${getPaymentColor(order.payment)}`}>
                                            {order.payment}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-[var(--color-text-primary)]">
                                                <FiEye size={18} />
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
                    <p className="text-sm text-gray-500">Showing 1-{filteredOrders.length} of {ordersData.length} orders</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg">1</button>
                        <button className="px-3 py-1 border rounded-lg hover:bg-gray-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
