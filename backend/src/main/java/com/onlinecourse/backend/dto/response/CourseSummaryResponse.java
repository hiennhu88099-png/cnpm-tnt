package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.Course;
import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.CourseStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Course card data for listings (no description or lessons, to keep pages light).
 * Field names match the props of the frontend {@code <CourseCard />}.
 */
@Data
@Builder
public class CourseSummaryResponse {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String title;
    private String thumbnail;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String instructorName;
    private CourseLevel level;
    private Integer duration;
    private CourseStatus status;
    // Number of ACTIVE lessons
    private long lessonCount;
    // TODO(TV3): fill from the reviews module; null until then so the card hides the rating
    private Double averageRating;
    private Long reviewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Must be called inside a transaction: reads the lazy category
    public static CourseSummaryResponse from(Course course, long lessonCount) {
        return CourseSummaryResponse.builder()
                .id(course.getId())
                .categoryId(course.getCategory().getId())
                .categoryName(course.getCategory().getName())
                .title(course.getTitle())
                .thumbnail(course.getThumbnail())
                .price(course.getPrice())
                .originalPrice(course.getOriginalPrice())
                .instructorName(course.getInstructorName())
                .level(course.getLevel())
                .duration(course.getDuration())
                .status(course.getStatus())
                .lessonCount(lessonCount)
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
