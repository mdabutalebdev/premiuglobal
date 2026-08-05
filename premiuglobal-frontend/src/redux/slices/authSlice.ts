import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role: 'user' | 'admin';
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    /** True until the session has been read back from localStorage on boot. */
    isRestoring: boolean;
    error: string | null;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'freshfoodbazar_user';

/** Reads `exp` straight out of the JWT so an expired session isn't restored. */
const isExpired = (token: string): boolean => {
    try {
        const payload = token.split('.')[1];
        if (!payload) return false;
        const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return typeof json.exp === 'number' && json.exp * 1000 <= Date.now();
    } catch {
        return false; // unreadable — let the API be the judge
    }
};

const persist = (user: User, token: string) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch { /* storage full or blocked — session just won't survive a reload */ }
};

const clearPersisted = () => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
};

// Starts empty on both server and client — restoreSession fills it in after
// mount, so the markup React hydrates against always matches.
const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isRestoring: true,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },

        loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.isLoading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isRestoring = false;
            state.error = null;
            persist(action.payload.user, action.payload.token);
        },

        /** Puts the saved session back after a reload. Dispatched once on boot. */
        restoreSession: (state) => {
            state.isRestoring = false;
            if (typeof window === 'undefined') return;
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                const rawUser = localStorage.getItem(USER_KEY);
                if (!token || !rawUser) return;
                if (isExpired(token)) { clearPersisted(); return; }
                state.user = JSON.parse(rawUser);
                state.token = token;
                state.isAuthenticated = true;
            } catch {
                clearPersisted();
            }
        },

        loginFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error = action.payload;
        },

        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.isRestoring = false;
            state.error = null;
            clearPersisted();
        },

        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
                if (state.token) persist(state.user, state.token);
            }
        },

        updateAddress: (state, action: PayloadAction<User['address']>) => {
            if (state.user) {
                state.user.address = action.payload;
            }
        },

        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    restoreSession,
    updateUser,
    updateAddress,
    clearError
} = authSlice.actions;

export default authSlice.reducer;
