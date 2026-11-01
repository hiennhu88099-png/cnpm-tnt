package com.onlinecourse.backend.dto.request;

import com.onlinecourse.backend.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewStatusRequest(
    @NotNull ReviewStatus status
) {
}
