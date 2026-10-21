package com.onlinecourse.backend.dto.request;

import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.CourseStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Fields and validation shared by {@link CourseCreateRequest} and {@link CourseUpdateRequest}.
 */
@Getter
@Setter
public abstract class CourseRequest {
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

    // Optional; when present it must not be lower than price (checked in CourseService)
    @DecimalMin(value = "0.0", message = "Original price must not be negative")
    @Digits(integer = 10, fraction = 2, message = "Original price must have at most 10 digits and 2 decimals")
    private BigDecimal originalPrice;

    @Size(max = 150, message = "Instructor name must be at most 150 characters")
    private String instructorName;

    @NotNull(message = "Level is required")
    private CourseLevel level;

    @PositiveOrZero(message = "Duration must not be negative")
    private Integer duration;

    private CourseStatus status;
}
