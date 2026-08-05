import { createListenerMiddleware } from '@reduxjs/toolkit';
import { addToCart, removeFromCart, type CartItem } from '../slices/cartSlice';
import { addToWishlist, toggleWishlist, type WishlistItem } from '../slices/wishlistSlice';
import {
    trackAddToCart,
    trackRemoveFromCart,
    trackAddToWishlist,
    type GaItem,
} from '@/lib/analytics/gtag';

/**
 * Fires GA4 ecommerce events off the cart/wishlist redux actions so that every
 * "add to cart" / "add to wishlist" button on the site is tracked from one
 * place, no matter which component dispatched it.
 */
export const analyticsListenerMiddleware = createListenerMiddleware();

const cartItemToGaItem = (item: CartItem, quantity?: number): GaItem => ({
    item_id: item.productId,
    item_name: item.name,
    item_category: item.category,
    item_variant: [item.color, item.size].filter(Boolean).join(' / ') || undefined,
    price: item.price,
    discount: item.mrp > item.price ? Number((item.mrp - item.price).toFixed(2)) : undefined,
    quantity: quantity ?? item.quantity,
});

const wishlistItemToGaItem = (item: WishlistItem): GaItem => ({
    item_id: item.id,
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    discount: item.mrp > item.price ? Number((item.mrp - item.price).toFixed(2)) : undefined,
    quantity: 1,
});

// add_to_cart — payload carries the full item + (optional) quantity
analyticsListenerMiddleware.startListening({
    actionCreator: addToCart,
    effect: (action) => {
        const qty = action.payload.quantity ?? 1;
        trackAddToCart([cartItemToGaItem(action.payload as CartItem, qty)]);
    },
});

// remove_from_cart — payload is just the cart line id, so look the item up in
// the state as it was *before* the reducer removed it.
analyticsListenerMiddleware.startListening({
    actionCreator: removeFromCart,
    effect: (action, listenerApi) => {
        const state = listenerApi.getOriginalState() as {
            cart: { items: CartItem[] };
        };
        const removed = state.cart.items.find((i) => i.id === action.payload);
        if (removed) trackRemoveFromCart([cartItemToGaItem(removed)]);
    },
});

// add_to_wishlist — direct add
analyticsListenerMiddleware.startListening({
    actionCreator: addToWishlist,
    effect: (action) => {
        trackAddToWishlist(wishlistItemToGaItem(action.payload));
    },
});

// toggleWishlist — only counts as add_to_wishlist when the item was NOT already
// present before the toggle.
analyticsListenerMiddleware.startListening({
    actionCreator: toggleWishlist,
    effect: (action, listenerApi) => {
        const state = listenerApi.getOriginalState() as {
            wishlist: { items: WishlistItem[] };
        };
        const existed = state.wishlist.items.some((i) => i.id === action.payload.id);
        if (!existed) trackAddToWishlist(wishlistItemToGaItem(action.payload));
    },
});
