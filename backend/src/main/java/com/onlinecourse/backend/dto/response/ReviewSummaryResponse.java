package com.onlinecourse.backend.dto.response;

public record ReviewSummaryResponse(
    double averageRating,
    long reviewCount
) {
}
