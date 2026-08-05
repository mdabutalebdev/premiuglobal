import { baseApi } from './baseApi';

export const productApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: get all products — Backend route: GET /api/products/
        getProducts: builder.query({
            query: (params) => ({
                url: '/products',
                params,
            }),
            providesTags: ['Products'],
        }),
        // Public: get product by id — Backend route: GET /api/products/:id
        getProductById: builder.query({
            query: (id) => `/products/${id}`,
            providesTags: (result, error, id) => [{ type: 'Products', id }],
        }),
        // Public: get featured products — Backend route: GET /api/products/featured
        getFeaturedProducts: builder.query({
            query: () => '/products/featured',
            providesTags: ['Products'],
        }),
        // Public: get product by slug — Backend route: GET /api/products/slug/:slug
        getProductBySlug: builder.query({
            query: (slug) => `/products/slug/${slug}`,
            providesTags: ['Products'],
        }),
        // Public: get related products — Backend route: GET /api/products/:id/related/:categoryId
        getRelatedProducts: builder.query({
            query: ({ id, categoryId }) => `/products/${id}/related/${categoryId}`,
            providesTags: ['Products'],
        }),
        // Admin: get product stats — Backend route: GET /api/products/admin/stats
        getProductStats: builder.query({
            query: () => '/products/admin/stats',
            providesTags: ['Products'],
        }),
        // Admin: create product — Backend route: POST /api/products/
        createProduct: builder.mutation({
            query: (data) => ({
                url: '/products',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Products'],
        }),
        // Admin: update product — Backend route: PATCH /api/products/:id
        updateProduct: builder.mutation({
            query: ({ id, data }) => ({
                url: `/products/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => ['Products', { type: 'Products', id }],
        }),
        // Admin: delete product — Backend route: DELETE /api/products/:id
        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Products'],
        }),
        // Admin: update stock — Backend route: PATCH /api/products/:id/stock
        updateStock: builder.mutation({
            query: ({ id, quantity }) => ({
                url: `/products/${id}/stock`,
                method: 'PATCH',
                body: { quantity },
            }),
            invalidatesTags: (result, error, { id }) => ['Products', { type: 'Products', id }],
        }),
        // Admin: bulk update status — Backend route: PATCH /api/products/admin/bulk-status
        bulkUpdateStatus: builder.mutation({
            query: (data) => ({
                url: '/products/admin/bulk-status',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Products'],
        }),
        // Admin: bulk delete — Backend route: DELETE /api/products/admin/bulk-delete
        bulkDelete: builder.mutation({
            query: (data) => ({
                url: '/products/admin/bulk-delete',
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ['Products'],
        }),
        // Image search — Backend route: POST /api/search/image
        imageSearch: builder.mutation({
            query: (data: { labels: string[]; colors: string[]; colorHexes?: string[]; keywords?: string[] }) => ({
                url: '/search/image',
                method: 'POST',
                body: data,
            }),
        }),
        // Public: increment stat — Backend route: PATCH /api/products/:id/stat
        incrementProductStat: builder.mutation({
            query: ({ id, field }: { id: string; field: string }) => ({
                url: `/products/${id}/stat`,
                method: 'PATCH',
                body: { field },
            }),
            // Optimistic update: patch every cached product query containing this product
            // so the new count appears instantly across home, card, details, related — no reload.
            async onQueryStarted({ id, field }, { dispatch, queryFulfilled, getState }) {
                const state = getState();
                const entries = productApi.util.selectInvalidatedBy(state, [
                    'Products',
                    { type: 'Products', id },
                ]);

                const patches: { undo: () => void }[] = [];

                const bumpInDraft = (draft: any) => {
                    if (!draft) return;
                    const target = draft.data ?? draft;
                    if (!target) return;
                    const bump = (obj: any) => {
                        if (obj && (obj._id === id || obj.id === id)) {
                            obj[field] = (obj[field] || 0) + 1;
                        }
                    };
                    if (Array.isArray(target)) {
                        target.forEach(bump);
                    } else {
                        bump(target);
                    }
                };

                for (const entry of entries) {
                    try {
                        const patch = dispatch(
                            productApi.util.updateQueryData(
                                entry.endpointName as any,
                                entry.originalArgs,
                                bumpInDraft as any,
                            )
                        );
                        patches.push(patch);
                    } catch {
                        // ignore — entry may not be a query we can patch
                    }
                }

                try {
                    await queryFulfilled;
                } catch {
                    patches.forEach(p => p.undo());
                }
            },
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductByIdQuery,
    useGetFeaturedProductsQuery,
    useGetProductBySlugQuery,
    useGetRelatedProductsQuery,
    useGetProductStatsQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    useUpdateStockMutation,
    useBulkUpdateStatusMutation,
    useBulkDeleteMutation,
    useImageSearchMutation,
    useIncrementProductStatMutation,
} = productApi;
