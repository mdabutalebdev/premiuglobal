"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
    FiUser, FiHeart, FiShoppingCart, FiMapPin,
    FiMenu, FiX, FiChevronDown, FiInfo, FiHelpCircle, FiPhoneCall,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { useAppSelector, useAppDispatch } from '@/redux';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { clearImageSearch } from '@/redux/slices/imageSearchSlice';
import { openCartModal, toggleMobileMenu, closeMobileMenu } from '@/redux/slices/uiSlice';
import { logout } from '@/redux/slices/authSlice';
import { useTheme } from '@/components/shared/ThemeProvider';
import SearchBox from './SearchBox';
import BrandLogo from '@/components/shared/BrandLogo';

const BRAND_ORANGE = '#F47B20';
const NAV_BG = '#0C2E20';
const ACTION_FG = '#1F3347';

interface Category {
    _id: string;
    name: string;
    slug: string;
    parent?: { _id: string } | string | null;
    showInMenu?: boolean;
}

interface NavItem {
    name: string;
    href: string;
    children: { name: string; href: string }[];
}



// The "More" menu. `phone`/`whatsapp` entries get their href from site content
// at render time, so an admin changing the number updates this menu too.
type MoreLink = {
    label: string;
    href?: string;
    dynamic?: 'phone' | 'whatsapp';
    icon: IconType;
    external?: boolean;
};

const MORE_LINKS: MoreLink[] = [
    { label: 'About Us', href: '/about', icon: FiInfo },
    { label: 'Faqs', href: '/faq', icon: FiHelpCircle },
    { label: 'Call Us', dynamic: 'phone', icon: FiPhoneCall, external: true },
    { label: 'WhatsApp', dynamic: 'whatsapp', icon: FaWhatsapp, external: true },
];

const parentIdOf = (c: Category): string | null => {
    if (!c.parent) return null;
    return typeof c.parent === 'string' ? c.parent : c.parent._id;
};

