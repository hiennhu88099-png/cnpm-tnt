import client from './client';

export const reviewApi = {
  getReviews: (courseId, page = 0, size = 10) =>
    client.get(`/api/courses/${courseId}/reviews`, { params: { page, size } }).then((res) => res.data),

  getSummary: (courseId) =>
    client.get(`/api/courses/${courseId}/reviews/summary`).then((res) => res.data),

  createReview: (data) => client.post('/api/reviews', data).then((res) => res.data),

  updateReview: (id, data) => client.put(`/api/reviews/${id}`, data).then((res) => res.data),

  deleteReview: (id) => client.delete(`/api/reviews/${id}`),

  getAdminReviews: (params = {}) =>
    client.get('/api/admin/reviews', { params }).then((res) => res.data),

  updateReviewStatus: (id, status) =>
    client.patch(`/api/admin/reviews/${id}/status`, { status }).then((res) => res.data),
};

