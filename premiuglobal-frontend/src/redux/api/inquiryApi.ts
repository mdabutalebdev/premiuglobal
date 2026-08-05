import { baseApi } from './baseApi';

export const inquiryApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Public: create inquiry (optionalAuth links it to the user if logged in)
        createInquiry: builder.mutation({
            query: (data) => ({
                url: '/inquiries',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Inquiries'],
        }),
        // Admin: get all inquiries
        getInquiries: builder.query({
            query: (params) => ({
                url: '/inquiries',
                params,
            }),
            providesTags: ['Inquiries'],
        }),
        // Logged-in customer: their own inquiries / RFQs (+ admin quotes)
        getMyInquiries: builder.query({
            query: (params) => ({
                url: '/inquiries/my',
                params,
            }),
            providesTags: ['Inquiries'],
        }),
        // Public: get inquiries by product
        getProductInquiries: builder.query({
            query: (productId) => `/inquiries/product/${productId}`,
            providesTags: ['Inquiries'],
        }),
        // Admin: update inquiry status / send quote (status, adminReply, quotedPrice)
        updateInquiryStatus: builder.mutation({
            query: ({ id, data }) => ({
                url: `/inquiries/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Inquiries'],
        }),
        // Admin: delete inquiry
        deleteInquiry: builder.mutation({
            query: (id) => ({
                url: `/inquiries/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Inquiries'],
        }),
    }),
});

export const {
    useCreateInquiryMutation,
    useGetInquiriesQuery,
    useGetMyInquiriesQuery,
    useGetProductInquiriesQuery,
    useUpdateInquiryStatusMutation,
    useDeleteInquiryMutation,
} = inquiryApi;
