"use client";
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiHome, FiShoppingBag } from 'react-icons/fi';

function SuccessContent() {
    const params = useSearchParams();
    const raw = params.get('order') || params.get('id') || '';
    // Show a short, readable tracking code derived from the real order id
    const trackingId = raw ? raw.slice(-10).toUpperCase() : '';

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center px-4 py-16">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-20 h-20 bg-[var(--color-primary-lightest)] rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="text-[var(--color-text-primary)]" size={44} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
                <p className="text-gray-500 mb-6">
                    Thank you for your order. We&apos;ve received it and will process it shortly.
                    You&apos;ll receive a confirmation soon.
                </p>
                {trackingId && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-500">Order Tracking ID</p>
                        <p className="text-lg font-bold text-[var(--color-text-primary)]">
                            #{trackingId}
                        </p>
                    </div>
                )}
                <div className="space-y-3">
                    <Link
                        href="/dashboard/user/orders"
                        className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] py-3 rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                        <FiShoppingBag size={18} /> View My Orders
                    </Link>
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                        <FiHome size={18} /> Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={null}>
            <SuccessContent />
        </Suspense>
    );
}
