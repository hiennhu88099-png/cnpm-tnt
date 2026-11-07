package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.Lesson;

/**
 * Public view of a lesson. Only the first preview lesson (lessonOrder == 1) exposes its videoUrl;
 * subsequent lessons keep videoUrl null until the student is enrolled.
 */
public record LessonSummaryResponse(
        Long id,
        String title,
        String description,
        Integer duration,
        Integer lessonOrder,
        String previewVideoUrl
) {

    public LessonSummaryResponse(Long id, String title, String description, Integer duration, Integer lessonOrder) {
        this(id, title, description, duration, lessonOrder, null);
    }

    public static LessonSummaryResponse from(Lesson lesson) {
        boolean isFreePreview = lesson.getLessonOrder() != null && lesson.getLessonOrder() == 1;
        return new LessonSummaryResponse(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getDuration(),
                lesson.getLessonOrder(),
                isFreePreview ? lesson.getVideoUrl() : null);
    }
}
