"use client";

import UserLayout from '@/components/user/UserLayout';
import AuthGuard from '@/components/shared/AuthGuard';

export default function UserDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <UserLayout>{children}</UserLayout>
        </AuthGuard>
    );
}
