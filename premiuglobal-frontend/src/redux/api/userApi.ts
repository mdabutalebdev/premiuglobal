import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // ===== User-facing endpoints =====
        getMe: builder.query({
            query: () => ({
                url: '/users/me',
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),
        updateProfile: builder.mutation({
            query: (data) => ({
                url: '/users/me',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Users'],
        }),
        getMyAddresses: builder.query({
            query: () => ({
                url: '/users/addresses',
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),
        addAddress: builder.mutation({
            query: (data) => ({
                url: '/users/addresses',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Users'],
        }),
        updateAddress: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/users/addresses/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Users'],
        }),
        deleteAddress: builder.mutation({
            query: (id) => ({
                url: `/users/addresses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
        getWishlist: builder.query({
            query: () => ({
                url: '/users/wishlist',
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),
        toggleWishlist: builder.mutation({
            query: (productId) => ({
                url: '/users/wishlist',
                method: 'POST',
                body: { productId },
            }),
            invalidatesTags: ['Users'],
        }),

        // ===== Admin endpoints =====
        getAdminUsers: builder.query({
            query: (params) => ({
                url: '/users/admin/all',
                method: 'GET',
                params,
            }),
            providesTags: ['Users'],
        }),
        getAdminUserById: builder.query({
            query: (id) => ({
                url: `/users/admin/${id}`,
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),
        getAdminUserStats: builder.query({
            query: () => ({
                url: '/users/admin/stats',
                method: 'GET',
            }),
            providesTags: ['Users'],
        }),
        updateUser: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/users/admin/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Users'],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/users/admin/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const {
    // User hooks
    useGetMeQuery,
    useUpdateProfileMutation,
    useGetMyAddressesQuery,
    useAddAddressMutation,
    useUpdateAddressMutation,
    useDeleteAddressMutation,
    useGetWishlistQuery,
    useToggleWishlistMutation,
    // Admin hooks
    useGetAdminUsersQuery,
    useGetAdminUserByIdQuery,
    useGetAdminUserStatsQuery,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = userApi;