const Header: React.FC = () => {
    // Mobile menu open state lives in Redux so the bottom nav's "Menu" button
    // opens this same category drawer.
    const isMobileMenuOpen = useAppSelector((state) => state.ui.isMobileMenuOpen);
    const [openNav, setOpenNav] = useState<string | null>(null);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const moreRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const cartItems = useAppSelector((state) => state.cart.items);
    const wishlistItems = useAppSelector((state) => state.wishlist.items);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const avatarUrl = (user as any)?.avatar as string | undefined;
    const dispatch = useAppDispatch();
    const router = useRouter();
    const closeMobile = () => dispatch(closeMobileMenu());
    const toggleMobile = () => dispatch(toggleMobileMenu());

    const { data: categoriesData } = useGetCategoriesQuery({});
    const categories: Category[] = useMemo(() => categoriesData?.data || [], [categoriesData]);

    // Contact details for the "More" menu — same source the footer uses
    const { data: siteRes } = useGetSiteContentQuery(undefined);
    const contactPhone: string = siteRes?.data?.contact?.phone || '01571541370';
    const waDigits = (siteRes?.data?.contact?.whatsapp || siteRes?.data?.floating?.whatsapp || '8801571541370').replace(/\D/g, '');
    const moreHref = (l: MoreLink) => {
        if (l.dynamic === 'phone') return `tel:${contactPhone.replace(/\s+/g, '')}`;
        if (l.dynamic === 'whatsapp') return `https://wa.me/${waDigits}`;
        return l.href || '#';
    };

    // The green nav bar is category-driven: every category with "Show in Menu" on
    // becomes an item and its subcategories become the dropdown, so creating a
    // category is all it takes to get it into the menu. Items an admin hand-builds
    // in Admin → Site Content → Navigation Menu sit *alongside* that list — their
    // `position` decides whether they land before or after the categories.
    const navItems: NavItem[] = useMemo(() => {
        // The API already sorts by level → order → name, so filtering preserves
        // the order set on the Categories page.
        const inMenu = categories.filter((c) => c.showInMenu !== false);
        const autoItems: NavItem[] = inMenu
            .filter((c) => !parentIdOf(c))
            .map((top) => ({
                name: top.name,
                href: `/products?category=${top._id}`,
                children: inMenu
                    .filter((c) => parentIdOf(c) === top._id)
                    .map((child) => ({
                        name: child.name,
                        href: `/products?category=${top._id}&subcategory=${child._id}`,
                    })),
            }));

        const custom = ((siteRes?.data?.navMenu || []) as any[])
            .filter((m) => m.active !== false && m.label)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((m) => ({
                before: m.position === 'before',
                item: {
                    name: m.label,
                    href: m.href || '#',
                    children: (m.children || [])
                        .filter((c: any) => c.active !== false && c.label)
                        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                        .map((c: any) => ({ name: c.label, href: c.href || '#' })),
                } as NavItem,
            }));

        return [
            ...custom.filter((c) => c.before).map((c) => c.item),
            ...autoItems,
            ...custom.filter((c) => !c.before).map((c) => c.item),
        ];
    }, [categories, siteRes]);

    // Current URL, used to highlight the active menu item. Read from the browser
    // rather than useSearchParams — that hook would opt every page into CSR.
    const pathname = usePathname();
    const [currentUrl, setCurrentUrl] = useState('');
    useEffect(() => {
        setCurrentUrl(window.location.pathname + window.location.search);
    }, [pathname]);

    const isActiveHref = (href: string) => {
        if (!href || href === '#' || !currentUrl) return false;
        if (href === currentUrl) return true;
        // A parent stays lit while one of its subcategory pages is open
        const [path, query] = href.split('?');
        if (!query) return currentUrl.split('?')[0] === path;
        return currentUrl.startsWith(path) && query.split('&').every((p) => currentUrl.includes(p));
    };

    // Close the dropdowns on any outside click.
    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) setIsMoreOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        setIsProfileOpen(false);
        router.push('/');
    };

    const openNavMenu = (name: string) => {
        if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
        setOpenNav(name);
    };
    const closeNavMenu = () => {
        navTimeoutRef.current = setTimeout(() => setOpenNav(null), 140);
    };

    return (
        <header className="sticky top-0 z-50 shadow-sm">

            {/* ═══════════ ROW 1 — logo · search · actions ═══════════ */}
            <div className="bg-white">
                <div className="mx-auto max-w-[1500px] px-4 lg:px-8">
                    <div className="relative flex items-center gap-4 h-[64px] md:h-[72px] lg:h-[88px]">

                        {/* Mobile menu toggle */}
                        <button
                            className="lg:hidden -ml-1 p-2 rounded-md hover:bg-gray-100 transition-colors"
                            style={{ color: ACTION_FG }}
                            onClick={toggleMobile}
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                        </button>

                        {/* Logo — centered on phones (like the reference), static on md+ */}
                        <Link
                            href="/"
                            className="shrink-0 max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2"
                            onClick={() => dispatch(clearImageSearch())}
                        >
                            <HeaderLogo />
                        </Link>

                        {/* Search — 446×47 grey field with a live product dropdown */}
                        <div className="hidden md:flex flex-1 justify-center px-4">
                            <SearchBox className="w-full max-w-[446px]" />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-5 lg:gap-8 ml-auto shrink-0">

                            <ActionItem href="/track-order" label="Track Order" className="hidden sm:flex">
                                <FiMapPin size={22} />
                            </ActionItem>

                            {/* Sign in / account */}
                            {isAuthenticated && user ? (
                                <div className="relative hidden sm:block" ref={profileRef}>
                                    <button
                                        onClick={() => setIsProfileOpen((v) => !v)}
                                        className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                                        style={{ color: ACTION_FG }}
                                    >
                                        {avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                            <FiUser size={22} />
                                        )}
                                        <span className="text-[12px] leading-none max-w-[70px] truncate">
                                            {user.name?.split(' ')[0] || 'Account'}
                                        </span>
                                    </button>
                                    {isProfileOpen && (
                                        <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                                <p className="text-sm font-bold text-gray-800 truncate">{user.name || 'User'}</p>
                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <Link href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>Dashboard</Link>
                                            <Link href="/dashboard/user/orders" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsProfileOpen(false)}>My Orders</Link>
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 border-t border-gray-100">Logout</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <ActionItem href="/login" label="Sign In" className="hidden sm:flex">
                                    <FiUser size={22} />
                                </ActionItem>
                            )}

                            <ActionItem href="/wishlist" label="Wishlist" className="hidden sm:flex">
                                <span className="relative">
                                    <FiHeart size={22} />
                                    {wishlistItems.length > 0 && (
                                        <span
                                            className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                                            style={{ background: BRAND_ORANGE }}
                                        >
                                            {wishlistItems.length}
                                        </span>
                                    )}
                                </span>
                            </ActionItem>

                            {/* Opens the slide-in cart panel rather than a cart page */}
                            <button
                                onClick={() => dispatch(openCartModal())}
                                aria-label="Open cart"
                                className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                                style={{ color: ACTION_FG }}
                            >
                                <span className="relative">
                                    <FiShoppingCart size={22} />
                                    <span
                                        className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                                        style={{ background: BRAND_ORANGE }}
                                    >
                                        {cartItems.length}
                                    </span>
                                </span>
                                <span className="text-[12px] leading-none">Cart</span>
                            </button>

                            {/* More */}
                            <div className="relative hidden sm:block" ref={moreRef}>
                                <button
                                    onClick={() => setIsMoreOpen((v) => !v)}
                                    className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                                    style={{ color: ACTION_FG }}
                                >
                                    <FiMenu size={22} />
                                    <span className="text-[12px] leading-none">More</span>
                                </button>
                                {isMoreOpen && (
                                    <div className="absolute right-0 top-full mt-3 w-[260px] bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden z-50">
                                        {MORE_LINKS.map((l) => {
                                            const href = moreHref(l);
                                            const body = (
                                                <>
                                                    <l.icon size={19} className="shrink-0 text-[#1F3347]" />
                                                    <span>{l.label}</span>
                                                </>
                                            );
                                            const cls = 'flex items-center gap-3.5 px-5 py-3.5 text-[15px] text-gray-700 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 hover:text-[var(--filter-accent)] transition-colors';
                                            return l.external ? (
                                                <a
                                                    key={l.label}
                                                    href={href}
                                                    target={l.dynamic === 'whatsapp' ? '_blank' : undefined}
                                                    rel={l.dynamic === 'whatsapp' ? 'noopener noreferrer' : undefined}
                                                    className={cls}
                                                    onClick={() => setIsMoreOpen(false)}
                                                >
                                                    {body}
                                                </a>
                                            ) : (
                                                <Link
                                                    key={l.label}
                                                    href={href}
                                                    className={cls}
                                                    onClick={() => setIsMoreOpen(false)}
                                                >
                                                    {body}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* No separate mobile search bar — phones search from the bottom
                        nav, tablet/desktop use the search field in the row above. */}
                </div>
            </div>

            {/* ═══════════ ROW 2 — category nav ═══════════ */}
            <nav style={{ background: NAV_BG }} className="hidden lg:block">
                <div className="mx-auto max-w-[1700px] px-4 lg:px-6">
                    {/* Wraps instead of scrolling: a centred flex row that overflows gets
                        clipped on BOTH edges and the first item can never be scrolled
                        back into view, which is how the end categories went missing. */}
                    <ul className="flex flex-wrap items-center justify-center gap-x-5 xl:gap-x-7 min-h-[44px] text-white text-[14px] xl:text-[14.5px] whitespace-nowrap">
                        {navItems.map((item) => {
                            // A parent also counts as active while one of its children is open
                            const active = isActiveHref(item.href) || item.children.some((c) => isActiveHref(c.href));
                            return (
                                <li
                                    key={item.name}
                                    className="relative h-[44px] flex items-center"
                                    onMouseEnter={() => item.children.length && openNavMenu(item.name)}
                                    onMouseLeave={closeNavMenu}
                                >
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-1.5 h-full transition-colors hover:text-[var(--filter-accent)]"
                                        style={active ? { color: 'var(--filter-accent)' } : undefined}
                                    >
                                        {item.name}
                                        {item.children.length > 0 && (
                                            <FiChevronDown
                                                size={14}
                                                className={`transition-transform duration-200 ${openNav === item.name ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </Link>

                                    {item.children.length > 0 && openNav === item.name && (
                                        <div
                                            className="absolute left-0 top-full min-w-[220px] bg-white border border-[#eeeeee] z-50"
                                            onMouseEnter={() => openNavMenu(item.name)}
                                            onMouseLeave={closeNavMenu}
                                        >
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.href + child.name}
                                                    href={child.href}
                                                    className="block px-3 py-2.5 text-[14px] text-[#222831] hover:text-[var(--filter-accent)] transition-colors"
                                                    onClick={() => setOpenNav(null)}
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            {/* ═══════════ Mobile drawer ═══════════ */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 max-h-[70vh] overflow-y-auto">
                    <div className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-2 pb-3 mb-2 border-b border-gray-100">
                            <MobileLink href="/track-order" label="Track Order" onClick={() => closeMobile()} />
                            <MobileLink href={isAuthenticated ? '/dashboard/user' : '/login'} label={isAuthenticated ? 'My Account' : 'Sign In'} onClick={() => closeMobile()} />
                            <MobileLink href="/wishlist" label="Wishlist" onClick={() => closeMobile()} />
                            <button
                                onClick={() => { closeMobile(); dispatch(openCartModal()); }}
                                className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700 text-center"
                            >
                                Cart ({cartItems.length})
                            </button>
                        </div>

                        {navItems.map((item) => (
                            <div key={item.name} className="border-b border-gray-50">
                                <Link
                                    href={item.href}
                                    className="block py-2.5 text-[15px]"
                                    style={{ color: isActiveHref(item.href) ? 'var(--filter-accent)' : '#374151' }}
                                    onClick={() => closeMobile()}
                                >
                                    {item.name}
                                </Link>
                                {item.children.length > 0 && (
                                    <div className="pl-4 pb-2">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href + child.name}
                                                href={child.href}
                                                className="block py-1.5 text-[14px]"
                                                style={{ color: isActiveHref(child.href) ? 'var(--filter-accent)' : '#6b7280' }}
                                                onClick={() => closeMobile()}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="pt-3 mt-1 border-t border-gray-100">
                            {MORE_LINKS.map((l) => (
                                <a
                                    key={l.label}
                                    href={moreHref(l)}
                                    target={l.dynamic === 'whatsapp' ? '_blank' : undefined}
                                    rel={l.dynamic === 'whatsapp' ? 'noopener noreferrer' : undefined}
                                    className="flex items-center gap-2.5 py-2 text-sm text-gray-500"
                                    onClick={() => closeMobile()}
                                >
                                    <l.icon size={16} className="shrink-0" />
                                    {l.label}
                                </a>
                            ))}
                            {isAuthenticated && (
                                <button onClick={handleLogout} className="block py-2 text-sm text-red-500">Logout</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

/* Icon-over-label action used in the top-right cluster */
function ActionItem({
    href, label, children, className = '',
}: {
    href: string; label: string; children: React.ReactNode; className?: string;
}) {
    return (
        <Link
            href={href}
            className={`flex flex-col items-center gap-1 hover:opacity-70 transition-opacity ${className}`}
            style={{ color: ACTION_FG }}
        >
            {children}
            <span className="text-[12px] leading-none">{label}</span>
        </Link>
    );
}

function MobileLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700 text-center"
        >
            {label}
        </Link>
    );
}

/* Logo comes from the theme so admins can swap it without a deploy */
function HeaderLogo() {
    const { logoUrl } = useTheme();
    // eslint-disable-next-line @next/next/no-img-element
    return (
        <BrandLogo
            src={logoUrl}
            alt="Premium"
            /* Row is h-64/72/88 — these heights keep the logo comfortably inside
               the row, so the header height is unchanged. */
            className="h-[100px] md:h-[120px] lg:h-[150px] w-auto object-contain"
        />
    );
}

export default Header;
