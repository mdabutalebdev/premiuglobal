"use client";

import React, { useState, useMemo } from 'react';
import {
    FiShoppingCart, FiUsers, FiPackage, FiRefreshCw,
    FiBarChart2, FiStar, FiClock, FiDollarSign,
    FiCheckCircle, FiTruck, FiAlertCircle, FiDownload, FiCalendar,
    FiTrendingUp, FiGrid, FiXCircle,
} from 'react-icons/fi';
import {
    useGetDashboardSummaryQuery,
    useGetSalesByCategoryQuery,
    useGetTopProductsQuery,
    useGetMonthlyRevenueQuery,
    useGetRevenueStatsQuery,
} from '@/redux/api/dashboardApi';
import { useGetOrderStatsQuery, useGetAdminOrdersQuery } from '@/redux/api/orderApi';
import { AreaChart, BarChart, DonutChart } from '@/components/admin/charts/Charts';

/* ── Shared card styling, matching the dashboard ── */
const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #eef0f2',
    borderRadius: '16px',
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
};
const cardPad: React.CSSProperties = { ...card, padding: '20px' };
const titleStyle: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: '#101828', margin: 0 };
const subStyle: React.CSSProperties = { fontSize: '12px', color: '#98a2b3', margin: '2px 0 0' };
const inputStyle: React.CSSProperties = {
    border: '1px solid #d0d5dd', borderRadius: '9px', padding: '8px 11px',
    fontSize: '13px', color: '#344054', outline: 'none', background: '#fff',
};

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16'];

const STATUS = [
    { key: 'pending', label: 'Pending', color: '#F59E0B', icon: FiClock },
    { key: 'confirmed', label: 'Confirmed', color: '#3B82F6', icon: FiCheckCircle },
    { key: 'processing', label: 'Processing', color: '#8B5CF6', icon: FiPackage },
    { key: 'shipped', label: 'Shipped', color: '#6366F1', icon: FiTruck },
    { key: 'delivered', label: 'Delivered', color: '#10B981', icon: FiCheckCircle },
    { key: 'cancelled', label: 'Cancelled', color: '#EF4444', icon: FiXCircle },
];

const statusTint = (color: string) => `${color}14`;

