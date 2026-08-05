"use client";

import React from 'react';

/**
 * Shared building blocks for the admin panel. Every page is built from these so
 * the panel reads as one product instead of seventeen separate designs.
 *
 * Tokens (keep in sync with AdminLayout / AdminDashboard):
 *   text  #101828 heading · #475467 body · #667085 muted · #98a2b3 faint
 *   line  #eef0f2 card border · #f2f4f7 inner divider
 *   card  16px radius, 1px border, 0 1px 2px rgba(16,24,40,.04)
 */

export const T = {
    heading: '#101828',
    body: '#475467',
    muted: '#667085',
    faint: '#98a2b3',
    border: '#eef0f2',
    divider: '#f2f4f7',
    surface: '#fafbfc',
};

export const tint = (color: string, amount = '14') => `${color}${amount}`;

/* ── Card ─────────────────────────────────────────────────────────── */
export const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${T.border}`,
    borderRadius: '16px',
    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
};

export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: React.CSSProperties; padded?: boolean }) {
    return <div style={{ ...cardStyle, ...(padded ? { padding: '20px' } : { overflow: 'hidden' }), ...style }}>{children}</div>;
}

export function CardHeader({ title, subtitle, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: '12px', flexWrap: 'wrap', padding: '18px 20px', borderBottom: `1px solid ${T.divider}`,
        }}>
            <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: T.heading, margin: 0 }}>{title}</h3>
                {subtitle && <p style={{ fontSize: '12px', color: T.faint, margin: '2px 0 0' }}>{subtitle}</p>}
            </div>
            {actions && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
        </div>
    );
}

/* ── Page header ──────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.heading, margin: 0, letterSpacing: '-0.4px' }}>{title}</h1>
                {subtitle && <p style={{ fontSize: '13px', color: T.muted, margin: '4px 0 0' }}>{subtitle}</p>}
            </div>
            {actions && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
        </div>
    );
}

export function PageShell({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>{children}</div>;
}

/* ── Buttons ──────────────────────────────────────────────────────── */
type BtnProps = {
    children?: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'soft';
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
    color?: string;
    disabled?: boolean;
    type?: 'button' | 'submit';
    title?: string;
    style?: React.CSSProperties;
};

export function Btn({ children, onClick, variant = 'secondary', size = 'md', icon, color, disabled, type = 'button', title, style }: BtnProps) {
    const pad = size === 'sm' ? '7px 12px' : '9px 16px';
    const font = size === 'sm' ? '12.5px' : '13px';

    const variants: Record<string, React.CSSProperties> = {
        primary: { background: 'var(--color-primary)', color: 'var(--color-primary-foreground)', border: '1px solid transparent' },
        secondary: { background: '#fff', color: '#344054', border: '1px solid #e4e7ec' },
        danger: { background: '#fef3f2', color: '#d92d20', border: '1px solid #fecdca' },
        ghost: { background: 'transparent', color: T.muted, border: '1px solid transparent' },
        soft: { background: tint(color || '#3B82F6'), color: color || '#3B82F6', border: `1px solid ${tint(color || '#3B82F6', '33')}` },
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: pad, borderRadius: '10px', fontSize: font, fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
                whiteSpace: 'nowrap', transition: 'filter .15s',
                ...variants[variant], ...style,
            }}
        >
            {icon}{children}
        </button>
    );
}

/* Small square icon-only action, used inside table rows */
export function IconBtn({ icon, onClick, color = T.muted, title, disabled }: { icon: React.ReactNode; onClick?: () => void; color?: string; title?: string; disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: tint(color, '12'), color, border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
            }}
        >
            {icon}
        </button>
    );
}

/* ── Form controls ────────────────────────────────────────────────── */
export const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: '10px',
    border: '1px solid #d0d5dd', fontSize: '13px', color: '#344054',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
};

export function Field({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            {label && (
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: T.body, marginBottom: '6px' }}>
                    {label} {hint && <span style={{ color: T.faint, fontWeight: 400 }}>({hint})</span>}
                </label>
            )}
            {children}
        </div>
    );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', icon, width = '280px' }: {
    value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode; width?: string;
}) {
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width }}>
            {icon && <span style={{ position: 'absolute', left: '12px', color: T.faint, display: 'flex' }}>{icon}</span>}
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ ...inputStyle, paddingLeft: icon ? '36px' : '13px', background: '#fff' }}
            />
        </div>
    );
}

/* ── Badge ────────────────────────────────────────────────────────── */
export function Badge({ children, color = T.muted, subtle = true }: { children: React.ReactNode; color?: string; subtle?: boolean }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
            textTransform: 'capitalize', whiteSpace: 'nowrap',
            background: subtle ? tint(color) : color,
            color: subtle ? color : '#fff',
        }}>
            {children}
        </span>
    );
}

/* ── Table ────────────────────────────────────────────────────────── */
export function TableWrap({ children }: { children: React.ReactNode }) {
    return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table></div>;
}

export function Th({ children, align = 'left', width }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center'; width?: string }) {
    return (
        <th style={{
            textAlign: align, width,
            fontSize: '11px', fontWeight: 700, color: T.muted,
            textTransform: 'uppercase', letterSpacing: '0.4px',
            padding: '11px 18px', whiteSpace: 'nowrap', background: T.surface,
        }}>
            {children}
        </th>
    );
}

export function Td({ children, align = 'left', style }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center'; style?: React.CSSProperties }) {
    return (
        <td style={{ textAlign: align, padding: '13px 18px', fontSize: '13px', color: T.body, ...style }}>
            {children}
        </td>
    );
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    return (
        <tr
            onClick={onClick}
            style={{ borderTop: `1px solid ${T.divider}`, cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </tr>
    );
}

/* ── Tabs ─────────────────────────────────────────────────────────── */
export function Tabs<T extends string>({ items, active, onChange }: {
    items: { key: T; label: string; icon?: React.ElementType; count?: number }[];
    active: T;
    onChange: (k: T) => void;
}) {
    return (
        <div style={{ display: 'flex', gap: '4px', background: '#f2f4f7', borderRadius: '12px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
            {items.map(t => {
                const on = active === t.key;
                return (
                    <button key={t.key} onClick={() => onChange(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '7px',
                            padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600,
                            background: on ? '#fff' : 'transparent',
                            color: on ? T.heading : T.muted,
                            boxShadow: on ? '0 1px 3px rgba(16,24,40,0.08)' : 'none',
                        }}
                    >
                        {t.icon && <t.icon size={14} />}
                        {t.label}
                        {typeof t.count === 'number' && (
                            <span style={{
                                fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px',
                                background: on ? 'var(--color-primary-lightest)' : '#e4e7ec',
                                color: on ? 'var(--color-primary)' : T.muted,
                            }}>
                                {t.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Empty / loading ──────────────────────────────────────────────── */
export function EmptyState({ icon, title, text, action, height = 220 }: {
    icon?: React.ReactNode; title?: string; text?: string; action?: React.ReactNode; height?: number;
}) {
    return (
        <div style={{
            minHeight: height, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '30px',
        }}>
            {icon}
            {title && <p style={{ fontSize: '14px', fontWeight: 600, color: T.body, margin: 0 }}>{title}</p>}
            {text && <p style={{ fontSize: '12.5px', color: T.faint, margin: 0, textAlign: 'center' }}>{text}</p>}
            {action && <div style={{ marginTop: '6px' }}>{action}</div>}
        </div>
    );
}

export function Spinner({ size = 30, center = true }: { size?: number; center?: boolean }) {
    const el = (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: '3px solid #e4e7ec', borderTopColor: 'var(--color-primary)',
            animation: 'spin 0.8s linear infinite',
        }} />
    );
    if (!center) return el;
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>{el}</div>;
}

/* ── Stat tile ────────────────────────────────────────────────────── */
export function StatTile({ icon: Icon, label, value, color = '#3B82F6', sub }: {
    icon: React.ElementType; label: string; value: React.ReactNode; color?: string; sub?: string;
}) {
    return (
        <div style={{ ...cardStyle, padding: '16px', display: 'flex', alignItems: 'center', gap: '13px' }}>
            <span style={{
                width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
                background: tint(color), display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={19} color={color} />
            </span>
            <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: T.heading, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                    {value}
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {label}
                </span>
                {sub && <span style={{ display: 'block', fontSize: '11px', color: T.faint }}>{sub}</span>}
            </span>
        </div>
    );
}

export function StatGrid({ children, min = '190px' }: { children: React.ReactNode; min?: string }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`, gap: '14px' }}>
            {children}
        </div>
    );
}

