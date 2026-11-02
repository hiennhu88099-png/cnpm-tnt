package com.onlinecourse.backend.dto.response;

public record ProgressResponse(
    Long courseId,
    long totalLessons,
    long completedLessons,
    double progressPercentage
) {
}
