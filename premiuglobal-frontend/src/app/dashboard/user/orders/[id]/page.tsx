"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiArrowLeft,
    FiPackage,
    FiClock,
    FiCheckCircle,
    FiTruck,
    FiXCircle,
    FiMapPin,
    FiCreditCard,
    FiPhone,
    FiMail,
    FiUser,
    FiCopy,
    FiDownload,
} from 'react-icons/fi';
import { useGetOrderByIdQuery } from '@/redux/api/orderApi';
import { downloadInvoice } from '@/utils/invoice';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const statusIcons: Record<string, React.ElementType> = {
    pending: FiClock,
    confirmed: FiCheckCircle,
    processing: FiPackage,
    shipped: FiTruck,
    delivered: FiCheckCircle,
    cancelled: FiXCircle,
};

const paymentLabel = (method: string) =>
    ({ bkash: 'bKash', rocket: 'Rocket', nagad: 'Nagad', cod: 'Cash on Delivery' }[method] || (method || 'COD').toUpperCase());

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    // Fetch the single order by id
    const { data: orderData, isLoading } = useGetOrderByIdQuery(orderId);
    const order = orderData?.data;

    const currentStepIndex = statusSteps.indexOf(order?.status || 'pending');

    const copyOrderId = () => {
        navigator.clipboard.writeText(order?.orderId || order?.orderNumber || orderId);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-3"></div>
                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                    <div className="h-20 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <FiPackage size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-600 mb-1">Order not found</h3>
                <p className="text-sm text-gray-400 mb-4">The order you&apos;re looking for doesn&apos;t exist</p>
                <Link href="/dashboard/user/orders" className="text-[var(--color-text-primary)] font-bold text-sm hover:underline">
                    ← Back to My Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-[var(--color-text-primary)] mb-4 font-semibold transition-colors"
                >
                    <FiArrowLeft size={16} />
                    Back to My Orders
                </button>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {order.orderId || order.orderNumber || `Order #${orderId.slice(-8).toUpperCase()}`}
                            </h1>
                            <button onClick={copyOrderId} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-gray-600 transition-all">
                                <FiCopy size={14} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold capitalize ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                            order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                            'bg-blue-50 text-blue-700'
                        }`}>
                            {React.createElement(statusIcons[order.status] || FiClock, { size: 16 })}
                            {order.status}
                        </span>
                        <button
                            onClick={() => downloadInvoice(order)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] shadow-md shadow-[var(--color-primary)]/20 transition-all"
                            title="Download receipt as PDF"
                        >
                            <FiDownload size={15} />
                            Download Receipt
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Timeline */}
            {order.status !== 'cancelled' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-base font-bold text-gray-800 mb-6">Order Progress</h2>
                    <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100">
                            <div
                                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[#1a6b3c] transition-all duration-500"
                                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                            ></div>
                        </div>

                        {statusSteps.map((step, index) => {
                            const Icon = statusIcons[step];
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            return (
                                <div key={step} className="flex flex-col items-center relative z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                        isCompleted
                                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md shadow-[var(--color-primary)]/20'
                                            : 'bg-gray-100 text-gray-300'
                                    } ${isCurrent ? 'ring-4 ring-[var(--color-primary)]/10' : ''}`}>
                                        <Icon size={18} />
                                    </div>
                                    <p className={`text-xs mt-2 capitalize font-semibold ${
                                        isCompleted ? 'text-[var(--color-text-primary)]' : 'text-gray-300'
                                    }`}>
                                        {step}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50">
                            <h2 className="text-base font-bold text-gray-800">Order Items ({order.items?.length || 0})</h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 px-6 py-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
                                        {item.thumbnail || item.image ? (
                                            <img src={item.thumbnail || item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <FiPackage size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                                        {(item.color || item.size) && (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {item.color && `Color: ${item.color}`}{item.color && item.size && ' · '}{item.size && `Size: ${item.size}`}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
                                        ৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="px-6 py-4 bg-gray-50/50 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span className="font-semibold text-gray-600">৳{order.subtotal?.toLocaleString() || order.total?.toLocaleString()}</span>
                            </div>
                            {order.shippingCost > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Shipping</span>
                                    <span className="font-semibold text-gray-600">৳{order.shippingCost?.toLocaleString()}</span>
                                </div>
                            )}
                            {order.discount > 0 && (
                                <>
                                    {order.couponCode && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Coupon</span>
                                            <span className="font-semibold text-gray-600 uppercase tracking-wide">{order.couponCode}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Discount</span>
                                        <span className="font-semibold text-emerald-600">-৳{order.discount?.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-base pt-2 border-t border-gray-200 mt-2">
                                <span className="font-bold text-gray-700">Total</span>
                                <span className="font-bold text-[var(--color-text-primary)] text-lg">৳{order.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Info */}
                <div className="space-y-4">
                    {/* Shipping Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <FiMapPin size={16} className="text-[var(--color-text-primary)]" />
                            <h3 className="text-sm font-bold text-gray-800">Shipping Address</h3>
                        </div>
                        {order.shippingAddress ? (
                            <div className="text-sm text-gray-500 space-y-1.5">
                                <p className="font-semibold text-gray-700">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.address}</p>
                                <p>{[order.shippingAddress.city, order.shippingAddress.area].filter(Boolean).join(', ')}</p>
                                {order.shippingAddress.postalCode && <p>{order.shippingAddress.postalCode}</p>}
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                                    <FiPhone size={12} />
                                    {order.shippingAddress.phone}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No address info available</p>
                        )}
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <FiCreditCard size={16} className="text-[var(--color-text-primary)]" />
                            <h3 className="text-sm font-bold text-gray-800">Payment</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Method</span>
                                <span className="font-semibold text-gray-700">{paymentLabel(order.paymentMethod)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Status</span>
                                <span className={`font-bold text-xs px-2 py-0.5 rounded-md capitalize ${
                                    order.paymentStatus === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-amber-50 text-amber-700'
                                }`}>
                                    {order.paymentStatus || 'pending'}
                                </span>
                            </div>
                            {order.paymentDetails?.senderNumber && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Sender No.</span>
                                    <span className="font-mono text-xs text-gray-600">{order.paymentDetails.senderNumber}</span>
                                </div>
                            )}
                            {(order.paymentDetails?.transactionId || order.transactionId) && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">TXN ID</span>
                                    <span className="font-mono text-xs text-gray-600">{order.paymentDetails?.transactionId || order.transactionId}</span>
                                </div>
                            )}
                            {order.paymentDetails?.paymentTime && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Paid At</span>
                                    <span className="text-xs text-gray-600">{new Date(order.paymentDetails.paymentTime).toLocaleString('en-US')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    {order.timeline && order.timeline.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-4">Activity</h3>
                            <div className="space-y-4">
                                {order.timeline.map((event: any, idx: number) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-700 capitalize">{event.status || event.action}</p>
                                            {event.note && <p className="text-[11px] text-gray-500 mt-0.5">{event.note}</p>}
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {new Date(event.createdAt || event.timestamp || event.date).toLocaleString('en-US')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
