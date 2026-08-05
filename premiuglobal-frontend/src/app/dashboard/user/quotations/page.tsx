"use client";

import React from 'react';
import Link from 'next/link';
import { FiFileText, FiClock, FiCheckCircle, FiTag, FiArrowRight } from 'react-icons/fi';
import { useGetMyInquiriesQuery } from '@/redux/api/inquiryApi';

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Awaiting Quote', icon: FiClock },
    replied: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Quote Received', icon: FiCheckCircle },
    closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Closed', icon: FiCheckCircle },
};

export default function MyQuotationsPage() {
    const { data, isLoading } = useGetMyInquiriesQuery({ limit: 50 });
    const items = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Quotations</h1>
                        <p className="text-sm text-gray-400 mt-1">Your quote requests and the prices we&apos;ve sent you</p>
                    </div>
                    <Link
                        href="/quotations"
                        className="px-5 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-all shadow-md shadow-[var(--color-primary)]/20 flex items-center gap-2"
                    >
                        <FiFileText size={16} />
                        New Quote Request
                    </Link>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
                            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
                    <FiFileText size={48} className="mx-auto text-gray-200 mb-4" />
                    <h3 className="text-lg font-bold text-gray-600 mb-1">No quotations yet</h3>
                    <p className="text-sm text-gray-400 mb-5">Request a quote and our team will send you the best price.</p>
                    <Link href="/quotations" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-all">
                        <FiFileText size={16} /> Request a Quote
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((q: any) => {
                        const sc = statusConfig[q.status] || statusConfig.pending;
                        const hasQuote = q.status === 'replied' && (q.adminReply || q.quotedPrice != null);
                        return (
                            <div key={q._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-5">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {q.type === 'rfq' && <span className="px-1.5 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] rounded text-[10px] font-bold">RFQ</span>}
                                                <p className="text-sm font-bold text-gray-800 truncate">
                                                    {q.product?.name || q.subject || 'Quotation Request'}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {new Date(q.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${sc.bg} ${sc.text}`}>
                                            <sc.icon size={12} /> {sc.label}
                                        </span>
                                    </div>

                                    {/* Request details */}
                                    <div className="bg-gray-50/70 rounded-xl p-3.5 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                                        {q.message}
                                    </div>

                                    {/* Attachments */}
                                    {q.attachments?.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                            {q.attachments.slice(0, 5).map((url: string, i: number) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quote from admin */}
                                {hasQuote ? (
                                    <div className="border-t border-emerald-100 bg-emerald-50/50 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiTag className="text-emerald-600" size={15} />
                                            <h4 className="text-xs font-bold text-emerald-700 uppercase">Our Quotation</h4>
                                        </div>
                                        {q.quotedPrice != null && (
                                            <p className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">৳{Number(q.quotedPrice).toLocaleString()}</p>
                                        )}
                                        {q.adminReply && <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{q.adminReply}</p>}
                                        <Link href="/" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[var(--color-text-primary)] hover:underline">
                                            Proceed to order <FiArrowRight size={14} />
                                        </Link>
                                    </div>
                                ) : q.status !== 'closed' ? (
                                    <div className="border-t border-gray-50 px-5 py-3 bg-gray-50/40">
                                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                            <FiClock size={12} /> Our team is preparing your quote — you&apos;ll see the price here soon.
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
