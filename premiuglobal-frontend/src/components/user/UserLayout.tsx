"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';
import {
    FiGrid,
    FiShoppingBag,
    FiUser,
    FiLogOut,
    FiMenu,
    FiX,
    FiChevronRight,
    FiChevronLeft,
    FiHome,
    FiPackage,
    FiHeart,
} from 'react-icons/fi';
import BrandLogo from '@/components/shared/BrandLogo';
import { useTheme } from '@/components/shared/ThemeProvider';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/user', icon: FiGrid },
    { label: 'My Orders', href: '/dashboard/user/orders', icon: FiShoppingBag },
    { label: 'Wishlist', href: '/dashboard/user/wishlist', icon: FiHeart },
    { label: 'Profile', href: '/dashboard/user/profile', icon: FiUser },
];

const UserLayout = ({ children }: { children: React.ReactNode }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const wishlistCount = useAppSelector((state: any) => state.wishlist.totalItems);
    const { logoUrl } = useTheme();
    const avatarUrl = (user as any)?.avatar as string | undefined;

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        router.push('/');
    };

    const isActive = (href: string) => {
        if (href === '/dashboard/user') return pathname === href;
        return pathname.startsWith(href);
    };

    const getInitials = () => {
        if (!user?.name) return 'U';
        const parts = user.name.split(' ');
        return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
    };

    return (
        <div className="min-h-screen bg-[#f8f9fb]">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        {/* Left: Logo + Back */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                            >
                                {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                            </button>
                            <Link href="/" className="flex items-center group">
                                <span className="inline-flex items-center justify-center rounded-lg bg-black px-2.5 py-1 ring-1 ring-[#E5C158]/30">
                                    <BrandLogo src={logoUrl} alt="PremiuGlobal" className="h-7 w-auto object-contain" />
                                </span>
                            </Link>
                        </div>

                        {/* Center: Breadcrumb */}
                        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                            <Link href="/" className="hover:text-[var(--color-text-primary)] transition-colors">
                                <FiHome size={14} />
                            </Link>
                            <FiChevronRight size={12} />
                            <span className="text-gray-700 font-semibold">My Account</span>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-all"
                            >
                                <FiChevronLeft size={14} />
                                Back to Store
                            </Link>
                            <div className="w-px h-5 bg-gray-100 hidden sm:block"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#ebebeb] flex items-center justify-center text-gray-700 text-xs font-bold">
                                    {avatarUrl
                                        // eslint-disable-next-line @next/next/no-img-element
                                        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                        : getInitials()}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-xs font-semibold text-gray-700 leading-none">{user?.name || 'User'}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="flex gap-6 xl:gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            {/* User Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[var(--color-primary)]/20">
                                        {avatarUrl
                                            // eslint-disable-next-line @next/next/no-img-element
                                            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                            : getInitials()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 truncate">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100 mb-3"></div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Member since 2024</p>
                            </div>

                            {/* Navigation */}
                            <nav className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="p-2">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                                isActive(item.href)
                                                    ? 'bg-[var(--filter-accent)] text-white shadow-md shadow-[var(--filter-accent)]/30'
                                                    : 'text-gray-500 hover:bg-[#f5f5f5] hover:text-gray-800'
                                            }`}
                                        >
                                            <item.icon size={18} />
                                            <span className="flex-1">{item.label}</span>
                                            {item.label === 'Wishlist' && wishlistCount > 0 && (
                                                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {wishlistCount}
                                                </span>
                                            )}
                                            {isActive(item.href) && item.label !== 'Wishlist' && (
                                                <FiChevronRight size={14} className="ml-auto" />
                                            )}
                                        </Link>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full"
                                    >
                                        <FiLogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </aside>

                    {/* Mobile Sidebar Overlay */}
                    {mobileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                            ></div>
                            <div className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl overflow-y-auto">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-bold shadow-md">
                                            {avatarUrl
                                                // eslint-disable-next-line @next/next/no-img-element
                                                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                : getInitials()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{user?.name || 'User'}</p>
                                            <p className="text-xs text-gray-400">{user?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                                <nav className="p-3">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all mb-1 ${
                                                isActive(item.href)
                                                    ? 'bg-[var(--filter-accent)] text-white shadow-md shadow-[var(--filter-accent)]/30'
                                                    : 'text-gray-600 hover:bg-[#f5f5f5]'
                                            }`}
                                        >
                                            <item.icon size={18} />
                                            <span className="flex-1">{item.label}</span>
                                            {item.label === 'Wishlist' && wishlistCount > 0 && (
                                                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {wishlistCount}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full"
                                    >
                                        <FiLogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </nav>
                            </div>
                        </>
                    )}

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default UserLayout;
