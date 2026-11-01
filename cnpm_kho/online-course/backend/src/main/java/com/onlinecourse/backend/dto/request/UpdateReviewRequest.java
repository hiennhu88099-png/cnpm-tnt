package com.onlinecourse.backend.dto.request;

import jakarta.validation.constraints.*;

public record UpdateReviewRequest(
    @NotNull
    @Min(1)
    @Max(5)
    Integer rating,

    @Size(max = 5000)
    String comment
) {
}
