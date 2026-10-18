package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.Lesson;

/**
 * Public view of a lesson. videoUrl is deliberately absent: video content is only for enrolled students.
 */
public record LessonSummaryResponse(Long id, String title, String description, Integer duration, Integer lessonOrder) {

    public static LessonSummaryResponse from(Lesson lesson) {
        return new LessonSummaryResponse(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getDuration(),
                lesson.getLessonOrder());
    }
}
