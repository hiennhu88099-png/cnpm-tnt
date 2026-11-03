import client from './client';

export const courseApi = {
  // ---- Danh mục (Categories) ----
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

  // Lấy toàn bộ danh mục gồm cả INACTIVE (Chỉ ADMIN)
  getAdminCategories: async () => {
    const res = await client.get('/api/admin/categories');
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

  // Ngừng sử dụng danh mục - Soft delete (Chỉ ADMIN)
  deleteCategory: async (id) => {
    const res = await client.delete(`/api/categories/${id}`);
    return res.data;
  },

  // ---- Khóa học (Courses) ----
  // Lấy danh sách khóa học công khai (Public, hỗ trợ keyword, categoryId, page, size, sort)
  getAllCourses: async (params) => {
    const res = await client.get('/api/courses', { params });
    return res.data;
  },

  // Xem chi tiết khóa học công khai (Public)
  getCourseById: async (id) => {
    const res = await client.get(`/api/courses/${id}`);
    return res.data;
  },

  // Quản trị: tìm kiếm toàn bộ khóa học gồm DRAFT / INACTIVE (Chỉ ADMIN)
  getAdminCourses: async (params) => {
    const res = await client.get('/api/admin/courses', { params });
    return res.data;
  },

  // Quản trị: chi tiết khóa học gồm DRAFT / INACTIVE (Chỉ ADMIN)
  getAdminCourseById: async (id) => {
    const res = await client.get(`/api/admin/courses/${id}`);
    return res.data;
  },

  // Tạo khóa học mới (Chỉ ADMIN)
  createCourse: async (courseData) => {
    const res = await client.post('/api/courses', courseData);
    return res.data;
  },

  // Cập nhật khóa học (Chỉ ADMIN)
  updateCourse: async (id, courseData) => {
    const res = await client.put(`/api/courses/${id}`, courseData);
    return res.data;
  },

  // Ẩn / ngừng xuất bản khóa học (Chỉ ADMIN)
  deleteCourse: async (id) => {
    const res = await client.delete(`/api/courses/${id}`);
    return res.data;
  },

  // ---- Bài học (Lessons) ----
  // Danh sách bài học công khai của khóa học - không chứa video_url (Public)
  getCourseLessons: async (courseId) => {
    const res = await client.get(`/api/courses/${courseId}/lessons`);
    return res.data;
  },

  // Quản trị: danh sách bài học đầy đủ gồm cả video_url và INACTIVE (Chỉ ADMIN)
  getAdminCourseLessons: async (courseId) => {
    const res = await client.get(`/api/admin/courses/${courseId}/lessons`);
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
};
