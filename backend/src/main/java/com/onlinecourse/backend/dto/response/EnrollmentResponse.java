package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.EnrollmentStatus;

import java.time.LocalDateTime;

public record EnrollmentResponse(
    Long id,
    Long userId,
    Long courseId,
    String title,
    String thumbnail,
    String instructorName,
    CourseLevel level,
    LocalDateTime enrolledAt,
    EnrollmentStatus status,
    double progress
) {
}
