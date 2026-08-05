"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiArrowLeft,
    FiTruck,
    FiPackage,
    FiDollarSign,
    FiMapPin,
    FiUser,
    FiClock,
    FiCheckCircle,
    FiXCircle,
    FiPrinter,
    FiEdit3,
    FiSave,
    FiCalendar,
    FiMail,
    FiPhone
} from 'react-icons/fi';
import {
    useGetAdminOrderByIdQuery,
    useUpdateOrderStatusMutation,
    useUpdatePaymentStatusMutation,
    useAddAdminNoteMutation
} from '@/redux/api/orderApi';
import { toast } from 'react-hot-toast';
import { downloadInvoice } from '@/utils/invoice';

// Reusable Components
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
        pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: FiClock },
        confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', icon: FiCheckCircle },
        processing: { bg: 'bg-purple-50', text: 'text-purple-700', icon: FiPackage },
        shipped: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: FiTruck },
        delivered: { bg: 'bg-green-50', text: 'text-green-700', icon: FiCheckCircle },
        cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: FiXCircle },
        returned: { bg: 'bg-gray-50', text: 'text-gray-700', icon: FiArrowLeft },
    };
    const { bg, text, icon: Icon } = config[status] || config.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold ${bg} ${text}`}>
            <Icon size={14} />
            <span className="capitalize">{status}</span>
        </span>
    );
};

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: orderResponse, isLoading, refetch } = useGetAdminOrderByIdQuery(id);
    const order = orderResponse?.data;

    const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
    const [updatePayment, { isLoading: isUpdatingPayment }] = useUpdatePaymentStatusMutation();
    const [addNote, { isLoading: isAddingNote }] = useAddAdminNoteMutation();

    const [adminNote, setAdminNote] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');

    const handleUpdateStatus = async () => {
        if (!selectedStatus) return;
        try {
            await updateStatus({ id, status: selectedStatus }).unwrap();
            toast.success('Order status updated');
            setSelectedStatus('');
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to update status');
        }
    };

    const handleUpdatePayment = async () => {
        if (!selectedPaymentStatus) return;
        try {
            await updatePayment({ id, paymentStatus: selectedPaymentStatus }).unwrap();
            toast.success('Payment status updated');
            setSelectedPaymentStatus('');
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to update payment');
        }
    };

    const handleAddNote = async () => {
        if (!adminNote) return;
        try {
            await addNote({ id, note: adminNote }).unwrap();
            toast.success('Note added');
            setAdminNote('');
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to add note');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full font-medium"></div>
            </div>
        );
    }

    if (!order) {
        return <div className="p-8 text-center text-gray-500">Order not found</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto mb-10">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-md transition-colors border border-gray-100">
                        <FiArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-800">{order.orderId || order.orderNumber}</h1>
                            <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <FiCalendar size={14} />
                            Placed on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => downloadInvoice(order)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-all text-gray-600 shadow-sm"
                    >
                        <FiPrinter size={16} />
                        Invoice (PDF)
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-all shadow-md">
                        <FiCheckCircle size={16} />
                        Finish Prep
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Table */}
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                            <FiPackage className="text-[var(--color-text-primary)]" size={20} />
                            <h2 className="font-bold text-gray-800">Order Items</h2>
                            <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">{order.items.length} Items</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-md bg-gray-50 overflow-hidden border border-gray-100 p-1">
                                                        <img src={item.product?.thumbnail || item.image} alt={item.name} className="w-full h-full object-cover rounded-sm" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                                        {(item.color || item.size) && (
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                {item.color && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                                        🎨 {item.color}
                                                                    </span>
                                                                )}
                                                                {item.size && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                                        📏 {item.size}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.variant && (
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                                SKU: {item.variant.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">৳{(item.price || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">x{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-800">৳{(item.subtotal || (item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Summary */}
                        <div className="bg-gray-50/50 p-6 border-t border-gray-100">
                            <div className="flex flex-col gap-2 ml-auto max-w-xs">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal:</span>
                                    <span className="font-bold text-gray-800">৳{(order.subtotal || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Shipping:</span>
                                    <span className="font-bold text-gray-800">৳{(order.shippingCost || 0).toLocaleString()}</span>
                                </div>
                                {order.discount > 0 && (
                                    <>
                                        {order.couponCode && (
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Coupon Code:</span>
                                                <span className="font-bold text-gray-700 uppercase tracking-wide">{order.couponCode}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm text-red-500">
                                            <span>Discount:</span>
                                            <span className="font-bold">-৳{(order.discount || 0).toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                                <div className="h-px bg-gray-200 my-2"></div>
                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total:</span>
                                    <span className="text-[var(--color-text-primary)]">৳{(order.total || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6 text-gray-800">
                            <FiClock className="text-[var(--color-text-primary)]" size={20} />
                            <h2 className="font-bold">Order Journey</h2>
                        </div>
                        <div className="space-y-6">
                            {order.timeline?.map((step: any, idx: number) => (
                                <div key={idx} className="relative flex gap-4">
                                    {idx !== order.timeline.length - 1 && (
                                        <div className="absolute left-3 top-7 bottom-0 w-px bg-gray-100"></div>
                                    )}
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white ${idx === 0 ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]' : 'border-gray-200 text-gray-400'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}></div>
                                    </div>
                                    <div className="flex-1 -mt-1">
                                        <div className="flex justify-between">
                                            <p className="text-sm font-bold text-gray-800 capitalize">{step.status}</p>
                                            <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                                                {new Date(step.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{step.message}</p>
                                    </div>
                                </div>
                            )) || <p className="text-gray-400 text-center italic py-4">No timeline available</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column - Customer & Actions */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <FiUser className="text-[var(--color-text-primary)]" size={20} />
                            <h2 className="font-bold">Customer Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-[var(--color-text-primary)]">
                                    {(order.user?.firstName || order.shippingAddress?.fullName || '?')[0]}{(order.user?.lastName || '')[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{order.user?.firstName ? `${order.user.firstName} ${order.user.lastName || ''}` : order.shippingAddress?.fullName || 'Guest'}</p>
                                    <p className="text-xs text-gray-400">Customer ID: {order.user?._id?.slice(-8)}</p>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <FiMail size={14} />
                                    <span>{order.user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <FiPhone size={14} />
                                    <span>{order.user?.phone || order.shippingAddress?.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <FiMapPin className="text-[var(--color-text-primary)]" size={20} />
                            <h2 className="font-bold">Shipping To</h2>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                            <p className="font-bold text-gray-800 mb-1">{order.shippingAddress?.fullName || 'N/A'}</p>
                            <p>{order.shippingAddress?.street || order.shippingAddress?.address || ''}</p>
                            <p>{[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.zipCode].filter(Boolean).join(', ') || ''}</p>
                            <p>{order.shippingAddress?.country || ''}</p>
                            <p className="mt-2 font-bold text-gray-400 flex items-center gap-1 uppercase text-[10px]">
                                <FiTruck size={12} />
                                {order.shippingMethod || 'Standard'} Delivery
                            </p>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 text-gray-800">
                            <FiDollarSign className="text-[var(--color-text-primary)]" size={20} />
                            <h2 className="font-bold">Payment Information</h2>
                        </div>

                        {/* Method Badge */}
                        {(() => {
                            const methodConfig: Record<string, { label: string; bg: string; color: string }> = {
                                bkash:  { label: 'bKash',  bg: '#fdf0f6', color: '#E2136E' },
                                rocket: { label: 'Rocket', bg: '#f7f0fd', color: '#8332AC' },
                                nagad:  { label: 'Nagad',  bg: '#fff6ee', color: '#F47920' },
                                cod:    { label: 'COD',    bg: '#f0fdf4', color: '#16a34a' },
                            };
                            const m = methodConfig[order.paymentMethod] || { label: order.paymentMethod?.toUpperCase() || '—', bg: '#f3f4f6', color: '#6b7280' };
                            return (
                                <div className="px-6 py-4 flex items-center gap-3" style={{ background: m.bg }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: m.color, color: 'white' }}>
                                        {m.label.slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-black text-base" style={{ color: m.color }}>{m.label}</p>
                                        <p className="text-xs text-gray-500 font-medium">Payment Method</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {order.paymentStatus?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="px-6 py-4 space-y-3">
                            {/* Payment Details from Customer */}
                            {order.paymentDetails?.senderNumber && (
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center gap-1.5">
                                        <FiPhone size={13} /> Sender Number:
                                    </span>
                                    <span className="font-medium font-mono text-gray-800">{order.paymentDetails.senderNumber}</span>
                                </div>
                            )}
                            {(order.paymentDetails?.transactionId || order.transactionId) && (
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                    <span className="text-gray-500">Transaction ID:</span>
                                    <span className="font-mono font-medium text-gray-800 text-xs bg-gray-50 px-2 py-1 rounded">
                                        {order.paymentDetails?.transactionId || order.transactionId}
                                    </span>
                                </div>
                            )}
                            {order.paymentDetails?.paymentTime && (
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                                    <span className="text-gray-500 flex items-center gap-1.5">
                                        <FiClock size={13} /> Payment Time:
                                    </span>
                                    <span className="text-gray-700 text-xs font-medium">
                                        {new Date(order.paymentDetails.paymentTime).toLocaleString('en-US')}
                                    </span>
                                </div>
                            )}

                            {/* Change Payment Status */}
                            <div className="flex justify-between items-center text-sm pt-1">
                                <span className="text-gray-500">Change Status:</span>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedPaymentStatus || order.paymentStatus}
                                        onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                                        className="text-xs border border-gray-200 rounded-md p-1.5 outline-none bg-gray-50"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                    {selectedPaymentStatus && selectedPaymentStatus !== order.paymentStatus && (
                                        <button onClick={handleUpdatePayment} disabled={isUpdatingPayment} className="p-1.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md shadow-sm">
                                            <FiCheckCircle size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Status */}
                    <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-800">
                            <FiEdit3 className="text-[var(--color-text-primary)]" size={20} />
                            <h2 className="font-bold">Order Actions</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Change Status</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedStatus || order.status}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-md p-2 text-sm outline-none bg-gray-50/50"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="returned">Returned</option>
                                    </select>
                                    <button
                                        onClick={handleUpdateStatus}
                                        disabled={!selectedStatus || isUpdatingStatus}
                                        className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md hover:bg-[var(--color-primary-dark)] transition-all shadow-md disabled:opacity-50"
                                    >
                                        <FiSave size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-gray-50"></div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Admin Note</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-md p-3 text-sm outline-none bg-gray-50/50 focus:bg-white transition-all h-24 italic"
                                    placeholder="Add a private note regarding this order..."
                                    value={adminNote || order.adminNote || ''}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                ></textarea>
                                <button
                                    onClick={handleAddNote}
                                    disabled={!adminNote || isAddingNote}
                                    className="w-full mt-2 py-2 border border-gray-200 rounded-md text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isAddingNote ? 'Saving...' : 'Update Note'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
