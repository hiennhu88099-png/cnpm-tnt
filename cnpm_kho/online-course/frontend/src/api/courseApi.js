import client from './client';

/**
 * MẪU API DÀNH CHO THÀNH VIÊN 2 (TV2 - Quản lý Khóa học & Bài học)
 * Khi TV2 hoàn thành các Controller ở Backend, chỉ cần kích hoạt các hàm dưới đây:
 */
export const courseApi = {
  // Lấy danh sách khóa học (Public)
  getAllCourses: async (params) => {
    const res = await client.get('/api/courses', { params });
    return res.data;
  },

  // Xem chi tiết một khóa học theo ID (Public)
  getCourseById: async (id) => {
    const res = await client.get(`/api/courses/${id}`);
    return res.data;
  },

  // Lấy danh sách danh mục (Public)
  getCategories: async () => {
    const res = await client.get('/api/categories');
    return res.data;
  },

  // Tạo khóa học mới (Yêu cầu đăng nhập / Quyền Giảng viên hoặc Admin)
  createCourse: async (courseData) => {
    const res = await client.post('/api/courses', courseData);
    return res.data;
  },

  // Cập nhật khóa học
  updateCourse: async (id, courseData) => {
    const res = await client.put(`/api/courses/${id}`, courseData);
    return res.data;
  },

  // Xóa khóa học
  deleteCourse: async (id) => {
    const res = await client.delete(`/api/courses/${id}`);
    return res.data;
  },
};

/**
 * MẪU API DÀNH CHO THÀNH VIÊN 3 (TV3 - Quản lý Đăng ký, Tiến độ & Đánh giá)
 */
export const enrollmentApi = {
  // Đăng ký tham gia một khóa học (Cần đăng nhập)
  enrollCourse: async (courseId) => {
    const res = await client.post('/api/enrollments', { courseId });
    return res.data;
  },

  // Lấy danh sách khóa học của học viên đang đăng nhập
  getMyEnrollments: async () => {
    const res = await client.get('/api/enrollments/my-courses');
    return res.data;
  },

  // Đánh giá khóa học
  createReview: async (courseId, reviewData) => {
    const res = await client.post(`/api/courses/${courseId}/reviews`, reviewData);
    return res.data;
  },
};
