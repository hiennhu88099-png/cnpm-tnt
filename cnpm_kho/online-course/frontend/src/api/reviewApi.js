import client from './client';

export const reviewApi = {

    // Lay danh sach danh gia
    getReviews: (courseId, page = 0, size = 10) =>
        client.get(`/api/courses/${courseId}/reviews`, {
            params: { page, size }
        }).then(res => res.data),

    // Lay diem danh gia trung binh
    getSummary: (courseId) =>
        client.get(
            `/api/courses/${courseId}/reviews/summary`
        ).then(res => res.data),

    // Tao danh gia
    createReview: (data) =>
        client.post('/api/reviews', data)
            .then(res => res.data),

    // Cap nhat danh gia
    updateReview: (id, data) =>
        client.put(`/api/reviews/${id}`, data)
            .then(res => res.data),

    // Xoa danh gia
    deleteReview: (id) =>
        client.delete(`/api/reviews/${id}`),

    // Admin xem tat ca danh gia
    getAdminReviews: (params = {}) =>
        client.get('/api/admin/reviews', { params })
            .then(res => res.data),

    // Admin cap nhat trang thai
    updateReviewStatus: (id, status) =>
        client.patch(
            `/api/admin/reviews/${id}/status`,
            { status }
        ).then(res => res.data)
};
