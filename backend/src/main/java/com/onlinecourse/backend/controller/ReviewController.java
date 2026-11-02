package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.ReviewRequest;
import com.onlinecourse.backend.dto.request.UpdateReviewRequest;
import com.onlinecourse.backend.dto.response.PageResponse;
import com.onlinecourse.backend.dto.response.ReviewResponse;
import com.onlinecourse.backend.dto.response.ReviewSummaryResponse;
import com.onlinecourse.backend.service.CurrentUserService;
import com.onlinecourse.backend.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final CurrentUserService userService;

    // Tao danh gia
    @PostMapping("/api/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ReviewRequest request) {

        return reviewService.create(
            userService.current(jwt),
            request
        );
    }

    // Xem danh gia cong khai
    @GetMapping("/api/courses/{courseId}/reviews")
    public PageResponse<ReviewResponse> getReviews(
            @PathVariable Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return reviewService.publicReviews(
            courseId,
            page,
            size
        );
    }

    // Xem tong quan danh gia
    @GetMapping("/api/courses/{courseId}/reviews/summary")
    public ReviewSummaryResponse getSummary(
            @PathVariable Long courseId) {

        return reviewService.summary(courseId);
    }

    // Sua danh gia
    @PutMapping("/api/reviews/{id}")
    public ReviewResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request) {

        return reviewService.update(
            userService.current(jwt),
            id,
            request
        );
    }

    // Xoa danh gia
    @DeleteMapping("/api/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {

        reviewService.delete(
            userService.current(jwt),
            id
        );
    }
}
