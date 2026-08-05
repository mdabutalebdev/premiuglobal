"use client";

import React from 'react';
import Link from 'next/link';
import {
    FiShoppingBag, FiShoppingCart, FiUsers, FiDollarSign,
    FiArrowRight, FiRefreshCw, FiPackage, FiTrendingUp,
    FiPhone, FiClock, FiPlus, FiGrid,
    FiCheckCircle, FiTruck, FiStar, FiTag, FiLayers, FiAlertTriangle,
} from 'react-icons/fi';
import {
    useGetDashboardSummaryQuery,
    useGetRecentOrdersQuery,
    useGetTopProductsQuery,
    useGetSalesByCategoryQuery,
    useGetMonthlyRevenueQuery,
} from '@/redux/api/dashboardApi';
import { useGetOrderStatsQuery } from '@/redux/api/orderApi';
import { useGetAllReviewsQuery } from '@/redux/api/reviewApi';
import { AreaChart, BarChart, DonutChart } from './charts/Charts';

/* ── Shared styles ───────────────────────────────────────────────── */
const card: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #eef0f2',
    borderRadius: '16px',
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
};
const cardPad: React.CSSProperties = { ...card, padding: '20px' };
const sectionTitle: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: '#101828', margin: 0 };
const viewAll: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)',
    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
};

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16'];

