package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.ReviewStatus;
import java.time.LocalDateTime;

public record ReviewResponse(
    Long id,
    Long userId,
    String fullName,
    String avatar,
    Long courseId,
    String courseTitle,
    Integer rating,
    String comment,
    ReviewStatus status,
    LocalDateTime createdAt
) {
}
