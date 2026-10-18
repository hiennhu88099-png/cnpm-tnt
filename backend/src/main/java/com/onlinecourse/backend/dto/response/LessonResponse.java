package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.Lesson;
import com.onlinecourse.backend.entity.LessonStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Full lesson data including videoUrl. Admin endpoints only; public endpoints use LessonSummaryResponse.
 */
@Data
@Builder
public class LessonResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private String videoUrl;
    private Integer duration;
    private Integer lessonOrder;
    private LessonStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LessonResponse from(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .courseId(lesson.getCourse().getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .videoUrl(lesson.getVideoUrl())
                .duration(lesson.getDuration())
                .lessonOrder(lesson.getLessonOrder())
                .status(lesson.getStatus())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }
}
