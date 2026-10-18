package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.Course;
import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.CourseStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Full course page: course info plus the curriculum (lesson summaries, without video URLs).
 */
@Data
@Builder
public class CourseDetailResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String title;
    private String description;
    private String thumbnail;
    private BigDecimal price;
    private String instructorName;
    private CourseLevel level;
    private Integer duration;
    private CourseStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<LessonSummaryResponse> lessons;

    // Must be called inside a transaction: reads the lazy category
    public static CourseDetailResponse from(Course course, List<LessonSummaryResponse> lessons) {
        return CourseDetailResponse.builder()
                .id(course.getId())
                .categoryId(course.getCategory().getId())
                .categoryName(course.getCategory().getName())
                .title(course.getTitle())
                .description(course.getDescription())
                .thumbnail(course.getThumbnail())
                .price(course.getPrice())
                .instructorName(course.getInstructorName())
                .level(course.getLevel())
                .duration(course.getDuration())
                .status(course.getStatus())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .lessons(lessons)
                .build();
    }
}