/* ── CSV export (Excel opens it directly) ── */
function exportToExcel(data: any[], fileName: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                let val = row[h] ?? '';
                if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',')
        ),
    ];
    const csvString = '﻿' + csvRows.join('\n'); // BOM so Excel reads UTF-8
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function ReportAnalysisPage() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products'>('overview');

    const { data: summaryData, isLoading, refetch } = useGetDashboardSummaryQuery(undefined);
    const { data: categoryData } = useGetSalesByCategoryQuery(undefined);
    const { data: topProductsData } = useGetTopProductsQuery(20);
    const { data: monthlyData } = useGetMonthlyRevenueQuery(undefined);
    const { data: dailyData } = useGetRevenueStatsQuery({ startDate: dateFrom || undefined, endDate: dateTo || undefined });
    const { data: orderStatsData } = useGetOrderStatsQuery(undefined);
    const { data: allOrdersData } = useGetAdminOrdersQuery({ limit: 200 });

    const stats = summaryData?.data || {};
    const salesByCategory = categoryData?.data || [];
    const topProducts = topProductsData?.data || [];
    const monthly = monthlyData?.data || [];
    const daily = dailyData?.data || [];
    const allOrders = allOrdersData?.data?.orders || allOrdersData?.data || [];
    const orderStats = orderStatsData?.data || {};

    const money = (n: number) => `৳${(n || 0).toLocaleString()}`;
    const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    /* Orders filtered by the date range */
    const filteredOrders = useMemo(() => {
        if (!Array.isArray(allOrders)) return [];
        return allOrders.filter((order: any) => {
            if (!order.createdAt) return true;
            const d = new Date(order.createdAt);
            if (dateFrom && d < new Date(dateFrom)) return false;
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                if (d > to) return false;
            }
            return true;
        });
    }, [allOrders, dateFrom, dateTo]);

    const rangeRevenue = filteredOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalOrdersCount = STATUS.reduce((s, x) => s + (orderStats[x.key] || 0), 0);
    const avgOrderValue = filteredOrders.length ? rangeRevenue / filteredOrders.length : 0;

    /* ── Exports ── */
    const exportOrders = () => exportToExcel(filteredOrders.map((o: any) => ({
        OrderNo: o.orderNumber || '',
        Customer: o.user?.firstName ? `${o.user.firstName} ${o.user.lastName || ''}` : o.guestInfo?.name || 'Guest',
        Email: o.user?.email || o.shippingAddress?.email || '',
        Phone: o.shippingAddress?.phone || o.guestInfo?.phone || '',
        Status: o.status || '',
        Total: o.total || 0,
        Payment: o.paymentMethod || '',
        Address: o.shippingAddress?.address || '',
        Date: o.createdAt ? formatDate(o.createdAt) : '',
    })), 'orders_report');

    const exportProducts = () => exportToExcel(topProducts.map((p: any, i: number) => ({
        Rank: i + 1,
        Name: p.name || '',
        Price: p.price || 0,
        TotalSold: p.totalSold || 0,
        Stock: p.stock || 0,
        Rating: p.averageRating?.toFixed(1) || '0',
    })), 'products_report');

    const exportSummary = () => exportToExcel([
        { Metric: 'Total Revenue', Value: stats.totalRevenue || 0 },
        { Metric: 'Total Orders', Value: stats.totalOrders || 0 },
        { Metric: 'Total Customers', Value: stats.totalCustomers || 0 },
        { Metric: 'Total Products', Value: stats.totalProducts || 0 },
        { Metric: 'Today Orders', Value: stats.todayOrders || 0 },
        { Metric: 'Today Revenue', Value: stats.todayRevenue || 0 },
        { Metric: 'Pending Orders', Value: stats.pendingOrders || 0 },
        { Metric: 'Delivered Orders', Value: stats.deliveredOrders || 0 },
        { Metric: 'Total Categories', Value: stats.totalCategories || 0 },
        ...Object.entries(orderStats).map(([k, v]) => ({ Metric: `Orders - ${k}`, Value: v as number })),
    ], 'summary_report');

    /* ── Chart data ── */
    const monthlyPoints = monthly.map((m: any) => ({ label: m.month, value: m.revenue || 0, extra: m.orders || 0 }));
    const dailyPoints = daily.slice(-30).map((d: any) => ({
        label: (d._id || '').slice(5), // MM-DD
        value: d.revenue || 0,
        extra: d.orders || 0,
    }));
    const categoryPoints = salesByCategory.slice(0, 8).map((c: any) => ({
        label: c.name || c._id || 'Other',
        value: c.totalSales || c.count || 0,
    }));

    const kpis = [
        { label: 'Total Revenue', value: money(stats.totalRevenue || 0), sub: `${money(stats.todayRevenue || 0)} today`, icon: FiDollarSign, color: '#059669' },
        { label: 'Total Orders', value: (stats.totalOrders || 0).toLocaleString(), sub: `${stats.todayOrders || 0} today`, icon: FiShoppingCart, color: '#2563EB' },
        { label: 'Customers', value: (stats.totalCustomers || 0).toLocaleString(), sub: 'Registered accounts', icon: FiUsers, color: '#7C3AED' },
        { label: 'Products', value: (stats.totalProducts || 0).toLocaleString(), sub: `${stats.totalCategories || 0} categories`, icon: FiPackage, color: '#D97706' },
    ];

    const tabs = [
        { key: 'overview', label: 'Overview', icon: FiBarChart2 },
        { key: 'orders', label: 'Orders Report', icon: FiShoppingCart },
        { key: 'products', label: 'Products Report', icon: FiPackage },
    ] as const;

    const thStyle: React.CSSProperties = {
        fontSize: '11px', fontWeight: 700, color: '#667085', textTransform: 'uppercase',
        letterSpacing: '0.4px', padding: '11px 18px', whiteSpace: 'nowrap',
    };
    const tdStyle: React.CSSProperties = { padding: '13px 18px', fontSize: '13px', color: '#475467' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#101828', margin: 0, letterSpacing: '-0.4px' }}>
                        Report &amp; Analysis
                    </h1>
                    <p style={{ fontSize: '13px', color: '#667085', margin: '4px 0 0' }}>
                        Filter, analyse and download your store reports
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
                        background: '#fff', border: '1px solid #e4e7ec', borderRadius: '10px',
                        fontSize: '13px', fontWeight: 600, color: '#344054', cursor: 'pointer',
                    }}
                >
                    <FiRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Date filter + exports */}
            <div style={{ ...cardPad, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 600, color: '#344054' }}>
                    <FiCalendar size={15} color="#98a2b3" /> Date range
                </span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                <span style={{ color: '#d0d5dd' }}>—</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
                {(dateFrom || dateTo) && (
                    <button
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#f04438' }}
                    >
                        Clear
                    </button>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Summary', onClick: exportSummary, color: '#059669' },
                        { label: 'Orders', onClick: exportOrders, color: '#2563EB' },
                        { label: 'Products', onClick: exportProducts, color: '#7C3AED' },
                    ].map(b => (
                        <button key={b.label} onClick={b.onClick}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '9px', border: `1px solid ${b.color}33`,
                                background: statusTint(b.color), color: b.color,
                                fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            <FiDownload size={13} /> {b.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: '16px' }}>
                {kpis.map((k, i) => (
                    <div key={i} style={{ ...cardPad, display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <span style={{
                            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                            background: statusTint(k.color), display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <k.icon size={20} color={k.color} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: '#101828', lineHeight: 1.15, letterSpacing: '-0.4px' }}>
                                {k.value}
                            </span>
                            <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475467', marginTop: '4px' }}>
                                {k.label}
                            </span>
                            <span style={{ display: 'block', fontSize: '11.5px', color: '#98a2b3', marginTop: '2px' }}>
                                {k.sub}
                            </span>
                        </span>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: '#f2f4f7', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '9px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600,
                            background: activeTab === tab.key ? '#fff' : 'transparent',
                            color: activeTab === tab.key ? '#101828' : '#667085',
                            boxShadow: activeTab === tab.key ? '0 1px 3px rgba(16,24,40,0.08)' : 'none',
                        }}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══ OVERVIEW ═══ */}
            {activeTab === 'overview' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px' }}>
                        <div style={cardPad}>
                            <h3 style={titleStyle}>Revenue Trend</h3>
                            <p style={{ ...subStyle, marginBottom: '14px' }}>Paid orders, by month</p>
                            {monthlyPoints.length > 0 ? (
                                <AreaChart data={monthlyPoints} color="#10B981" height={260} formatValue={(n) => `৳${compact(n)}`} />
                            ) : (
                                <Empty icon={<FiTrendingUp size={26} color="#d0d5dd" />} text="No paid orders yet" height={260} />
                            )}
                        </div>

                        <div style={cardPad}>
                            <h3 style={titleStyle}>Order Status</h3>
                            <p style={{ ...subStyle, marginBottom: '18px' }}>Share of every order</p>
                            <DonutChart
                                data={STATUS.map(s => ({ label: s.label, value: orderStats[s.key] || 0, color: s.color }))}
                                centerLabel="Total orders"
                                centerValue={totalOrdersCount}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                        <div style={cardPad}>
                            <h3 style={titleStyle}>Daily Revenue</h3>
                            <p style={{ ...subStyle, marginBottom: '14px' }}>
                                {dateFrom || dateTo ? 'Within the selected range' : 'Last 30 days with sales'}
                            </p>
                            {dailyPoints.length > 0 ? (
                                <AreaChart data={dailyPoints} color="#3B82F6" height={240} formatValue={(n) => `৳${compact(n)}`} />
                            ) : (
                                <Empty icon={<FiTrendingUp size={26} color="#d0d5dd" />} text="No revenue in this range" height={240} />
                            )}
                        </div>

                        <div style={cardPad}>
                            <h3 style={titleStyle}>Sales by Category</h3>
                            <p style={{ ...subStyle, marginBottom: '14px' }}>Revenue per category</p>
                            {categoryPoints.length > 0 ? (
                                <BarChart data={categoryPoints} colors={CHART_COLORS} height={240} formatValue={(n) => `৳${compact(n)}`} />
                            ) : (
                                <Empty icon={<FiGrid size={26} color="#d0d5dd" />} text="No category sales yet" height={240} />
                            )}
                        </div>
                    </div>

                    {/* Pipeline tiles */}
                    <div style={cardPad}>
                        <h3 style={{ ...titleStyle, marginBottom: '14px' }}>Order Pipeline</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                            {STATUS.map(s => (
                                <div key={s.key} style={{
                                    borderRadius: '13px', padding: '16px',
                                    background: statusTint(s.color), border: `1px solid ${s.color}22`,
                                }}>
                                    <s.icon size={18} color={s.color} />
                                    <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, margin: '10px 0 0', lineHeight: 1 }}>
                                        {orderStats[s.key] || 0}
                                    </p>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#475467', margin: '4px 0 0' }}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ═══ ORDERS ═══ */}
            {activeTab === 'orders' && (
                <div style={{ ...card, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid #f2f4f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={titleStyle}>Orders Report</h3>
                            <p style={subStyle}>
                                {filteredOrders.length} records · {money(rangeRevenue)} total · {money(Math.round(avgOrderValue))} average
                            </p>
                        </div>
                        <button onClick={exportOrders}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 15px',
                                borderRadius: '9px', border: 'none', cursor: 'pointer',
                                background: 'var(--color-primary)', color: 'var(--color-primary-foreground)',
                                fontSize: '12.5px', fontWeight: 600,
                            }}
                        >
                            <FiDownload size={13} /> Download Excel
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafbfc' }}>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Order #</th>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Customer</th>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Phone</th>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Status</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? filteredOrders.slice(0, 100).map((order: any, i: number) => {
                                    const s = STATUS.find(x => x.key === order.status) || STATUS[0];
                                    return (
                                        <tr key={i} style={{ borderTop: '1px solid #f2f4f7' }}>
                                            <td style={{ ...tdStyle, fontWeight: 600, color: '#101828' }}>{order.orderNumber}</td>
                                            <td style={tdStyle}>
                                                {order.user?.firstName ? `${order.user.firstName} ${order.user.lastName || ''}` : order.guestInfo?.name || 'Guest'}
                                            </td>
                                            <td style={{ ...tdStyle, color: '#667085' }}>{order.shippingAddress?.phone || order.guestInfo?.phone || '—'}</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
                                                    color: s.color, background: statusTint(s.color),
                                                    padding: '3px 10px', borderRadius: '999px',
                                                }}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#101828' }}>{money(order.total)}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right', color: '#98a2b3', fontSize: '12px' }}>
                                                {order.createdAt ? formatDate(order.createdAt) : '—'}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={6}><Empty icon={<FiShoppingCart size={26} color="#d0d5dd" />} text="No orders in this date range" height={200} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ PRODUCTS ═══ */}
            {activeTab === 'products' && (
                <div style={{ ...card, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid #f2f4f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={titleStyle}>Products Report</h3>
                            <p style={subStyle}>{topProducts.length} products, ranked by units sold</p>
                        </div>
                        <button onClick={exportProducts}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 15px',
                                borderRadius: '9px', border: 'none', cursor: 'pointer',
                                background: 'var(--color-primary)', color: 'var(--color-primary-foreground)',
                                fontSize: '12.5px', fontWeight: 600,
                            }}
                        >
                            <FiDownload size={13} /> Download Excel
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafbfc' }}>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>#</th>
                                    <th style={{ ...thStyle, textAlign: 'left' }}>Product</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Sold</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Stock</th>
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.length > 0 ? topProducts.map((product: any, i: number) => {
                                    const stock = product.stock || 0;
                                    return (
                                        <tr key={i} style={{ borderTop: '1px solid #f2f4f7' }}>
                                            <td style={{ ...tdStyle, color: '#98a2b3', fontWeight: 700 }}>{i + 1}</td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '9px', overflow: 'hidden',
                                                        background: '#f6f6f6', border: '1px solid #eee', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        {product.thumbnail
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            ? <img src={product.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            : <FiPackage size={14} color="#ccc" />}
                                                    </div>
                                                    <span style={{
                                                        fontWeight: 600, color: '#101828',
                                                        maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    }}>
                                                        {product.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#101828' }}>{money(product.price)}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>{product.totalSold || 0}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                <span style={{
                                                    fontSize: '11.5px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                                                    color: stock > 5 ? '#047857' : stock > 0 ? '#B45309' : '#B91C1C',
                                                    background: stock > 5 ? '#ECFDF5' : stock > 0 ? '#FFFBEB' : '#FEF2F2',
                                                }}>
                                                    {stock}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                {product.averageRating > 0 ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 600 }}>
                                                        <FiStar size={12} /> {product.averageRating.toFixed(1)}
                                                    </span>
                                                ) : <span style={{ color: '#d0d5dd' }}>—</span>}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={6}><Empty icon={<FiAlertCircle size={26} color="#d0d5dd" />} text="No products yet" height={200} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Empty({ icon, text, height }: { icon: React.ReactNode; text: string; height: number }) {
    return (
        <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {icon}
            <p style={{ fontSize: '12.5px', color: '#98a2b3', margin: 0 }}>{text}</p>
        </div>
    );
}
