import { baseApi } from "./baseApi";

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminPayments: builder.query({
            query: (params) => ({
                url: '/payments/admin/all',
                method: 'GET',
                params,
            }),
            providesTags: ['Payments'],
        }),
        getPaymentStats: builder.query({
            query: () => ({
                url: '/payments/admin/stats',
                method: 'GET',
            }),
            providesTags: ['Payments'],
        }),
        markCODPaid: builder.mutation({
            query: (id) => ({
                url: `/payments/admin/${id}/cod-paid`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Payments', 'Orders'],
        }),
        refundPayment: builder.mutation({
            query: (id) => ({
                url: `/payments/admin/${id}/refund`,
                method: 'POST',
            }),
            invalidatesTags: ['Payments', 'Orders'],
        }),
    }),
});

export const {
    useGetAdminPaymentsQuery,
    useGetPaymentStatsQuery,
    useMarkCODPaidMutation,
    useRefundPaymentMutation,
} = paymentApi;
