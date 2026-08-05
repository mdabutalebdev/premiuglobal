"use client";

import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import Link from 'next/link';
import {
    FiPackage,
    FiUser,
    FiShoppingBag,
    FiArrowRight,
    FiClock,
    FiCheckCircle,
    FiTruck,
    FiDollarSign,
    FiBox,
} from 'react-icons/fi';
import { useGetMyOrdersQuery } from '@/redux/api/orderApi';

// Brand accent — the storefront's orange. Used for buttons and icon tiles here.
const ORANGE = 'var(--filter-accent)';
const ORANGE_SOFT = '#FEF1E6';

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
        pending:    { bg: '#FFF8E7', color: '#B45309', label: 'Pending' },
        confirmed:  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Confirmed' },
        processing: { bg: '#F5F3FF', color: '#7C3AED', label: 'Processing' },
        shipped:    { bg: '#EEF2FF', color: '#3730A3', label: 'Shipped' },
        delivered:  { bg: 'var(--color-primary-lightest)', color: '#065F46', label: 'Delivered' },
        cancelled:  { bg: '#FEF2F2', color: '#991B1B', label: 'Cancelled' },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 10px', borderRadius: '20px',
            background: s.bg, color: s.color,
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
        }}>
            {s.label}
        </span>
    );
};

const UserDashboard = () => {
    const { user } = useAppSelector((state) => state.auth);
    const { data: ordersData, isLoading: ordersLoading } = useGetMyOrdersQuery({ limit: 5 });

    const orders = ordersData?.data || [];
    const totalOrders = ordersData?.meta?.total || orders.length || 0;
    const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const delivered = orders.filter((o: any) => o.status === 'delivered').length;

    const firstName = user?.name?.split(' ')[0] || 'User';
    const initials = (user?.name || 'U').charAt(0).toUpperCase();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ── Welcome Banner ── */}
            <div style={{
                background: 'linear-gradient(120deg, #FFF6EC 0%, #FDE9D3 100%)',
                borderRadius: '16px', padding: '30px 34px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                overflow: 'hidden', position: 'relative',
                border: '1px solid #FBE2C7',
            }}>
                {/* BG decoration */}
                <div style={{ position: 'absolute', top: '-50px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(244,135,33,0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-70px', right: '150px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(244,135,33,0.06)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        background: '#fff',
                        border: `2px solid ${ORANGE}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '19px', fontWeight: 800, color: ORANGE,
                        flexShrink: 0,
                    }}>
                        {initials}
                    </div>
                    <div>
                        <p style={{ color: '#a06a2c', fontSize: '12px', margin: '0 0 4px', letterSpacing: '0.3px', fontWeight: 600 }}>
                            Welcome back
                        </p>
                        <h1 style={{ color: '#5c3a12', fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                            {firstName}! 👋
                        </h1>
                    </div>
                </div>

                <Link href="/dashboard/user/orders" style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: ORANGE, color: '#fff',
                    padding: '11px 20px', borderRadius: '10px',
                    textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                    boxShadow: '0 6px 16px rgba(244,135,33,0.28)',
                    zIndex: 1, whiteSpace: 'nowrap',
                }}>
                    My Orders <FiArrowRight size={14} />
                </Link>
            </div>

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                    { icon: FiShoppingBag, label: 'Total Orders', value: totalOrders, color: ORANGE, bg: ORANGE_SOFT },
                    { icon: FiCheckCircle, label: 'Delivered', value: delivered, color: ORANGE, bg: ORANGE_SOFT },
                    { icon: FiDollarSign, label: 'Total Spent', value: `৳${totalSpent.toLocaleString()}`, color: ORANGE, bg: ORANGE_SOFT },
                ].map((s, i) => (
                    <div key={i} style={{
                        background: '#fff', borderRadius: '14px',
                        border: '1px solid #f0f0f0', padding: '20px 24px',
                        display: 'flex', alignItems: 'center', gap: '16px',
                    }}>
                        <div style={{
                            width: '46px', height: '46px', borderRadius: '12px',
                            background: s.bg, color: s.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p style={{ fontSize: '22px', fontWeight: 800, color: '#111', margin: 0, lineHeight: 1 }}>
                                {ordersLoading ? '—' : s.value}
                            </p>
                            <p style={{ fontSize: '11px', color: '#999', fontWeight: 600, margin: '5px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {s.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Quick Actions ── */}
            <div>
                <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#111', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick Actions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    {[
                        {
                            icon: FiBox,
                            label: 'My Orders',
                            desc: 'Track, view and manage your orders',
                            href: '/dashboard/user/orders',
                        },
                        {
                            icon: FiUser,
                            label: 'Profile Settings',
                            desc: 'Update your name, phone and email',
                            href: '/dashboard/user/profile',
                        },
                        {
                            icon: FiShoppingBag,
                            label: 'Continue Shopping',
                            desc: 'Browse products and add to cart',
                            href: '/',
                        },
                    ].map((item) => (
                        <Link key={item.label} href={item.href} style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            background: '#fff', borderRadius: '14px',
                            border: '1px solid #f0f0f0', padding: '20px 22px',
                            textDecoration: 'none',
                            transition: 'box-shadow 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)';
                            (e.currentTarget as HTMLElement).style.borderColor = '#FBE2C7';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0';
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: ORANGE_SOFT, color: ORANGE,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <item.icon size={19} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 3px' }}>{item.label}</p>
                                <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{item.desc}</p>
                            </div>
                            <FiArrowRight size={15} color="#ccc" />
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Recent Orders ── */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#111', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Recent Orders
                    </h2>
                    <Link href="/dashboard/user/orders" style={{ fontSize: '12px', color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>
                        View All →
                    </Link>
                </div>

                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                    {ordersLoading ? (
                        <div style={{ padding: '48px', textAlign: 'center' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #f0f0f0', borderTopColor: ORANGE, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                            <p style={{ color: '#bbb', fontSize: '13px', marginTop: '12px' }}>Loading orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <FiPackage size={42} color="#e0e0e0" style={{ display: 'block', margin: '0 auto 16px' }} />
                            <p style={{ fontWeight: 700, color: '#555', fontSize: '15px', margin: '0 0 6px' }}>No orders yet</p>
                            <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 20px' }}>Start shopping to see your orders here</p>
                            <Link href="/" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px',
                                padding: '12px 28px', background: ORANGE, color: '#fff',
                                borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                                textDecoration: 'none', letterSpacing: '0.5px',
                                boxShadow: '0 6px 16px rgba(244,135,33,0.28)',
                            }}>
                                Start Shopping <FiArrowRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        <div>
                            {orders.slice(0, 5).map((order: any, i: number) => (
                                <Link key={order._id} href={`/dashboard/user/orders/${order._id}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px 24px', textDecoration: 'none',
                                        borderTop: i > 0 ? '1px solid #f8f8f8' : 'none',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: ORANGE_SOFT, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <FiPackage size={17} color={ORANGE} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
                                                #{order.orderId || order._id?.slice(-8).toUpperCase()}
                                            </p>
                                            <p style={{ fontSize: '11px', color: '#bbb', margin: 0 }}>
                                                {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} · {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#111', margin: 0 }}>
                                            ৳{order.total?.toLocaleString()}
                                        </p>
                                        <StatusBadge status={order.status} />
                                        <FiArrowRight size={14} color="#ccc" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default UserDashboard;
