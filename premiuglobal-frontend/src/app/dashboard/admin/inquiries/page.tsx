"use client";

import React, { useState, useEffect } from 'react';
import {
    FiMail, FiTrash2, FiSearch, FiCheckCircle, FiClock,
    FiX, FiMessageSquare, FiPackage, FiPhone, FiSend, FiDollarSign
} from 'react-icons/fi';
import {
    useGetInquiriesQuery,
    useUpdateInquiryStatusMutation,
    useDeleteInquiryMutation
} from '@/redux/api/inquiryApi';
import { toast } from 'react-hot-toast';

const TYPE_LABELS: Record<string, string> = { rfq: 'RFQ', product: 'Product', contact: 'Contact', expert: 'Expert' };

const InquiriesPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
    const [page, setPage] = useState(1);

    // Quote / reply form state
    const [replyText, setReplyText] = useState('');
    const [quotePrice, setQuotePrice] = useState('');

    const { data, isLoading, refetch } = useGetInquiriesQuery({
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        page,
        limit: 15,
    });

    const [updateStatus, { isLoading: isSaving }] = useUpdateInquiryStatusMutation();
    const [deleteInquiry] = useDeleteInquiryMutation();

    const inquiries = data?.data || [];
    const meta = data?.meta || {};

    // Sync the reply form whenever a different inquiry is opened
    useEffect(() => {
        setReplyText(selectedInquiry?.adminReply || '');
        setQuotePrice(selectedInquiry?.quotedPrice != null ? String(selectedInquiry.quotedPrice) : '');
    }, [selectedInquiry?._id]);

    const applyUpdate = async (id: string, payload: any, successMsg: string) => {
        try {
            const res = await updateStatus({ id, data: payload }).unwrap();
            toast.success(successMsg);
            refetch();
            if (selectedInquiry?._id === id) setSelectedInquiry((prev: any) => ({ ...prev, ...payload, ...(res?.data || {}) }));
        } catch {
            toast.error('Failed to update inquiry');
        }
    };

    const handleSendQuote = () => {
        if (!replyText.trim() && !quotePrice) {
            toast.error('Write a reply or enter a quoted price first');
            return;
        }
        applyUpdate(
            selectedInquiry._id,
            { status: 'replied', adminReply: replyText.trim(), quotedPrice: quotePrice === '' ? null : Number(quotePrice) },
            'Quote sent to customer'
        );
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this inquiry?')) return;
        try {
            await deleteInquiry(id).unwrap();
            toast.success('Inquiry deleted');
            refetch();
            if (selectedInquiry?._id === id) setSelectedInquiry(null);
        } catch {
            toast.error('Failed to delete');
        }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            replied: 'bg-green-100 text-green-700',
            closed: 'bg-gray-200 text-gray-600',
        };
        return map[status] || 'bg-gray-100 text-gray-600';
    };
    const avatarColor = (status: string) =>
        status === 'replied' ? 'bg-green-600' : status === 'closed' ? 'bg-gray-400' : 'bg-yellow-500';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inquiries & Quotations</h1>
                    <p className="text-sm text-gray-500 mt-1">Reply to customer inquiries and send RFQ quotations</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm font-bold text-yellow-700">
                        {inquiries.filter((i: any) => i.status === 'pending').length} Pending
                    </div>
                    <button onClick={() => refetch()} className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-all bg-white">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total', value: meta.total || inquiries.length, color: 'blue', icon: FiMessageSquare },
                    { label: 'Pending', value: inquiries.filter((i: any) => i.status === 'pending').length, color: 'yellow', icon: FiClock },
                    { label: 'Replied', value: inquiries.filter((i: any) => i.status === 'replied').length, color: 'green', icon: FiCheckCircle },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, product or message..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)] cursor-pointer"
                >
                    <option value="">All Types</option>
                    <option value="rfq">RFQ (Quotation)</option>
                    <option value="product">Product</option>
                    <option value="contact">Contact</option>
                    <option value="expert">Expert</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--color-primary)] cursor-pointer"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            <div className="flex gap-6">
                {/* Inquiry List */}
                <div className="flex-1 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading inquiries...</p>
                        </div>
                    ) : inquiries.length === 0 ? (
                        <div className="p-20 text-center">
                            <FiMail size={40} className="text-gray-200 mx-auto mb-4" />
                            <h3 className="font-bold text-gray-700">No inquiries found</h3>
                            <p className="text-sm text-gray-400 mt-1">Customer inquiries and RFQs will appear here</p>
                        </div>
                    ) : (
                        <div>
                            {inquiries.map((inq: any) => (
                                <div
                                    key={inq._id}
                                    onClick={() => setSelectedInquiry(inq)}
                                    className={`flex items-start gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all ${selectedInquiry?._id === inq._id ? 'bg-[var(--color-primary)]/5 border-l-4 border-l-[var(--color-primary)]' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(inq.status)}`}>
                                        {(inq.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-bold truncate ${inq.status === 'pending' ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {inq.name || 'Anonymous'}
                                            </p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${statusBadge(inq.status)}`}>
                                                {inq.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-primary)] font-medium truncate mt-0.5 flex items-center gap-1.5">
                                            {inq.type === 'rfq'
                                                ? <span className="px-1.5 py-0.5 bg-[var(--color-primary)]/10 rounded text-[9px] font-bold">RFQ</span>
                                                : <FiPackage size={10} />}
                                            {inq.product?.name || inq.subject || `${TYPE_LABELS[inq.type] || 'General'} inquiry`}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 truncate">{inq.message}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 flex-shrink-0">
                                        {new Date(inq.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50 text-sm">
                            <span className="text-gray-500">Page {page} of {meta.totalPages}</span>
                            <div className="flex gap-2">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-md bg-white disabled:opacity-40 hover:bg-gray-50">Prev</button>
                                <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-md bg-white disabled:opacity-40 hover:bg-gray-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {selectedInquiry && (
                    <div className="w-[400px] flex-shrink-0 bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden self-start sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">
                                {selectedInquiry.type === 'rfq' ? 'Quotation Request' : 'Inquiry Detail'}
                            </h3>
                            <button onClick={() => setSelectedInquiry(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-all text-gray-400">
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Customer Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase">Customer</h4>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center font-bold">
                                        {(selectedInquiry.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{selectedInquiry.name || 'Anonymous'}</p>
                                        {selectedInquiry.email && <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><FiMail size={10} /> {selectedInquiry.email}</p>}
                                        {selectedInquiry.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><FiPhone size={10} /> {selectedInquiry.phone}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase">{selectedInquiry.type === 'rfq' ? 'Request Details' : 'Message'}</h4>
                                <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedInquiry.message}</p>
                                </div>
                            </div>

                            {/* Attachments */}
                            {selectedInquiry.attachments?.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Attached Photos ({selectedInquiry.attachments.length})</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedInquiry.attachments.map((url: string, i: number) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-md overflow-hidden border border-gray-200 hover:opacity-90">
                                                <img src={url} alt={`attachment-${i}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-400">Received: {new Date(selectedInquiry.createdAt).toLocaleString('en-BD')}</p>

                            {/* ── Quote / Reply ── */}
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase">Send Quote / Reply</h4>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1">
                                        <FiDollarSign size={12} /> Quoted Price (optional)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        placeholder="e.g. 12500"
                                        value={quotePrice}
                                        onChange={(e) => setQuotePrice(e.target.value)}
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] bg-gray-50/50"
                                    />
                                </div>
                                <textarea
                                    rows={4}
                                    placeholder="Write your quotation / reply to the customer (price breakdown, delivery time, terms)..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] bg-gray-50/50 resize-none"
                                />
                                <button
                                    onClick={handleSendQuote}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-md text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-60"
                                >
                                    <FiSend size={15} /> {isSaving ? 'Sending...' : selectedInquiry.status === 'replied' ? 'Update Quote' : 'Send Quote'}
                                </button>
                                {selectedInquiry.status === 'replied' && selectedInquiry.repliedAt && (
                                    <p className="text-[11px] text-green-600 text-center">✓ Quote sent {new Date(selectedInquiry.repliedAt).toLocaleString('en-BD')}</p>
                                )}
                            </div>

                            {/* Secondary actions */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                {selectedInquiry.status !== 'closed' ? (
                                    <button
                                        onClick={() => applyUpdate(selectedInquiry._id, { status: 'closed' }, 'Marked as closed')}
                                        className="flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-600 rounded-md text-sm font-bold hover:bg-gray-50 transition-all"
                                    >
                                        <FiCheckCircle size={14} /> Close
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => applyUpdate(selectedInquiry._id, { status: 'pending' }, 'Reopened')}
                                        className="flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-600 rounded-md text-sm font-bold hover:bg-gray-50 transition-all"
                                    >
                                        <FiClock size={14} /> Reopen
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(selectedInquiry._id)}
                                    className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm font-bold hover:bg-red-100 transition-all"
                                >
                                    <FiTrash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InquiriesPage;
