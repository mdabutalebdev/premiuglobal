"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'user';
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
    const { isAuthenticated, user, token, isRestoring } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();

    useEffect(() => {
        // A reload starts with an empty store — wait for the saved session to be
        // read back before deciding anyone is logged out, or every refresh
        // bounces the user to /login.
        if (isRestoring) return;

        if (!isAuthenticated || !token) {
            router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
        }

        // Check role requirement
        if (requiredRole && user?.role !== requiredRole) {
            router.replace('/');
            return;
        }
    }, [isRestoring, isAuthenticated, token, user, requiredRole, router]);

    // Show the spinner while restoring and while redirecting
    if (isRestoring || !isAuthenticated || !token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Wrong role
    if (requiredRole && user?.role !== requiredRole) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 font-bold text-lg">Access Denied</p>
                    <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthGuard;
