import client from './client';

export const learningApi = {
  getLessons: (courseId) =>
    client.get(`/api/learning/courses/${courseId}/lessons`).then((res) => res.data),

  completeLesson: (lessonId) =>
    client.post(`/api/lessons/${lessonId}/complete`).then((res) => res.data),

  getProgress: (courseId) =>
    client.get(`/api/courses/${courseId}/progress`).then((res) => res.data),
};

