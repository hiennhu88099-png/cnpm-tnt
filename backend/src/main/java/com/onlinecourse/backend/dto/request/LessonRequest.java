package com.onlinecourse.backend.dto.request;

import com.onlinecourse.backend.entity.LessonStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Admin payload for creating or updating a lesson.
 * status is optional: new lessons default to ACTIVE, updates keep the current status when it is omitted.
 */
@Data
public class LessonRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    @Size(max = 20000, message = "Description must be at most 20000 characters")
    private String description;

    @Size(max = 500, message = "Video URL must be at most 500 characters")
    @Pattern(regexp = "^$|^https?://.+", message = "Video URL must be an http(s) URL")
    private String videoUrl;

    @PositiveOrZero(message = "Duration must not be negative")
    private Integer duration;

    @NotNull(message = "Lesson order is required")
    @Min(value = 1, message = "Lesson order must be greater than 0")
    private Integer lessonOrder;

    private LessonStatus status;
}
