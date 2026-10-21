import client from './client';

// Bỏ các tham số rỗng để URL gọn (vd. keyword = '' thì không gửi)
const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));

/**
 * API CỦA THÀNH VIÊN 2 (TV2 - Quản lý Danh mục, Khóa học & Bài học)
 * - Đọc công khai: chỉ trả danh mục ACTIVE, khóa học PUBLISHED; danh sách bài học không bao giờ có videoUrl.
 * - Ghi (tạo/sửa/xóa): chỉ ADMIN, backend trả 403 với tài khoản khác. Xóa luôn là xóa mềm (chuyển INACTIVE).
 * - getAdmin*: chỉ ADMIN, xem được cả bản nháp / đã ẩn (dùng cho trang quản trị).
 */
export const courseApi = {
  // Lấy danh sách danh mục đang hoạt động (Public)
  getCategories: async () => {
    const res = await client.get('/api/categories');
    return res.data;
  },

  // Lấy chi tiết một danh mục (Public)
  getCategoryById: async (id) => {
    const res = await client.get(`/api/categories/${id}`);
    return res.data;
  },

  // Tạo danh mục mới (Chỉ ADMIN)
  createCategory: async (categoryData) => {
    const res = await client.post('/api/categories', categoryData);
    return res.data;
  },

  // Cập nhật danh mục (Chỉ ADMIN)
  updateCategory: async (id, categoryData) => {
    const res = await client.put(`/api/categories/${id}`, categoryData);
    return res.data;
  },

  // Ngừng sử dụng danh mục (Chỉ ADMIN)
  deleteCategory: async (id) => {
    const res = await client.delete(`/api/categories/${id}`);
    return res.data;
  },

  // Lấy danh sách khóa học (Public, hỗ trợ keyword, categoryId, page, size, sort)
  // -> { content, page, size, totalElements, totalPages }
  getAllCourses: async (params) => {
    const res = await client.get('/api/courses', { params: cleanParams(params) });
    return res.data;
  },

  // Xem chi tiết một khóa học theo ID, kèm danh sách bài học tóm tắt (Public)
  getCourseById: async (id) => {
    const res = await client.get(`/api/courses/${id}`);
    return res.data;
  },

  // Tạo khóa học mới (Chỉ ADMIN)
  createCourse: async (courseData) => {
    const res = await client.post('/api/courses', courseData);
    return res.data;
  },

  // Cập nhật thông tin khóa học (Chỉ ADMIN)
  updateCourse: async (id, courseData) => {
    const res = await client.put(`/api/courses/${id}`, courseData);
    return res.data;
  },

  // Ẩn / ngừng xuất bản khóa học (Chỉ ADMIN)
  deleteCourse: async (id) => {
    const res = await client.delete(`/api/courses/${id}`);
    return res.data;
  },

  // Danh sách bài học công khai của khóa học - không chứa video_url (Public)
  getCourseLessons: async (courseId) => {
    const res = await client.get(`/api/courses/${courseId}/lessons`);
    return res.data;
  },

  // Thêm bài học mới (Chỉ ADMIN)
  createLesson: async (courseId, lessonData) => {
    const res = await client.post(`/api/courses/${courseId}/lessons`, lessonData);
    return res.data;
  },

  // Cập nhật bài học (Chỉ ADMIN)
  updateLesson: async (id, lessonData) => {
    const res = await client.put(`/api/lessons/${id}`, lessonData);
    return res.data;
  },

  // Xóa / ẩn bài học (Chỉ ADMIN)
  deleteLesson: async (id) => {
    const res = await client.delete(`/api/lessons/${id}`);
    return res.data;
  },

  // ---- Chỉ ADMIN: đọc cả dữ liệu đã ẩn / bản nháp cho trang quản trị ----

  // Tất cả danh mục (kể cả INACTIVE)
  getAdminCategories: async () => {
    const res = await client.get('/api/admin/categories');
    return res.data;
  },

  // Tất cả khóa học (kể cả DRAFT / INACTIVE). params: { keyword, categoryId, status, page, size, sort }
  getAdminCourses: async (params) => {
    const res = await client.get('/api/admin/courses', { params: cleanParams(params) });
    return res.data;
  },

  // Chi tiết khóa học bất kỳ trạng thái (dùng cho form sửa)
  getAdminCourseById: async (id) => {
    const res = await client.get(`/api/admin/courses/${id}`);
    return res.data;
  },

  // Tất cả bài học của khóa học (kể cả INACTIVE, có videoUrl)
  getAdminCourseLessons: async (courseId) => {
    const res = await client.get(`/api/admin/courses/${courseId}/lessons`);
    return res.data;
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
