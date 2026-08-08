"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    FiHome, FiShoppingBag, FiUsers,
    FiGrid, FiLogOut, FiMenu, FiX, FiChevronDown,
    FiShoppingCart, FiUser, FiChevronLeft,
    FiLayout, FiBarChart2, FiTag, FiStar, FiTrendingUp,
    FiBell, FiSearch, FiCreditCard,
} from 'react-icons/fi';
import BrandLogo from '@/components/shared/BrandLogo';
import { useTheme } from '@/components/shared/ThemeProvider';
import { useAppDispatch } from '@/redux';
import { logout } from '@/redux/slices/authSlice';

interface AdminLayoutProps { children: React.ReactNode; }

const SIDEBAR_W = 248;

/* One flat list — the old MAIN / COMMERCE / … captions added noise without
   helping anyone find anything. `divider` draws a hairline above an item to
   keep the groups readable. */
type MenuItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    submenu?: { name: string; href: string }[];
    divider?: boolean;
};

const MENU: MenuItem[] = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: FiHome },
    { name: 'Report & Analysis', href: '/dashboard/admin/analytics', icon: FiBarChart2 },

    { name: 'Orders', href: '/dashboard/admin/orders', icon: FiShoppingCart, divider: true },
    {
        name: 'Products', href: '/dashboard/admin/products', icon: FiShoppingBag,
        submenu: [
            { name: 'All Products', href: '/dashboard/admin/products' },
            { name: 'Add Product', href: '/dashboard/admin/products/new' },
        ],
    },
    { name: 'Categories', href: '/dashboard/admin/categories', icon: FiGrid },
    { name: 'Top Selling', href: '/dashboard/admin/top-selling', icon: FiTrendingUp },
    { name: 'Coupons', href: '/dashboard/admin/coupons', icon: FiTag },
    { name: 'Payments', href: '/dashboard/admin/payments', icon: FiCreditCard },

    { name: 'Users & Admins', href: '/dashboard/admin/customers', icon: FiUsers, divider: true },
    { name: 'Reviews', href: '/dashboard/admin/reviews', icon: FiStar },

    {
        // Mirrors the tabs inside the Site Content page — keep the ?tab= keys in
        // sync with TABS there.
        name: 'Site Content', href: '/dashboard/admin/site-content', icon: FiLayout, divider: true,
        submenu: [
            { name: 'Hero Slides', href: '/dashboard/admin/site-content?tab=hero' },
            { name: 'Navigation Menu', href: '/dashboard/admin/site-content?tab=navMenu' },
            { name: 'Home Sections', href: '/dashboard/admin/site-content?tab=homeSections' },
            { name: 'Contact Page', href: '/dashboard/admin/site-content?tab=contact' },
            { name: 'Payment Numbers', href: '/dashboard/admin/site-content?tab=payment' },
            { name: 'Floating Widget', href: '/dashboard/admin/site-content?tab=floating' },
            { name: 'Footer', href: '/dashboard/admin/site-content?tab=footer' },
            { name: 'Social Links', href: '/dashboard/admin/site-content?tab=social' },
            { name: 'Legal Pages', href: '/dashboard/admin/site-content?tab=legal' },
        ],
    },
    { name: 'Profile', href: '/dashboard/admin/profile', icon: FiUser },
];

