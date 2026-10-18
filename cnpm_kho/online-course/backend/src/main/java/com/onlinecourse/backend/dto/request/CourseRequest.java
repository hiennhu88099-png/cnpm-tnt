package com.onlinecourse.backend.dto.request;

import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.CourseStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Admin payload for creating or updating a course.
 * status is optional: new courses default to DRAFT, updates keep the current status when it is omitted.
 */
@Data
public class CourseRequest {
    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @Size(max = 20000, message = "Description must be at most 20000 characters")
    private String description;

    @Size(max = 500, message = "Thumbnail URL must be at most 500 characters")
    @Pattern(regexp = "^$|^https?://.+", message = "Thumbnail must be an http(s) URL")
    private String thumbnail;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must not be negative")
    @Digits(integer = 10, fraction = 2, message = "Price must have at most 10 digits and 2 decimals")
    private BigDecimal price;

    @Size(max = 150, message = "Instructor name must be at most 150 characters")
    private String instructorName;

    @NotNull(message = "Level is required")
    private CourseLevel level;

    @PositiveOrZero(message = "Duration must not be negative")
    private Integer duration;

    private CourseStatus status;
}
