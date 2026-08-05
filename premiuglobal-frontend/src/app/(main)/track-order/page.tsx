"use client";

import React, { useState } from 'react';
import {
    FiSearch, FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiMapPin, FiRotateCcw,
} from 'react-icons/fi';

const ORANGE = '#F47B20';
const DARK = '#0C2E20';
const TEXT = '#1F3347';

const money = (n: number) => `৳${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');
};

// Normal fulfilment flow — the progress bar walks these in order.
const FLOW = [
    { key: 'pending', label: 'Order Placed', icon: <FiClock size={16} /> },
    { key: 'confirmed', label: 'Confirmed', icon: <FiCheckCircle size={16} /> },
    { key: 'processing', label: 'Processing', icon: <FiPackage size={16} /> },
    { key: 'shipped', label: 'Shipped', icon: <FiTruck size={16} /> },
    { key: 'delivered', label: 'Delivered', icon: <FiMapPin size={16} /> },
];

const STATUS_LABEL: Record<string, string> = {
    pending: 'Order Placed', confirmed: 'Confirmed', processing: 'Processing',
    shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned',
};

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [order, setOrder] = useState<any>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim() || !phone.trim()) {
            setError('Please enter both your Order ID and phone number.');
            return;
        }
        setLoading(true);
        setError('');
        setOrder(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId.trim(), phone: phone.trim() }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Could not find your order.');
            setOrder(json.data);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const status: string = order?.status || 'pending';
    const isCancelled = status === 'cancelled' || status === 'returned';
    const currentStep = FLOW.findIndex(s => s.key === status);

    const inputClass =
        'w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[14px] text-gray-800 bg-gray-50 outline-none transition-colors focus:border-[#F47B20] focus:bg-white';

    return (
        <div className="bg-[var(--color-background)] min-h-screen pb-16">

            {/* Hero — sits on the site's cream background (no white block) */}
            <div>
                <div className="mx-auto max-w-[900px] px-4 lg:px-8 py-12 text-center">
                    <span className="inline-block text-[13px] font-semibold px-3.5 py-1 rounded-full" style={{ background: `${ORANGE}1a`, color: ORANGE }}>
                        Track Order
                    </span>
                    <h1 className="mt-4 text-[28px] lg:text-[34px] font-bold" style={{ color: DARK }}>Track Your Order</h1>
                    <p className="mt-3 text-[15px] text-gray-500 max-w-[480px] mx-auto leading-relaxed">
                        Enter your Order ID and the phone number you used at checkout to see the latest status.
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-[900px] px-4 lg:px-8">

                {/* Form */}
                <form onSubmit={handleTrack} className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-medium mb-1.5 text-gray-600">Order ID</label>
                            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. DOM-0001" className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-[13px] font-medium mb-1.5 text-gray-600">Phone Number</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className={inputClass} />
                        </div>
                    </div>
                    {error && <p className="text-[12.5px] mt-3" style={{ color: '#b42318' }}>{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-5 inline-flex items-center gap-2 px-7 py-3 rounded-lg text-white text-[14px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                        style={{ background: ORANGE }}
                    >
                        {loading
                            ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Searching…</>
                            : <><FiSearch size={15} /> Track Order</>}
                    </button>
                </form>

                {/* Result */}
                {order && (
                    <div className="mt-6 flex flex-col gap-5">

                        {/* Header + status */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[13px] text-gray-500">Order ID</p>
                                    <p className="text-[18px] font-bold" style={{ color: TEXT }}>{order.orderId}</p>
                                    <p className="text-[12.5px] text-gray-400 mt-0.5">Placed on {formatDate(order.createdAt)}</p>
                                </div>
                                <span
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold"
                                    style={isCancelled ? { background: '#fef3f2', color: '#b42318' } : { background: `${ORANGE}14`, color: ORANGE }}
                                >
                                    {isCancelled ? <FiXCircle size={14} /> : <FiCheckCircle size={14} />}
                                    {STATUS_LABEL[status] || status}
                                </span>
                            </div>

                            {/* Progress timeline */}
                            {isCancelled ? (
                                <div className="mt-6 flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: '#fef3f2', color: '#b42318' }}>
                                    {status === 'returned' ? <FiRotateCcw size={18} /> : <FiXCircle size={18} />}
                                    <p className="text-[13.5px] font-medium m-0">
                                        This order was {status}. {status === 'cancelled' ? 'Please contact us if this is unexpected.' : ''}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-7 flex items-start justify-between">
                                    {FLOW.map((step, i) => {
                                        const done = i <= currentStep;
                                        const isLast = i === FLOW.length - 1;
                                        return (
                                            <React.Fragment key={step.key}>
                                                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                                    <span
                                                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors"
                                                        style={done ? { background: ORANGE, color: '#fff' } : { background: '#f1f2f4', color: '#9ca3af' }}
                                                    >
                                                        {step.icon}
                                                    </span>
                                                    <span className="text-[11.5px] mt-1.5 font-medium leading-tight" style={{ color: done ? TEXT : '#9ca3af' }}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                                {!isLast && (
                                                    <span
                                                        className="h-[3px] rounded-full flex-1 mt-[18px] -mx-1"
                                                        style={{ background: i < currentStep ? ORANGE : '#f1f2f4' }}
                                                    />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            )}

                            {(order.trackingNumber || order.carrier) && (
                                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-gray-100 pt-4">
                                    {order.carrier && <p className="text-[13px] text-gray-500">Carrier: <span className="font-semibold" style={{ color: TEXT }}>{order.carrier}</span></p>}
                                    {order.trackingNumber && <p className="text-[13px] text-gray-500">Tracking #: <span className="font-semibold" style={{ color: TEXT }}>{order.trackingNumber}</span></p>}
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h2 className="text-[15px] font-bold mb-4" style={{ color: DARK }}>Items ({order.items?.length || 0})</h2>
                            <div className="flex flex-col divide-y divide-gray-100">
                                {(order.items || []).map((it: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 py-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={it.thumbnail} alt={it.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13.5px] font-medium truncate" style={{ color: TEXT }}>{it.name}</p>
                                            <p className="text-[12px] text-gray-400">Qty {it.quantity} × {money(it.price)}</p>
                                        </div>
                                        <p className="text-[13.5px] font-semibold shrink-0" style={{ color: TEXT }}>{money(it.total)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 border-t border-gray-100 pt-4 flex flex-col gap-1.5 text-[13.5px]">
                                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
                                {order.shippingCost > 0 && <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{money(order.shippingCost)}</span></div>}
                                {order.discount > 0 && <div className="flex justify-between text-gray-500"><span>Discount</span><span>− {money(order.discount)}</span></div>}
                                <div className="flex justify-between font-bold mt-1 text-[15px]" style={{ color: TEXT }}><span>Total</span><span style={{ color: ORANGE }}>{money(order.total)}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
