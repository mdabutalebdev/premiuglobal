"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    FiSearch, FiEye, FiTruck, FiPackage, FiClock, FiCheckCircle,
    FiXCircle, FiRefreshCw, FiTrash2, FiShoppingCart, FiDollarSign,
} from 'react-icons/fi';
import {
    useGetAdminOrdersQuery,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
    useGetOrderStatsQuery,
    useDeleteOrderMutation,
} from '@/redux/api/orderApi';
import { toast } from 'react-hot-toast';
import {
    PageShell, PageHeader, Card, CardHeader, Btn, IconBtn, Badge, SearchInput,
    TableWrap, Th, Td, Tr, EmptyState, Spinner, Pagination, T, tint,
} from '@/components/admin/ui';

const PER_PAGE = 10;

const ORDER_STATUS = [
    { key: 'pending', label: 'Pending', color: '#F59E0B', icon: FiClock },
    { key: 'confirmed', label: 'Confirmed', color: '#3B82F6', icon: FiCheckCircle },
    { key: 'processing', label: 'Processing', color: '#8B5CF6', icon: FiPackage },
    { key: 'shipped', label: 'Shipped', color: '#6366F1', icon: FiTruck },
    { key: 'delivered', label: 'Delivered', color: '#10B981', icon: FiCheckCircle },
    { key: 'cancelled', label: 'Cancelled', color: '#EF4444', icon: FiXCircle },
    { key: 'returned', label: 'Returned', color: '#667085', icon: FiRefreshCw },
];

const PAYMENT_STATUS: Record<string, string> = {
    pending: '#F59E0B',
    paid: '#10B981',
    failed: '#EF4444',
    refunded: '#8B5CF6',
};

const PAYMENT_METHOD: Record<string, { label: string; color: string }> = {
    bkash: { label: 'bKash', color: '#E2136E' },
    rocket: { label: 'Rocket', color: '#8332AC' },
    nagad: { label: 'Nagad', color: '#F47920' },
    cod: { label: 'COD', color: '#16a34a' },
};

/** Coloured <select> used for the two editable status columns. */
function StatusSelect({ value, options, color, onChange }: {
    value: string;
    options: { value: string; label: string }[];
    color: string;
    onChange: (v: string) => void;
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                fontSize: '11.5px', fontWeight: 700, textTransform: 'capitalize',
                padding: '5px 9px', borderRadius: '999px', cursor: 'pointer',
                border: `1px solid ${tint(color, '33')}`, outline: 'none',
                background: tint(color), color,
            }}
        >
            {options.map(o => <option key={o.value} value={o.value} style={{ color: '#344054' }}>{o.label}</option>)}
        </select>
    );
}

