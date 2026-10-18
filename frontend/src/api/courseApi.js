import client from './client';

// Bỏ các tham số rỗng để URL gọn (vd. keyword = '' thì không gửi)
const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));

/**
 * API CÔNG KHAI CỦA TV2 (Danh mục, Khóa học, Bài học) - không cần đăng nhập.
 * Chỉ trả về khóa học PUBLISHED thuộc danh mục ACTIVE; danh sách bài học không bao giờ có videoUrl.
 */
export const courseApi = {
  // Danh mục đang hoạt động
  getCategories: async () => {
    const res = await client.get('/api/categories');
    return res.data;
  },

  // params: { keyword, categoryId, page, size, sort } -> { content, page, size, totalElements, totalPages }
  getAllCourses: async (params) => {
    const res = await client.get('/api/courses', { params: cleanParams(params) });
    return res.data;
  },

  // Chi tiết khóa học kèm danh sách bài học tóm tắt (lessons)
  getCourseById: async (id) => {
    const res = await client.get(`/api/courses/${id}`);
    return res.data;
  },

  getCourseLessons: async (courseId) => {
    const res = await client.get(`/api/courses/${courseId}/lessons`);
    return res.data;
  },
};

/**
 * API QUẢN TRỊ CỦA TV2 - chỉ ADMIN (backend chặn 403 với tài khoản khác).
 * Xóa luôn là xóa mềm: bản ghi chuyển sang INACTIVE.
 */
export const courseAdminApi = {
  // ---- Danh mục ----
  getCategories: async () => {
    const res = await client.get('/api/admin/categories');
    return res.data;
  },
  createCategory: async (data) => {
    const res = await client.post('/api/admin/categories', data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await client.put(`/api/admin/categories/${id}`, data);
    return res.data;
  },
  deactivateCategory: async (id) => {
    await client.delete(`/api/admin/categories/${id}`);
  },

  // ---- Khóa học ----
  // params: { keyword, categoryId, status, page, size, sort }
  getCourses: async (params) => {
    const res = await client.get('/api/admin/courses', { params: cleanParams(params) });
    return res.data;
  },
  getCourse: async (id) => {
    const res = await client.get(`/api/admin/courses/${id}`);
    return res.data;
  },
  createCourse: async (data) => {
    const res = await client.post('/api/admin/courses', data);
    return res.data;
  },
  updateCourse: async (id, data) => {
    const res = await client.put(`/api/admin/courses/${id}`, data);
    return res.data;
  },
  deactivateCourse: async (id) => {
    await client.delete(`/api/admin/courses/${id}`);
  },

  // ---- Bài học ----
  getLessons: async (courseId) => {
    const res = await client.get(`/api/admin/courses/${courseId}/lessons`);
    return res.data;
  },
  createLesson: async (courseId, data) => {
    const res = await client.post(`/api/admin/courses/${courseId}/lessons`, data);
    return res.data;
  },
  updateLesson: async (id, data) => {
    const res = await client.put(`/api/admin/lessons/${id}`, data);
    return res.data;
  },
  deactivateLesson: async (id) => {
    await client.delete(`/api/admin/lessons/${id}`);
  },
};

/**
 * MẪU API DÀNH CHO THÀNH VIÊN 3 (TV3 - Quản lý Đăng ký, Tiến độ, Đánh giá & Admin)
 */
export const enrollmentApi = {
  // Đăng ký tham gia một khóa học (Yêu cầu đăng nhập, userId lấy từ JWT)
  enrollCourse: async (courseId) => {
    const res = await client.post('/api/enrollments', { courseId });
    return res.data;
  },

  // Lấy danh sách khóa học của học viên đang đăng nhập (kèm tiến độ %)
  getMyEnrollments: async () => {
    const res = await client.get('/api/enrollments/my-courses');
    return res.data;
  },

  // Xem chi tiết lượt đăng ký (Chủ sở hữu hoặc ADMIN)
  getEnrollmentById: async (id) => {
    const res = await client.get(`/api/enrollments/${id}`);
    return res.data;
  },

  // Lấy danh sách bài học đầy đủ có video_url và trạng thái completed (Đã đăng ký khóa học)
  getLearningLessons: async (courseId) => {
    const res = await client.get(`/api/learning/courses/${courseId}/lessons`);
    return res.data;
  },

  // Đánh dấu bài học đã hoàn thành (Học viên đã đăng ký)
  completeLesson: async (lessonId) => {
    const res = await client.post(`/api/lessons/${lessonId}/complete`);
    return res.data;
  },

  // Lấy tổng quan tiến độ của học viên đối với khóa học
  getCourseProgress: async (courseId) => {
    const res = await client.get(`/api/courses/${courseId}/progress`);
    return res.data;
  },

  // Gửi đánh giá mới cho khóa học ({ courseId, rating, comment })
  createReview: async (reviewData) => {
    const res = await client.post('/api/reviews', reviewData);
    return res.data;
  },

  // Xem danh sách đánh giá công khai của khóa học (Public)
  getCourseReviews: async (courseId, params) => {
    const res = await client.get(`/api/courses/${courseId}/reviews`, { params });
    return res.data;
  },

  // Cập nhật đánh giá của mình
  updateReview: async (id, reviewData) => {
    const res = await client.put(`/api/reviews/${id}`, reviewData);
    return res.data;
  },

  // Xóa đánh giá (Tác giả hoặc ADMIN)
  deleteReview: async (id) => {
    const res = await client.delete(`/api/reviews/${id}`);
    return res.data;
  },
};

/**
 * MẪU API ADMIN DÀNH CHO THÀNH VIÊN 3
 */
export const adminApi = {
  // Quản lý người dùng: danh sách user (phân trang, lọc, tìm kiếm)
  getUsers: async (params) => {
    const res = await client.get('/api/admin/users', { params });
    return res.data;
  },

  // Khóa / mở khóa tài khoản người dùng (ACTIVE / BLOCKED)
  updateUserStatus: async (userId, status) => {
    const res = await client.patch(`/api/admin/users/${userId}/status`, { status });
    return res.data;
  },

  // Quản lý danh sách đăng ký toàn hệ thống
  getEnrollments: async (params) => {
    const res = await client.get('/api/admin/enrollments', { params });
    return res.data;
  },

  // Danh sách toàn bộ đánh giá để kiểm duyệt
  getReviews: async (params) => {
    const res = await client.get('/api/admin/reviews', { params });
    return res.data;
  },

  // Kiểm duyệt trạng thái đánh giá (APPROVED / HIDDEN)
  updateReviewStatus: async (reviewId, status) => {
    const res = await client.patch(`/api/admin/reviews/${reviewId}/status`, { status });
    return res.data;
  },

  // Thống kê dashboard: Users, Courses, Enrollments, Reviews
  getDashboardSummary: async () => {
    const res = await client.get('/api/admin/dashboard/summary');
    return res.data;
  },
};
