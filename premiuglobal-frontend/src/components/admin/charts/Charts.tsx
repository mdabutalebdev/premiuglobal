"use client";

import React, { useEffect, useRef, useState } from 'react';

/**
 * Hand-rolled SVG charts for the admin dashboard. No charting dependency:
 * the shapes here are simple, and this keeps the admin bundle small and the
 * styling under our own control.
 */

/** Width of the container, so the SVG can be drawn at true pixel size. */
function useWidth<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const measure = () => setWidth(el.clientWidth);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return { ref, width };
}

const niceCeil = (n: number) => {
    if (n <= 0) return 10;
    const pow = Math.pow(10, Math.floor(Math.log10(n)));
    return Math.ceil(n / pow) * pow;
};

export type Point = { label: string; value: number; extra?: number };

/* ── Area + line chart ───────────────────────────────────────────── */
export function AreaChart({
    data,
    color = '#16a34a',
    height = 260,
    formatValue = (n: number) => String(n),
}: {
    data: Point[];
    color?: string;
    height?: number;
    formatValue?: (n: number) => string;
}) {
    const { ref, width } = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);

    const padL = 56, padR = 16, padT = 16, padB = 30;
    const w = Math.max(width, 320);
    const innerW = w - padL - padR;
    const innerH = height - padT - padB;

    const max = niceCeil(Math.max(...data.map(d => d.value), 0));
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
    const x = (i: number) => padL + (data.length > 1 ? i * stepX : innerW / 2);
    const y = (v: number) => padT + innerH - (max ? (v / max) * innerH : 0);

    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
    const area = data.length
        ? `${line} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`
        : '';
    const gid = `grad-${color.replace('#', '')}`;

    return (
        <div ref={ref} style={{ width: '100%', position: 'relative' }}>
            {width > 0 && (
                <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
                    <defs>
                        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Grid + Y labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                        const gy = padT + innerH * (1 - t);
                        return (
                            <g key={t}>
                                <line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="#f1f1f1" strokeWidth="1" />
                                <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10" fill="#aaa">
                                    {formatValue(Math.round(max * t))}
                                </text>
                            </g>
                        );
                    })}

                    {area && <path d={area} fill={`url(#${gid})`} />}
                    {line && <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

                    {data.map((d, i) => (
                        <g key={i}>
                            <text x={x(i)} y={height - 10} textAnchor="middle" fontSize="10" fill="#aaa">{d.label}</text>
                            <circle
                                cx={x(i)} cy={y(d.value)}
                                r={hover === i ? 5 : 3.5}
                                fill="#fff" stroke={color} strokeWidth="2.5"
                            />
                            {/* Wide invisible target so the tooltip is easy to hit */}
                            <rect
                                x={x(i) - stepX / 2} y={padT} width={stepX || innerW} height={innerH}
                                fill="transparent"
                                onMouseEnter={() => setHover(i)}
                                onMouseLeave={() => setHover(null)}
                            />
                        </g>
                    ))}
                </svg>
            )}

            {hover !== null && data[hover] && (
                <div style={{
                    position: 'absolute',
                    left: Math.min(Math.max(x(hover) - 60, 0), w - 130),
                    top: Math.max(y(data[hover].value) - 58, 0),
                    background: '#111', color: '#fff', borderRadius: '8px',
                    padding: '7px 11px', fontSize: '11px', pointerEvents: 'none',
                    whiteSpace: 'nowrap', boxShadow: '0 6px 18px rgba(0,0,0,.18)',
                }}>
                    <div style={{ opacity: 0.65, fontSize: '10px' }}>{data[hover].label}</div>
                    <div style={{ fontWeight: 700 }}>{formatValue(data[hover].value)}</div>
                    {data[hover].extra !== undefined && (
                        <div style={{ opacity: 0.65, fontSize: '10px' }}>{data[hover].extra} orders</div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Donut chart ─────────────────────────────────────────────────── */
export function DonutChart({
    data,
    size = 190,
    thickness = 26,
    centerLabel,
    centerValue,
}: {
    data: { label: string; value: number; color: string }[];
    size?: number;
    thickness?: number;
    centerLabel?: string;
    centerValue?: string | number;
}) {
    const total = data.reduce((s, d) => s + d.value, 0);
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f2f2f2" strokeWidth={thickness} />
                    {total > 0 && data.map((d, i) => {
                        const len = (d.value / total) * c;
                        const seg = (
                            <circle
                                key={i}
                                cx={size / 2} cy={size / 2} r={r}
                                fill="none" stroke={d.color} strokeWidth={thickness}
                                strokeDasharray={`${len} ${c - len}`}
                                strokeDashoffset={-offset}
                            />
                        );
                        offset += len;
                        return seg;
                    })}
                </svg>
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: '#111', lineHeight: 1 }}>
                        {centerValue ?? total}
                    </span>
                    <span style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{centerLabel}</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1, minWidth: '140px' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: '#555', flex: 1 }}>{d.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>{d.value}</span>
                        <span style={{ fontSize: '11px', color: '#bbb', width: '36px', textAlign: 'right' }}>
                            {total ? Math.round((d.value / total) * 100) : 0}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Vertical bar chart ──────────────────────────────────────────── */
export function BarChart({
    data,
    colors,
    height = 230,
    formatValue = (n: number) => String(n),
}: {
    data: Point[];
    colors: string[];
    height?: number;
    formatValue?: (n: number) => string;
}) {
    const { ref, width } = useWidth<HTMLDivElement>();
    const [hover, setHover] = useState<number | null>(null);

    const padL = 56, padR = 10, padT = 12, padB = 34;
    const w = Math.max(width, 320);
    const innerW = w - padL - padR;
    const innerH = height - padT - padB;
    const max = niceCeil(Math.max(...data.map(d => d.value), 0));
    const slot = data.length ? innerW / data.length : innerW;
    const barW = Math.min(slot * 0.55, 46);

    return (
        <div ref={ref} style={{ width: '100%', position: 'relative' }}>
            {width > 0 && (
                <svg width={w} height={height} style={{ display: 'block' }}>
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                        const gy = padT + innerH * (1 - t);
                        return (
                            <g key={t}>
                                <line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="#f1f1f1" strokeWidth="1" />
                                <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10" fill="#aaa">
                                    {formatValue(Math.round(max * t))}
                                </text>
                            </g>
                        );
                    })}

                    {data.map((d, i) => {
                        const h = max ? (d.value / max) * innerH : 0;
                        const bx = padL + i * slot + (slot - barW) / 2;
                        const by = padT + innerH - h;
                        const label = d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label;
                        return (
                            <g key={i}
                                onMouseEnter={() => setHover(i)}
                                onMouseLeave={() => setHover(null)}
                            >
                                <rect
                                    x={bx} y={by} width={barW} height={Math.max(h, 2)}
                                    rx="6" fill={colors[i % colors.length]}
                                    opacity={hover === null || hover === i ? 1 : 0.45}
                                    style={{ transition: 'opacity .15s' }}
                                />
                                <text x={bx + barW / 2} y={height - 12} textAnchor="middle" fontSize="10" fill="#999">
                                    {label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            )}

            {hover !== null && data[hover] && (
                <div style={{
                    position: 'absolute',
                    left: Math.min(Math.max(padL + hover * slot + slot / 2 - 60, 0), w - 130),
                    top: 0,
                    background: '#111', color: '#fff', borderRadius: '8px',
                    padding: '7px 11px', fontSize: '11px', pointerEvents: 'none',
                    whiteSpace: 'nowrap', boxShadow: '0 6px 18px rgba(0,0,0,.18)',
                }}>
                    <div style={{ opacity: 0.65, fontSize: '10px' }}>{data[hover].label}</div>
                    <div style={{ fontWeight: 700 }}>{formatValue(data[hover].value)}</div>
                </div>
            )}
        </div>
    );
}
