"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { loginSuccess } from '@/redux/slices/authSlice';
import { useLoginMutation } from '@/redux/api/authApi';
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import BrandLogo from '@/components/shared/BrandLogo';

const LoginPageInner = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const [login, { isLoading }] = useLoginMutation();

    const isExpired = searchParams.get('expired') === 'true';
    const redirectPath = searchParams.get('redirect');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isPhone = /^[0-9+\-\s()]{7,}$/.test(identifier.trim());
        const credentials = isPhone
            ? { phone: identifier.trim(), password }
            : { email: identifier.trim(), password };

        try {
            const res = await login(credentials).unwrap();
            const apiUser = res.data.user;
            const token = res.data.tokens.accessToken;
            const user = {
                id: apiUser._id || apiUser.id,
                name: apiUser.name || `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.email,
                email: apiUser.email,
                phone: apiUser.phone || '',
                role: apiUser.role || 'user',
                avatar: apiUser.avatar || '',
            };

            dispatch(loginSuccess({ user, token }));
            localStorage.setItem('token', token);
            toast.success('Login successful!');

            // ── Role-based redirect ──
            // Admin → admin dashboard. Everyone else → home
            // (or back to the page they came from, e.g. checkout).
            if (user.role === 'admin') {
                router.push('/dashboard/admin');
            } else {
                router.push(redirectPath || '/');
            }
        } catch (err: any) {
            toast.error(err?.data?.message || 'Invalid email/phone or password.', { duration: 4000 });
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">

            {/* Logo */}
            <Link href="/" className="flex justify-center mb-6">
                <BrandLogo src="/logo.jpg" alt="Premium" className="h-12 w-auto object-contain" />
            </Link>

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back — please sign in to continue</p>
            </div>

            {/* Session expired notice */}
            {isExpired && (
                <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <FiAlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-sm text-red-600">Your session expired. Please sign in again.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email or Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Phone Number</label>
                    <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="name@example.com or 01XXXXXXXXX"
                        autoComplete="username"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className="w-full px-3.5 py-2.5 pr-11 border border-gray-300 rounded-lg text-sm text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
                Don&apos;t have an account?{' '}
                <Link
                    href={redirectPath ? `/register?redirect=${encodeURIComponent(redirectPath)}` : '/register'}
                    className="font-semibold text-[var(--color-primary)] hover:underline"
                >
                    Create Account
                </Link>
            </p>
        </div>
    );
};

const LoginPage = () => (
    <Suspense fallback={<div className="text-center text-gray-500 py-10">Loading...</div>}>
        <LoginPageInner />
    </Suspense>
);

export default LoginPage;