/* ── Modal ────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, footer, width = '520px' }: {
    open: boolean; onClose: () => void; title: string;
    children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
    if (!open) return null;
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 200, padding: '20px',
                background: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff', borderRadius: '16px', width: '100%', maxWidth: width,
                    maxHeight: '88vh', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 20px 50px rgba(16,24,40,0.2)',
                }}
            >
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: T.heading, margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.faint, fontSize: '20px', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ padding: '22px', overflowY: 'auto' }}>{children}</div>
                {footer && (
                    <div style={{ padding: '16px 22px', borderTop: `1px solid ${T.divider}`, display: 'flex', justifyContent: 'flex-end', gap: '9px' }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Pagination ───────────────────────────────────────────────────── */
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
        return start + i;
    }).filter(p => p >= 1 && p <= totalPages);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '16px' }}>
            <Btn size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>Previous</Btn>
            {pages.map(p => (
                <button key={p} onClick={() => onChange(p)}
                    style={{
                        width: '34px', height: '34px', borderRadius: '9px', cursor: 'pointer',
                        fontSize: '12.5px', fontWeight: 600,
                        border: p === page ? '1px solid transparent' : '1px solid #e4e7ec',
                        background: p === page ? 'var(--color-primary)' : '#fff',
                        color: p === page ? 'var(--color-primary-foreground)' : T.body,
                    }}
                >
                    {p}
                </button>
            ))}
            <Btn size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next</Btn>
        </div>
    );
}
