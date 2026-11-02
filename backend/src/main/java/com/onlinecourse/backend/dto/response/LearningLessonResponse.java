package com.onlinecourse.backend.dto.response;

public record LearningLessonResponse(
    Long id,
    String title,
    String description,
    String videoUrl,
    Integer duration,
    Integer lessonOrder,
    boolean completed
) {
}
