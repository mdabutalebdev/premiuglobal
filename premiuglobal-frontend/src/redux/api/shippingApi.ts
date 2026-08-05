import { baseApi } from "./baseApi";

export const shippingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Zones
        getZones: builder.query({
            query: () => '/shipping/zones',
            providesTags: ['Shipping'],
        }),
        createZone: builder.mutation({
            query: (data) => ({
                url: '/shipping/zones',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Shipping'],
        }),
        updateZone: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/shipping/zones/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Shipping'],
        }),
        deleteZone: builder.mutation({
            query: (id) => ({
                url: `/shipping/zones/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Shipping'],
        }),

        // Rates
        getRates: builder.query({
            query: () => '/shipping/rates',
            providesTags: ['Shipping'],
        }),
        createRate: builder.mutation({
            query: (data) => ({
                url: '/shipping/rates',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Shipping'],
        }),
        updateRate: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/shipping/rates/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Shipping'],
        }),
        deleteRate: builder.mutation({
            query: (id) => ({
                url: `/shipping/rates/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Shipping'],
        }),

        // Shipments
        getShipments: builder.query({
            query: (params) => ({
                url: '/shipping/shipments',
                method: 'GET',
                params,
            }),
            providesTags: ['Shipping'],
        }),
        getShippingStats: builder.query({
            query: () => '/shipping/stats',
            providesTags: ['Shipping'],
        }),
        updateShipmentStatus: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/shipping/shipments/${id}/status`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Shipping', 'Orders'],
        }),
        updateTrackingInfo: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/shipping/shipments/${id}/tracking`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Shipping'],
        }),
    }),
});

export const {
    useGetZonesQuery,
    useCreateZoneMutation,
    useUpdateZoneMutation,
    useDeleteZoneMutation,
    useGetRatesQuery,
    useCreateRateMutation,
    useUpdateRateMutation,
    useDeleteRateMutation,
    useGetShipmentsQuery,
    useGetShippingStatsQuery,
    useUpdateShipmentStatusMutation,
    useUpdateTrackingInfoMutation,
} = shippingApi;
