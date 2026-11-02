import client from './client';

export const enrollmentApi = {

    // Dang ky khoa hoc
    enrollCourse: (courseId) =>
        client.post('/api/enrollments', {
            courseId: Number(courseId)
        }).then(res => res.data),

    // Lay danh sach khoa hoc da dang ky
    getMyCourses: () =>
        client.get('/api/enrollments/my-courses')
            .then(res => res.data),

    // Xem chi tiet dang ky
    getEnrollmentById: (id) =>
        client.get(`/api/enrollments/${id}`)
            .then(res => res.data),

    // Admin xem danh sach dang ky
    getAllEnrollments: (params = {}) =>
        client.get('/api/admin/enrollments', { params })
            .then(res => res.data)
};
