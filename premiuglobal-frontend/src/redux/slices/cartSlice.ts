import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
    id: string;          // unique key: productId or productId_color_size
    productId: string;   // actual product _id
    name: string;
    price: number;
    mrp: number;
    image: string;
    category: string;
    quantity: number;
    color?: string;
    colorHex?: string;
    size?: string;
}

interface CartState {
    items: CartItem[];
    totalQuantity: number;
    totalPrice: number;
}

// Load cart from localStorage
const loadCartFromStorage = (): CartState => {
    if (typeof window === 'undefined') {
        return { items: [], totalQuantity: 0, totalPrice: 0 };
    }
    try {
        const stored = localStorage.getItem('freshfoodbazar_cart');
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                items: parsed.items || [],
                totalQuantity: parsed.totalQuantity || 0,
                totalPrice: parsed.totalPrice || 0,
            };
        }
    } catch {}
    return { items: [], totalQuantity: 0, totalPrice: 0 };
};

// Save cart to localStorage
const saveCartToStorage = (state: CartState) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('freshfoodbazar_cart', JSON.stringify({
                items: state.items,
                totalQuantity: state.totalQuantity,
                totalPrice: state.totalPrice,
            }));
        } catch {}
    }
};

// Always start empty for SSR — hydrate from localStorage on client mount
const initialState: CartState = {
    items: [],
    totalQuantity: 0,
    totalPrice: 0,
};

const calculateTotals = (items: CartItem[]) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { totalQuantity, totalPrice };
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'> & { quantity?: number }>) => {
            const existingItem = state.items.find(item => item.id === action.payload.id);
            const qty = action.payload.quantity ?? 1;

            if (existingItem) {
                existingItem.quantity += qty;
            } else {
                state.items.push({ ...action.payload, quantity: qty });
            }

            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalPrice = totals.totalPrice;
            saveCartToStorage(state);
        },

        removeFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(item => item.id !== action.payload);

            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalPrice = totals.totalPrice;
            saveCartToStorage(state);
        },

        increaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.items.find(item => item.id === action.payload);
            if (item) {
                item.quantity += 1;
            }

            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalPrice = totals.totalPrice;
            saveCartToStorage(state);
        },

        decreaseQuantity: (state, action: PayloadAction<string>) => {
            const item = state.items.find(item => item.id === action.payload);
            if (item) {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    state.items = state.items.filter(i => i.id !== action.payload);
                }
            }

            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalPrice = totals.totalPrice;
            saveCartToStorage(state);
        },

        clearCart: (state) => {
            state.items = [];
            state.totalQuantity = 0;
            state.totalPrice = 0;
            saveCartToStorage(state);
        },

        updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
            const item = state.items.find(item => item.id === action.payload.id);
            if (item && action.payload.quantity > 0) {
                item.quantity = action.payload.quantity;
            }

            const totals = calculateTotals(state.items);
            state.totalQuantity = totals.totalQuantity;
            state.totalPrice = totals.totalPrice;
            saveCartToStorage(state);
        },

        // Load cart from localStorage (call on app mount)
        hydrateCart: (state) => {
            const stored = loadCartFromStorage();
            state.items = stored.items;
            state.totalQuantity = stored.totalQuantity;
            state.totalPrice = stored.totalPrice;
        },
    },
});

export const {
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    updateQuantity,
    hydrateCart
} = cartSlice.actions;

export default cartSlice.reducer;