export default function OrdersPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    const { data: ordersData, isLoading, isFetching, refetch } = useGetAdminOrdersQuery({
        page,
        limit: PER_PAGE,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
    });

    const { data: statsData } = useGetOrderStatsQuery({});
    const [updateStatus] = useUpdateOrderStatusMutation();
    const [updatePayment] = useUpdatePaymentStatusMutation();
    const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

    const orders = ordersData?.data || [];
    const totalPages = ordersData?.meta?.totalPages || 1;
    const totalOrders = ordersData?.meta?.total || 0;
    const stats = statsData?.data || {};

    const toastStyle = { style: { borderRadius: '10px', background: 'var(--color-primary)', color: '#fff' } };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await updateStatus({ id: orderId, status: newStatus }).unwrap();
            toast.success(`Order marked as ${newStatus}`, toastStyle);
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update status');
        }
    };

    const handlePaymentChange = async (orderId: string, newStatus: string) => {
        try {
            await updatePayment({ id: orderId, paymentStatus: newStatus }).unwrap();
            toast.success(`Payment marked as ${newStatus}`, toastStyle);
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update payment');
        }
    };

    const handleDelete = async (orderId: string, label: string) => {
        if (!window.confirm(`Delete order ${label}? This cannot be undone.`)) return;
        try {
            await deleteOrder(orderId).unwrap();
            toast.success('Order deleted', toastStyle);
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to delete order');
        }
    };

    const money = (n: number) => `৳${(n || 0).toLocaleString()}`;
    const formatDate = (d: string) => d
        ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    // "All" plus one filter chip per status
    const filters = [
        { key: 'all', label: 'All Orders', value: stats.total ?? totalOrders, color: '#475467' },
        ...ORDER_STATUS.slice(0, 5).map(s => ({ key: s.key, label: s.label, value: stats[s.key] || 0, color: s.color })),
    ];

    return (
        <PageShell>
            <PageHeader
                title="Orders"
                subtitle="Track, update and manage every customer order"
                actions={
                    <Btn icon={<FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>
                        Refresh
                    </Btn>
                }
            />

            {/* Status filter cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {filters.map(f => {
                    const on = statusFilter === f.key;
                    return (
                        <button
                            key={f.key}
                            onClick={() => { setStatusFilter(f.key); setPage(1); }}
                            style={{
                                textAlign: 'left', cursor: 'pointer', padding: '15px 16px', borderRadius: '14px',
                                background: on ? tint(f.color) : '#fff',
                                border: `1px solid ${on ? tint(f.color, '55') : T.border}`,
                                boxShadow: on ? 'none' : '0 1px 2px rgba(16,24,40,0.04)',
                            }}
                        >
                            <p style={{ fontSize: '22px', fontWeight: 700, color: f.color, margin: 0, lineHeight: 1.1 }}>{f.value}</p>
                            <p style={{ fontSize: '12.5px', fontWeight: 600, color: on ? f.color : T.muted, margin: '5px 0 0' }}>{f.label}</p>
                        </button>
                    );
                })}
            </div>

            <Card padded={false}>
                <CardHeader
                    title="Order List"
                    subtitle={`${totalOrders} order${totalOrders === 1 ? '' : 's'}${statusFilter !== 'all' ? ` · ${statusFilter}` : ''}`}
                    actions={
                        <>
                            <SearchInput
                                value={search}
                                onChange={(v) => { setSearch(v); setPage(1); }}
                                placeholder="Order number or customer…"
                                icon={<FiSearch size={15} />}
                                width="290px"
                            />
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                style={{
                                    padding: '10px 13px', borderRadius: '10px', border: '1px solid #d0d5dd',
                                    fontSize: '13px', color: '#344054', background: '#fff', outline: 'none', cursor: 'pointer',
                                }}
                            >
                                <option value="all">All statuses</option>
                                {ORDER_STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                        </>
                    }
                />

                {isLoading ? (
                    <Spinner />
                ) : orders.length === 0 ? (
                    <EmptyState
                        icon={<FiPackage size={34} color="#d0d5dd" />}
                        title="No orders found"
                        text={search || statusFilter !== 'all'
                            ? 'Nothing matches these filters — try clearing them.'
                            : 'Orders placed on the store will appear here.'}
                        height={260}
                    />
                ) : (
                    <>
                        <TableWrap>
                            <thead>
                                <tr>
                                    <Th>Order</Th>
                                    <Th>Customer</Th>
                                    <Th align="right">Items</Th>
                                    <Th align="right">Total</Th>
                                    <Th>Payment</Th>
                                    <Th>Status</Th>
                                    <Th>Placed</Th>
                                    <Th align="right">Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order: any) => {
                                    const method = PAYMENT_METHOD[order.paymentMethod] || { label: order.paymentMethod?.toUpperCase() || '—', color: T.muted };
                                    return (
                                        <Tr key={order._id}>
                                            <Td>
                                                <p style={{ margin: 0, fontWeight: 600, color: T.heading, fontSize: '13px' }}>
                                                    {order.orderId || order.orderNumber}
                                                </p>
                                                <div style={{ marginTop: '5px' }}>
                                                    <Badge color={method.color}>{method.label}</Badge>
                                                </div>
                                            </Td>
                                            <Td>
                                                <p style={{ margin: 0, fontWeight: 600, color: T.heading, fontSize: '13px' }}>
                                                    {order.user?.firstName
                                                        ? `${order.user.firstName} ${order.user.lastName || ''}`
                                                        : order.guestInfo?.name || 'Guest'}
                                                </p>
                                                <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: T.faint }}>
                                                    {order.user?.email || order.guestInfo?.phone || '—'}
                                                </p>
                                            </Td>
                                            <Td align="right">{order.items?.length || 0}</Td>
                                            <Td align="right" style={{ fontWeight: 700, color: T.heading }}>{money(order.total)}</Td>
                                            <Td>
                                                <StatusSelect
                                                    value={order.paymentStatus || 'pending'}
                                                    color={PAYMENT_STATUS[order.paymentStatus] || '#F59E0B'}
                                                    options={Object.keys(PAYMENT_STATUS).map(k => ({ value: k, label: k }))}
                                                    onChange={(v) => handlePaymentChange(order._id, v)}
                                                />
                                            </Td>
                                            <Td>
                                                <StatusSelect
                                                    value={order.status || 'pending'}
                                                    color={ORDER_STATUS.find(s => s.key === order.status)?.color || '#F59E0B'}
                                                    options={ORDER_STATUS.map(s => ({ value: s.key, label: s.label }))}
                                                    onChange={(v) => handleStatusChange(order._id, v)}
                                                />
                                            </Td>
                                            <Td style={{ color: T.faint, fontSize: '12px', whiteSpace: 'nowrap' }}>
                                                {formatDate(order.createdAt)}
                                            </Td>
                                            <Td align="right">
                                                <div style={{ display: 'inline-flex', gap: '7px' }}>
                                                    <Link href={`/dashboard/admin/orders/${order._id}`}>
                                                        <IconBtn icon={<FiEye size={14} />} color="#3B82F6" title="View details" />
                                                    </Link>
                                                    <IconBtn
                                                        icon={<FiTrash2 size={14} />}
                                                        color="#EF4444"
                                                        title="Delete order"
                                                        disabled={isDeleting}
                                                        onClick={() => handleDelete(order._id, order.orderId || order.orderNumber || '')}
                                                    />
                                                </div>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </TableWrap>

                        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                    </>
                )}
            </Card>
        </PageShell>
    );
}
