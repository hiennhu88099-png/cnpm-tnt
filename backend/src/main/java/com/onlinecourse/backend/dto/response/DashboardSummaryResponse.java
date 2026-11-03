package com.onlinecourse.backend.dto.response;

public record DashboardSummaryResponse(
    long totalUsers,
    long activeUsers,
    long blockedUsers,
    long totalCourses,
    long publishedCourses,
    long draftCourses,
    long totalEnrollments,
    long activeEnrollments,
    long completedEnrollments,
    long totalReviews,
    long approvedReviews,
    long pendingReviews,
    long hiddenReviews,
    double averageRating
) {
}
