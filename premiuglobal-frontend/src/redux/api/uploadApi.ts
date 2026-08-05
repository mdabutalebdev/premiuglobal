import { baseApi } from './baseApi';

export const uploadApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Upload single image — POST /api/upload/image
        uploadImage: builder.mutation<{ data: { url: string } }, FormData>({
            query: (formData) => ({
                url: '/upload/image',
                method: 'POST',
                body: formData,
                // Don't set Content-Type — browser auto-sets multipart/form-data
                formData: true,
            }),
        }),

        // Upload own profile picture — POST /api/upload/avatar (any signed-in user)
        uploadAvatar: builder.mutation<{ data: { url: string } }, FormData>({
            query: (formData) => ({
                url: '/upload/avatar',
                method: 'POST',
                body: formData,
                formData: true,
            }),
        }),

        // Upload multiple images — POST /api/upload/images
        uploadImages: builder.mutation<{ data: { urls: string[] } }, FormData>({
            query: (formData) => ({
                url: '/upload/images',
                method: 'POST',
                body: formData,
                formData: true,
            }),
        }),

        // Upload single video — POST /api/upload/video
        uploadVideo: builder.mutation<{ data: { url: string } }, FormData>({
            query: (formData) => ({
                url: '/upload/video',
                method: 'POST',
                body: formData,
                formData: true,
            }),
        }),
    }),
});

export const {
    useUploadImageMutation,
    useUploadAvatarMutation,
    useUploadImagesMutation,
    useUploadVideoMutation,
} = uploadApi;