const AdminLayoutInner: React.FC<AdminLayoutProps> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { logoUrl } = useTheme();

    // Some sub menus differ only by ?tab=…, so matching needs the query too
    const qs = searchParams.toString();
    const currentUrl = qs ? `${pathname}?${qs}` : pathname;

    useEffect(() => { setMobileOpen(false); }, [pathname]);

    useEffect(() => {
        MENU.forEach((item) => {
            if (item.submenu?.some(s => currentUrl.startsWith(s.href.split('?')[0]))) setExpandedMenu(item.name);
        });
    }, [currentUrl]);

    // Clear the store too — wiping only localStorage left the session in Redux
    const handleLogout = () => { dispatch(logout()); router.push('/'); };

    const isActive = (href: string) => {
        if (href.includes('?')) return currentUrl === href;
        return pathname === href;
    };
    const isParentActive = (item: MenuItem) =>
        item.submenu
            ? item.submenu.some(s => pathname === s.href.split('?')[0])
            : pathname === item.href;

    const Sidebar = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

            {/* Brand */}
            <div style={{
                height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 18px', borderBottom: '1px solid #f1f3f5', flexShrink: 0,
            }}>
                <Link href="/dashboard/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span className="inline-flex items-center justify-center rounded-lg bg-black px-2.5 py-1.5 ring-1 ring-[#E5C158]/30">
                        <BrandLogo src={logoUrl} alt="PremiuGlobal" className="h-9 w-auto object-contain" />
                    </span>
                    <span style={{
                        fontSize: '9px', fontWeight: 700, color: '#98a2b3',
                        textTransform: 'uppercase', letterSpacing: '0.9px',
                        border: '1px solid #e9ecef', borderRadius: '5px', padding: '2px 5px',
                        whiteSpace: 'nowrap',
                    }}>
                        Admin
                    </span>
                </Link>
                <button
                    className="lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#98a2b3', padding: '4px' }}
                >
                    <FiX size={18} />
                </button>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
                {MENU.map((item) => {
                    const hasSubmenu = !!item.submenu?.length;
                    const isExpanded = expandedMenu === item.name;
                    const highlighted = hasSubmenu ? isParentActive(item) : isActive(item.href);

                    return (
                        <div key={item.name}>
                            {item.divider && (
                                <div style={{ height: '1px', background: '#f1f3f5', margin: '10px 6px' }} />
                            )}

                            <Link
                                href={hasSubmenu ? '#' : item.href}
                                onClick={(e) => {
                                    if (hasSubmenu) { e.preventDefault(); setExpandedMenu(isExpanded ? null : item.name); }
                                }}
                                style={{
                                    position: 'relative',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
                                    background: highlighted ? 'var(--color-primary-lightest)' : 'transparent',
                                    color: highlighted ? 'var(--color-primary)' : '#475467',
                                    fontSize: '13.5px', fontWeight: highlighted ? 600 : 500,
                                    marginBottom: '2px',
                                    transition: 'background .15s, color .15s',
                                }}
                                onMouseEnter={e => { if (!highlighted) (e.currentTarget as HTMLElement).style.background = '#f8f9fb'; }}
                                onMouseLeave={e => { if (!highlighted) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                {highlighted && (
                                    <span style={{
                                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                                        width: '3px', height: '20px', borderRadius: '0 3px 3px 0',
                                        background: 'var(--color-primary)',
                                    }} />
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                    <item.icon size={17} />
                                    {item.name}
                                </span>
                                {hasSubmenu && (
                                    <FiChevronDown size={13} style={{
                                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                                        transition: 'transform .2s', opacity: 0.55,
                                    }} />
                                )}
                            </Link>

                            {hasSubmenu && isExpanded && (
                                <div style={{ marginLeft: '22px', paddingLeft: '13px', borderLeft: '1.5px solid #eceff2', margin: '2px 0 6px 22px' }}>
                                    {item.submenu!.map((sub) => (
                                        <Link key={sub.name} href={sub.href}
                                            style={{
                                                display: 'block', padding: '7px 10px', borderRadius: '7px',
                                                fontSize: '12.5px', textDecoration: 'none', marginBottom: '1px',
                                                color: isActive(sub.href) ? 'var(--color-primary)' : '#667085',
                                                fontWeight: isActive(sub.href) ? 600 : 500,
                                                background: isActive(sub.href) ? 'var(--color-primary-lightest)' : 'transparent',
                                            }}
                                        >
                                            {sub.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px', borderTop: '1px solid #f1f3f5', flexShrink: 0 }}>
                <button onClick={handleLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '11px',
                        padding: '10px 12px', borderRadius: '10px', background: 'none',
                        border: 'none', cursor: 'pointer', color: '#667085', fontSize: '13.5px', fontWeight: 500,
                        transition: 'all .15s',
                    }}
                    onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = '#fef3f2'; t.style.color = '#d92d20'; }}
                    onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = 'transparent'; t.style.color = '#667085'; }}
                >
                    <FiLogOut size={17} /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="admin-shell" style={{ minHeight: '100vh', background: '#f7f8fa' }}>

            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.45)', zIndex: 99, backdropFilter: 'blur(3px)' }}
                />
            )}

            {/* Desktop sidebar */}
            <div
                className="hidden lg:block"
                style={{
                    position: 'fixed', top: 0, left: 0, width: `${SIDEBAR_W}px`, height: '100vh',
                    borderRight: '1px solid #eceff2', zIndex: 50, overflow: 'hidden',
                }}
            >
                <Sidebar />
            </div>

            {/* Mobile sidebar */}
            <div
                className="lg:hidden"
                style={{
                    position: 'fixed', top: 0, left: 0, width: '270px', height: '100vh',
                    borderRight: '1px solid #eceff2', zIndex: 100,
                    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform .25s ease',
                    boxShadow: mobileOpen ? '4px 0 24px rgba(16,24,40,0.12)' : 'none',
                }}
            >
                <Sidebar />
            </div>

            {/* Main */}
            <div className="lg:ml-[248px]" style={{ minHeight: '100vh' }}>
                <header style={{
                    height: '68px', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid #eceff2',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 24px', position: 'sticky', top: 0, zIndex: 40,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475467', padding: '4px' }}
                        >
                            <FiMenu size={20} />
                        </button>

                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden md:flex">
                            <FiSearch size={15} style={{ position: 'absolute', left: '13px', color: '#98a2b3' }} />
                            <input
                                type="text"
                                placeholder="Search orders, products, customers…"
                                style={{
                                    width: '340px', padding: '9px 14px 9px 37px',
                                    background: '#f4f5f7', border: '1px solid transparent',
                                    borderRadius: '10px', fontSize: '13px', color: '#344054',
                                    outline: 'none', transition: 'all .2s',
                                }}
                                onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#d0d5dd'; }}
                                onBlur={e => { e.target.style.background = '#f4f5f7'; e.target.style.borderColor = 'transparent'; }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button style={{
                            position: 'relative', background: 'none', border: 'none',
                            cursor: 'pointer', color: '#667085', padding: '8px', borderRadius: '9px',
                        }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f4f5f7'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                            <FiBell size={18} />
                            <span style={{
                                position: 'absolute', top: '5px', right: '5px',
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: '#f04438', border: '2px solid #fff',
                            }} />
                        </button>

                        <div style={{ width: '1px', height: '22px', background: '#eceff2' }} />

                        <Link href="/" style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            fontSize: '12.5px', fontWeight: 600, color: '#475467',
                            textDecoration: 'none', padding: '7px 12px', borderRadius: '9px',
                        }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f4f5f7'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                            <FiChevronLeft size={14} /> View Store
                        </Link>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', paddingLeft: '4px' }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--color-primary), #1a6b3c)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', fontWeight: 700, color: '#fff',
                            }}>A</div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#344054' }} className="hidden sm:inline">Admin</span>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '26px', minHeight: 'calc(100vh - 68px)' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

/* useSearchParams needs a Suspense boundary above it. The admin area is
   client-only behind AuthGuard anyway, so nothing is lost here. */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f7f8fa' }} />}>
        <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
);

export default AdminLayout;
