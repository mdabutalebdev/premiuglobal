"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiMenu, FiShoppingCart, FiSearch, FiUser } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/redux';
import { toggleMobileMenu, openCartModal, openSearchModal } from '@/redux/slices/uiSlice';

const ACCENT = 'var(--filter-accent)';

/**
 * Sticky bottom navigation for phones/tablets — Home · Menu · Cart · Search ·
 * Account, matching the reference storefront's mobile UX. Hidden on lg+ so the
 * desktop layout is untouched.
 */
const MobileBottomNav: React.FC = () => {
    const dispatch = useAppDispatch();
    const pathname = usePathname();
    const cartCount = useAppSelector((s) => s.cart.items.length);
    const { isAuthenticated } = useAppSelector((s) => s.auth);

    const homeActive = pathname === '/';
    const accountActive = pathname.startsWith('/dashboard') || pathname.startsWith('/login');
    const accountHref = isAuthenticated ? '/dashboard/user' : '/login';

    const base = 'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10.5px] font-semibold transition-colors';
    const col = (active: boolean) => (active ? { color: ACCENT } : { color: '#6b7280' });

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] h-[58px] bg-white border-t border-gray-200 flex items-stretch"
            style={{ boxShadow: '0 -2px 12px rgba(0,0,0,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <Link href="/" className={base} style={col(homeActive)}>
                <FiHome size={20} />
                Home
            </Link>

            <button type="button" onClick={() => dispatch(toggleMobileMenu())} className={base} style={col(false)}>
                <FiMenu size={20} />
                Menu
            </button>

            <button type="button" onClick={() => dispatch(openCartModal())} className={base} style={col(false)}>
                <span className="relative">
                    <FiShoppingCart size={20} />
                    {cartCount > 0 && (
                        <span
                            className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                            style={{ background: ACCENT }}
                        >
                            {cartCount}
                        </span>
                    )}
                </span>
                Cart
            </button>

            <button type="button" onClick={() => dispatch(openSearchModal())} className={base} style={col(false)}>
                <FiSearch size={20} />
                Search
            </button>

            <Link href={accountHref} className={base} style={col(accountActive)}>
                <FiUser size={20} />
                Account
            </Link>
        </nav>
    );
};

export default MobileBottomNav;