const AdminDashboard: React.FC = () => {
    const { data: summaryData, isLoading, refetch: refetchSummary } = useGetDashboardSummaryQuery(undefined, { pollingInterval: 30000 });
    const { data: ordersData, refetch: refetchOrders } = useGetRecentOrdersQuery(7);
    const { data: productsData } = useGetTopProductsQuery(5);
    const { data: categoryData } = useGetSalesByCategoryQuery(undefined);
    const { data: monthlyData, refetch: refetchMonthly } = useGetMonthlyRevenueQuery(undefined);
    const { data: orderStatsData } = useGetOrderStatsQuery(undefined);
    const { data: reviewsData } = useGetAllReviewsQuery({ limit: 1, status: 'pending' });

    const handleRefresh = () => { refetchSummary(); refetchOrders(); refetchMonthly(); };

    const stats = summaryData?.data || null;
    const recentOrders = ordersData?.data || [];
    const topProducts = productsData?.data || [];
    const salesByCategory = categoryData?.data || [];
    const monthly = monthlyData?.data || [];
    const orderStats = orderStatsData?.data || {};
    const pendingReviews = reviewsData?.meta?.counts?.pending || 0;

    const money = (n: number) => `৳${(n || 0).toLocaleString()}`;
    const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const statusColor = (status: string) => {
        const map: Record<string, { bg: string; text: string }> = {
            pending: { bg: '#FEF3C7', text: '#B45309' },
            confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
            processing: { bg: '#EDE9FE', text: '#6D28D9' },
            shipped: { bg: '#E0E7FF', text: '#4338CA' },
            delivered: { bg: '#D1FAE5', text: '#047857' },
            cancelled: { bg: '#FEE2E2', text: '#B91C1C' },
        };
        return map[status] || { bg: '#F3F4F6', text: '#6B7280' };
    };

    /* ── Card data ── */
    const kpis = [
        {
            label: 'Total Revenue', value: money(stats?.totalRevenue || 0),
            sub: `${money(stats?.todayRevenue || 0)} today`,
            icon: FiDollarSign, from: '#059669', to: '#34D399',
        },
        {
            label: 'Total Orders', value: (stats?.totalOrders || 0).toLocaleString(),
            sub: `${stats?.todayOrders || 0} today · ${orderStats.pending || 0} pending`,
            icon: FiShoppingCart, from: '#2563EB', to: '#60A5FA',
        },
        {
            label: 'Customers', value: (stats?.totalCustomers || 0).toLocaleString(),
            sub: 'Registered accounts',
            icon: FiUsers, from: '#7C3AED', to: '#A78BFA',
        },
        {
            label: 'Products', value: (stats?.totalProducts || 0).toLocaleString(),
            sub: `${stats?.totalCategories || 0} categories`,
            icon: FiShoppingBag, from: '#D97706', to: '#FBBF24',
        },
    ];

    const tiles = [
        { label: "Today's Revenue", value: money(stats?.todayRevenue || 0), icon: FiTrendingUp, color: '#059669', bg: '#ECFDF5', href: '/dashboard/admin/analytics' },
        { label: "Today's Orders", value: stats?.todayOrders || 0, icon: FiPackage, color: '#2563EB', bg: '#EFF6FF', href: '/dashboard/admin/orders' },
        { label: 'Pending Orders', value: orderStats.pending || 0, icon: FiClock, color: '#B45309', bg: '#FFFBEB', href: '/dashboard/admin/orders?status=pending' },
        { label: 'Delivered', value: stats?.deliveredOrders || 0, icon: FiCheckCircle, color: '#047857', bg: '#ECFDF5', href: '/dashboard/admin/orders?status=delivered' },
        { label: 'Categories', value: stats?.totalCategories || 0, icon: FiLayers, color: '#6D28D9', bg: '#F5F3FF', href: '/dashboard/admin/categories' },
        { label: 'Pending Reviews', value: pendingReviews, icon: FiStar, color: '#C2410C', bg: '#FFF7ED', href: '/dashboard/admin/reviews' },
    ];

    const pipeline = [
        { label: 'Pending', value: orderStats.pending || 0, color: '#F59E0B' },
        { label: 'Confirmed', value: orderStats.confirmed || 0, color: '#3B82F6' },
        { label: 'Processing', value: orderStats.processing || 0, color: '#8B5CF6' },
        { label: 'Shipped', value: orderStats.shipped || 0, color: '#6366F1' },
        { label: 'Delivered', value: orderStats.delivered || 0, color: '#10B981' },
        { label: 'Cancelled', value: orderStats.cancelled || 0, color: '#EF4444' },
    ];

    const revenuePoints = monthly.map((m: any) => ({
        label: m.month, value: m.revenue || 0, extra: m.orders || 0,
    }));

    const categoryPoints = salesByCategory.slice(0, 8).map((c: any) => ({
        label: c.name || c._id || 'Other',
        value: c.totalSales || c.count || 0,
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#101828', margin: 0, letterSpacing: '-0.4px' }}>
                        Dashboard
                    </h1>
                    <p style={{ fontSize: '13px', color: '#667085', margin: '4px 0 0' }}>
                        Welcome back! Here&apos;s what&apos;s happening with your store.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '9px 16px', background: '#fff', border: '1px solid #e4e7ec',
                        borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#344054',
                        cursor: 'pointer',
                    }}
                >
                    <FiRefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* ── KPI cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
                {kpis.map((k, i) => (
                    <div key={i} style={{
                        borderRadius: '16px', padding: '22px',
                        background: `linear-gradient(135deg, ${k.from} 0%, ${k.to} 100%)`,
                        boxShadow: `0 10px 24px -14px ${k.from}`,
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '11px',
                            background: 'rgba(255,255,255,0.2)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                        }}>
                            <k.icon size={19} color="#fff" />
                        </div>

                        {isLoading ? (
                            <div style={{ width: '80px', height: '26px', background: 'rgba(255,255,255,0.3)', borderRadius: '6px' }} />
                        ) : (
                            <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                                {k.value}
                            </p>
                        )}
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.95)', margin: '8px 0 0', fontWeight: 600 }}>
                            {k.label}
                        </p>
                        <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.72)', margin: '3px 0 0' }}>
                            {k.sub}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Small tiles ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '12px' }}>
                {tiles.map((t, i) => (
                    <Link key={i} href={t.href} style={{ ...card, padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        <span style={{
                            width: '38px', height: '38px', borderRadius: '10px', background: t.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <t.icon size={17} color={t.color} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '17px', fontWeight: 800, color: '#101828', lineHeight: 1.2 }}>
                                {t.value}
                            </span>
                            <span style={{ display: 'block', fontSize: '11.5px', color: '#667085', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.label}
                            </span>
                        </span>
                    </Link>
                ))}
            </div>

            {/* ── Revenue trend + order status ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px' }}>
                <div style={cardPad}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                            <h3 style={sectionTitle}>Revenue Trend</h3>
                            <p style={{ fontSize: '12px', color: '#98a2b3', margin: '2px 0 0' }}>Paid orders, by month</p>
                        </div>
                        <Link href="/dashboard/admin/analytics" style={viewAll}>Reports <FiArrowRight size={12} /></Link>
                    </div>
                    {revenuePoints.length > 0 ? (
                        <AreaChart data={revenuePoints} color="#10B981" height={270} formatValue={(n) => `৳${compact(n)}`} />
                    ) : (
                        <EmptyBlock icon={<FiTrendingUp size={26} color="#d0d5dd" />} text="No paid orders yet" height={270} />
                    )}
                </div>

                <div style={cardPad}>
                    <h3 style={{ ...sectionTitle, marginBottom: '4px' }}>Order Status</h3>
                    <p style={{ fontSize: '12px', color: '#98a2b3', margin: '0 0 18px' }}>Where orders sit right now</p>
                    <DonutChart
                        data={pipeline.map(p => ({ label: p.label, value: p.value, color: p.color }))}
                        centerLabel="Total orders"
                        centerValue={stats?.totalOrders || 0}
                    />
                </div>
            </div>

            {/* ── Category sales + top products ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px' }}>
                <div style={cardPad}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div>
                            <h3 style={sectionTitle}>Sales by Category</h3>
                            <p style={{ fontSize: '12px', color: '#98a2b3', margin: '2px 0 0' }}>Revenue per category</p>
                        </div>
                        <Link href="/dashboard/admin/categories" style={viewAll}>Categories <FiArrowRight size={12} /></Link>
                    </div>
                    {categoryPoints.length > 0 ? (
                        <BarChart data={categoryPoints} colors={CHART_COLORS} height={240} formatValue={(n) => `৳${compact(n)}`} />
                    ) : (
                        <EmptyBlock icon={<FiGrid size={26} color="#d0d5dd" />} text="No category sales yet" height={240} />
                    )}
                </div>

                <div style={cardPad}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={sectionTitle}>Top Products</h3>
                        <Link href="/dashboard/admin/products" style={viewAll}>All <FiArrowRight size={12} /></Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {topProducts.length > 0 ? topProducts.map((p: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                <span style={{
                                    width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0,
                                    background: CHART_COLORS[i % CHART_COLORS.length] + '1a',
                                    color: CHART_COLORS[i % CHART_COLORS.length],
                                    fontSize: '11px', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {i + 1}
                                </span>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '9px', overflow: 'hidden',
                                    background: '#f6f6f6', border: '1px solid #eee', flexShrink: 0,
                                }}>
                                    {p.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FiShoppingBag size={14} color="#ccc" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#101828', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.name}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#98a2b3', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {money(p.price)}
                                        <span style={{ color: '#e4e7ec' }}>•</span>
                                        {p.totalSold || 0} sold
                                        {(p.stock ?? 0) <= 5 && (
                                            <span style={{ color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <FiAlertTriangle size={10} /> low
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <EmptyBlock icon={<FiShoppingBag size={24} color="#d0d5dd" />} text="No products yet" height={160} />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Recent orders + quick actions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px' }}>
                <div style={{ ...card, overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '18px 20px', borderBottom: '1px solid #f2f4f7',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <h3 style={sectionTitle}>Recent Orders</h3>
                            {recentOrders.length > 0 && (
                                <span style={{
                                    fontSize: '10px', fontWeight: 700, color: '#fff',
                                    background: 'var(--color-primary)', padding: '2px 8px', borderRadius: '999px',
                                }}>
                                    {recentOrders.length}
                                </span>
                            )}
                        </div>
                        <Link href="/dashboard/admin/orders" style={viewAll}>View All <FiArrowRight size={12} /></Link>
                    </div>

                    {recentOrders.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#fafbfc' }}>
                                        {['Customer', 'Order', 'Status', 'Total', 'Placed'].map((h, i) => (
                                            <th key={h} style={{
                                                textAlign: i > 2 ? 'right' : 'left',
                                                fontSize: '11px', fontWeight: 700, color: '#667085',
                                                textTransform: 'uppercase', letterSpacing: '0.4px',
                                                padding: '10px 20px', whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order: any, i: number) => {
                                        const sc = statusColor(order.status);
                                        return (
                                            <tr key={order._id || i} style={{ borderTop: '1px solid #f2f4f7' }}>
                                                <td style={{ padding: '12px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span style={{
                                                            width: '32px', height: '32px', borderRadius: '9px', background: sc.bg,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        }}>
                                                            {order.status === 'pending' ? <FiClock size={14} color={sc.text} />
                                                                : order.status === 'shipped' ? <FiTruck size={14} color={sc.text} />
                                                                    : order.status === 'delivered' ? <FiCheckCircle size={14} color={sc.text} />
                                                                        : <FiShoppingCart size={14} color={sc.text} />}
                                                        </span>
                                                        <span style={{ minWidth: 0 }}>
                                                            <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#101828' }}>
                                                                {order.user?.firstName || order.guestInfo?.name || 'Customer'} {order.user?.lastName || ''}
                                                            </span>
                                                            {order.guestInfo?.phone && (
                                                                <span style={{ fontSize: '11px', color: '#98a2b3', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                    <FiPhone size={9} /> {order.guestInfo.phone}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 20px', fontSize: '12px', color: '#667085', whiteSpace: 'nowrap' }}>
                                                    {order.orderNumber}
                                                </td>
                                                <td style={{ padding: '12px 20px' }}>
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 700, color: sc.text, background: sc.bg,
                                                        padding: '3px 9px', borderRadius: '999px', textTransform: 'capitalize',
                                                    }}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#101828', whiteSpace: 'nowrap' }}>
                                                    {money(order.total)}
                                                </td>
                                                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11.5px', color: '#98a2b3', whiteSpace: 'nowrap' }}>
                                                    {order.createdAt ? timeAgo(order.createdAt) : ''}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyBlock icon={<FiShoppingCart size={28} color="#d0d5dd" />} text="No website orders yet" height={200} />
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={cardPad}>
                        <h3 style={{ ...sectionTitle, marginBottom: '14px' }}>Quick Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { label: 'Add Product', href: '/dashboard/admin/products/new', icon: FiPlus, color: '#059669', bg: '#ECFDF5' },
                                { label: 'Orders', href: '/dashboard/admin/orders', icon: FiShoppingCart, color: '#2563EB', bg: '#EFF6FF' },
                                { label: 'Shipping', href: '/dashboard/admin/shipping', icon: FiTruck, color: '#D97706', bg: '#FFFBEB' },
                                { label: 'Reports', href: '/dashboard/admin/analytics', icon: FiTrendingUp, color: '#7C3AED', bg: '#F5F3FF' },
                                { label: 'Coupons', href: '/dashboard/admin/coupons', icon: FiTag, color: '#DB2777', bg: '#FDF2F8' },
                                { label: 'Reviews', href: '/dashboard/admin/reviews', icon: FiStar, color: '#0891B2', bg: '#ECFEFF' },
                            ].map((item, i) => (
                                <Link key={i} href={item.href} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '11px 12px', background: item.bg, borderRadius: '11px',
                                    textDecoration: 'none', color: item.color, fontSize: '12px', fontWeight: 600,
                                }}>
                                    <item.icon size={14} />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div style={cardPad}>
                        <h3 style={{ ...sectionTitle, marginBottom: '14px' }}>Order Pipeline</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                            {pipeline.map((p) => {
                                const total = pipeline.reduce((s, x) => s + x.value, 0);
                                const pct = total ? Math.round((p.value / total) * 100) : 0;
                                return (
                                    <Link key={p.label} href={`/dashboard/admin/orders?status=${p.label.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontSize: '12px', color: '#475467', fontWeight: 500 }}>{p.label}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#101828' }}>{p.value}</span>
                                        </div>
                                        <div style={{ height: '6px', background: '#f2f4f7', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: '999px', transition: 'width .5s ease' }} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function EmptyBlock({ icon, text, height }: { icon: React.ReactNode; text: string; height: number }) {
    return (
        <div style={{
            height, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
            {icon}
            <p style={{ fontSize: '12.5px', color: '#98a2b3', margin: 0 }}>{text}</p>
        </div>
    );
}

export default AdminDashboard;
