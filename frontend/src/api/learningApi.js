import client from './client';

export const learningApi = {

    // Lay danh sach bai hoc cua khoa hoc
    getLessons: (courseId) =>
        client.get(
            `/api/learning/courses/${courseId}/lessons`
        ).then(res => res.data),

    // Danh dau hoan thanh bai hoc
    completeLesson: (lessonId) =>
        client.post(
            `/api/lessons/${lessonId}/complete`
        ).then(res => res.data),

    // Lay tien do hoc tap
    getProgress: (courseId) =>
        client.get(
            `/api/courses/${courseId}/progress`
        ).then(res => res.data)
};
