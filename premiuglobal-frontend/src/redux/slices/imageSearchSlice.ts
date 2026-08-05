import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchHistory {
    labels: string[];
    colors: string[];
    category: string | null;
    brand: string | null;
    timestamp: number;
}

interface ImageSearchState {
    isActive: boolean;
    isSearching: boolean;
    products: any[];
    searchMeta: {
        labels: string[];
        colors: Array<{ hex: string; name: string; percentage: number }>;
        brand: string | null;
        category: string | null;
        totalResults: number;
        matchType: string;
    } | null;
    previewImage: string | null;
    // Search history — remembers what user searched for, persists via localStorage
    lastSearchHistory: SearchHistory | null;
}

// Load search history from localStorage
function loadSearchHistory(): SearchHistory | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('freshfoodbazar_search_history');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Expire after 30 minutes
            if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                return parsed;
            }
            localStorage.removeItem('freshfoodbazar_search_history');
        }
    } catch { /* ignore */ }
    return null;
}

function saveSearchHistory(history: SearchHistory): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('freshfoodbazar_search_history', JSON.stringify(history));
    } catch { /* ignore */ }
}

const initialState: ImageSearchState = {
    isActive: false,
    isSearching: false,
    products: [],
    searchMeta: null,
    previewImage: null,
    lastSearchHistory: null,
};

const imageSearchSlice = createSlice({
    name: 'imageSearch',
    initialState,
    reducers: {
        // Load history from localStorage on app init
        loadSearchHistoryFromStorage: (state) => {
            state.lastSearchHistory = loadSearchHistory();
        },

        setImageSearching: (state, action: PayloadAction<boolean>) => {
            state.isSearching = action.payload;
        },

        setImageSearchResults: (state, action: PayloadAction<{
            products: any[];
            searchMeta: any;
            previewImage: string;
        }>) => {
            state.isActive = true;
            state.isSearching = false;
            state.products = action.payload.products;
            state.searchMeta = action.payload.searchMeta;
            state.previewImage = action.payload.previewImage;

            // Save search history for personalized ordering
            const history: SearchHistory = {
                labels: action.payload.searchMeta?.labels || [],
                colors: (action.payload.searchMeta?.colors || []).map((c: any) => c.name || c),
                category: action.payload.searchMeta?.category || null,
                brand: action.payload.searchMeta?.brand || null,
                timestamp: Date.now(),
            };
            state.lastSearchHistory = history;
            saveSearchHistory(history);
        },

        clearImageSearch: (state) => {
            state.isActive = false;
            state.isSearching = false;
            state.products = [];
            state.searchMeta = null;
            state.previewImage = null;
            // NOTE: lastSearchHistory is NOT cleared — it stays for personalized ordering
        },

        // Fully clear everything including history
        clearAllSearchHistory: (state) => {
            state.isActive = false;
            state.isSearching = false;
            state.products = [];
            state.searchMeta = null;
            state.previewImage = null;
            state.lastSearchHistory = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('freshfoodbazar_search_history');
            }
        },
    },
});

export const {
    setImageSearching,
    setImageSearchResults,
    clearImageSearch,
    clearAllSearchHistory,
    loadSearchHistoryFromStorage,
} = imageSearchSlice.actions;
export default imageSearchSlice.reducer;
