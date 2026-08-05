/**
 * GA4 Ecommerce tracking helpers.
 *
 * Implements the recommended ecommerce events from:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 *
 * The Measurement ID is read from NEXT_PUBLIC_GA_MEASUREMENT_ID. When it is not
 * set (or gtag.js has not loaded yet) every helper is a no-op, so it is safe to
 * call these from anywhere without guarding.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

/** Site currency — Premium prices are in Bangladeshi Taka (৳). */
export const GA_CURRENCY = 'BDT';

// ── gtag typing ──────────────────────────────────────────────────
declare global {
    interface Window {
        dataLayer: unknown[];
        gtag: (...args: unknown[]) => void;
    }
}

/** GA4 item as described in the ecommerce "items" array. */
export interface GaItem {
    item_id?: string;
    item_name?: string;
    affiliation?: string;
    coupon?: string;
    discount?: number;
    index?: number;
    item_brand?: string;
    item_category?: string;
    item_list_id?: string;
    item_list_name?: string;
    item_variant?: string;
    price?: number;
    quantity?: number;
}

/** True when gtag is loaded and a Measurement ID is configured. */
export const isGaEnabled = (): boolean =>
    typeof window !== 'undefined' &&
    !!GA_MEASUREMENT_ID &&
    typeof window.gtag === 'function';

/** Low-level: send a raw GA4 event. Safe no-op when GA is disabled. */
export function gaEvent(name: string, params: Record<string, unknown> = {}): void {
    if (!isGaEnabled()) return;
    window.gtag('event', name, params);
}

/** Register a client-side page_view (used on route change). */
export function gaPageview(url: string): void {
    if (!isGaEnabled()) return;
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

// ── Item mappers ─────────────────────────────────────────────────

/** Loose shape covering both the redux Product and backend product docs. */
type ProductLike = {
    _id?: string;
    id?: string | number;
    productId?: string;
    slug?: string;
    name?: string;
    title?: string;
    price?: number;
    sellingPrice?: number;
    mrp?: number;
    comparePrice?: number;
    brand?: string;
    category?: string | { name?: string } | null;
    color?: string;
    size?: string;
    variant?: string;
    quantity?: number;
};

const readCategory = (c: ProductLike['category']): string | undefined => {
    if (!c) return undefined;
    return typeof c === 'object' ? c.name : c;
};

const readVariant = (p: ProductLike): string | undefined => {
    const v = [p.color, p.size].filter(Boolean).join(' / ');
    return v || p.variant || undefined;
};

const num = (v: unknown): number | undefined =>
    typeof v === 'number' && !Number.isNaN(v) ? v : undefined;

/** Map any product-like object to a GA4 item, with optional overrides. */
export function toGaItem(p: ProductLike, extra: Partial<GaItem> = {}): GaItem {
    const price = num(p.price) ?? num(p.sellingPrice);
    const mrp = num(p.mrp) ?? num(p.comparePrice);
    const discount =
        price !== undefined && mrp !== undefined && mrp > price ? mrp - price : undefined;

    return {
        item_id: String(p._id ?? p.productId ?? p.id ?? ''),
        item_name: p.name ?? p.title ?? '',
        item_brand: p.brand,
        item_category: readCategory(p.category),
        item_variant: readVariant(p),
        price,
        discount,
        quantity: num(p.quantity),
        ...extra,
    };
}

/** Sum price × quantity across items (the GA4 "value"). */
export const itemsValue = (items: GaItem[]): number =>
    Number(
        items
            .reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
            .toFixed(2),
    );

// ── Recommended ecommerce events ─────────────────────────────────

export function trackViewItemList(
    items: GaItem[],
    listId?: string,
    listName?: string,
): void {
    gaEvent('view_item_list', {
        item_list_id: listId,
        item_list_name: listName,
        items: items.map((it, index) => ({ index, ...it })),
    });
}

export function trackSelectItem(
    item: GaItem,
    listId?: string,
    listName?: string,
): void {
    gaEvent('select_item', {
        item_list_id: listId,
        item_list_name: listName,
        items: [item],
    });
}

export function trackViewItem(item: GaItem): void {
    gaEvent('view_item', {
        currency: GA_CURRENCY,
        value: itemsValue([item]),
        items: [item],
    });
}

export function trackAddToCart(items: GaItem[]): void {
    gaEvent('add_to_cart', {
        currency: GA_CURRENCY,
        value: itemsValue(items),
        items,
    });
}

export function trackRemoveFromCart(items: GaItem[]): void {
    gaEvent('remove_from_cart', {
        currency: GA_CURRENCY,
        value: itemsValue(items),
        items,
    });
}

export function trackAddToWishlist(item: GaItem): void {
    gaEvent('add_to_wishlist', {
        currency: GA_CURRENCY,
        value: itemsValue([item]),
        items: [item],
    });
}

export function trackViewCart(items: GaItem[]): void {
    gaEvent('view_cart', {
        currency: GA_CURRENCY,
        value: itemsValue(items),
        items,
    });
}

export function trackBeginCheckout(items: GaItem[], coupon?: string): void {
    gaEvent('begin_checkout', {
        currency: GA_CURRENCY,
        value: itemsValue(items),
        coupon,
        items,
    });
}

export function trackAddShippingInfo(
    items: GaItem[],
    shippingTier?: string,
    coupon?: string,
): void {
    gaEvent('add_shipping_info', {
        currency: GA_CURRENCY,
        value: itemsValue(items),
        shipping_tier: shippingTier,
        coupon,
        items,
    });
}

export function trackAddPaymentInfo(
    items: GaItem[],
    paymentType?: string,
    coupon?: string,
): void {
    gaEvent('add_payment_info', {
        currency: GA_CURRENCY,
        value: itemsValue(items),
        payment_type: paymentType,
        coupon,
        items,
    });
}

export function trackPurchase(params: {
    transactionId: string;
    items: GaItem[];
    value?: number;
    tax?: number;
    shipping?: number;
    coupon?: string;
}): void {
    const { transactionId, items, value, tax, shipping, coupon } = params;
    gaEvent('purchase', {
        transaction_id: transactionId,
        currency: GA_CURRENCY,
        value: value ?? itemsValue(items),
        tax,
        shipping,
        coupon,
        items,
    });
}
