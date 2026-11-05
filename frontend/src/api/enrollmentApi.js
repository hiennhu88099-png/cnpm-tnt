import client from './client';

export const enrollmentApi = {
  enrollCourse: (courseId) =>
    client.post('/api/enrollments', { courseId: Number(courseId) }).then((res) => res.data),

  getMyCourses: () => client.get('/api/enrollments/my-courses').then((res) => res.data),

  getEnrollmentById: (id) => client.get(`/api/enrollments/${id}`).then((res) => res.data),

  getAllEnrollments: (params = {}) =>
    client.get('/api/admin/enrollments', { params }).then((res) => res.data),
};

