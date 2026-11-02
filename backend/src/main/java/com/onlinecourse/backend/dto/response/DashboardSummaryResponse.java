package com.onlinecourse.backend.dto.response;

public record DashboardSummaryResponse(
    long totalUsers,
    long totalCourses,
    long totalEnrollments,
    long totalReviews
) {
}
