package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.ReviewStatusRequest;
import com.onlinecourse.backend.dto.response.PageResponse;
import com.onlinecourse.backend.dto.response.ReviewResponse;
import com.onlinecourse.backend.service.ReviewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    // Admin xem danh sach danh gia
    @GetMapping
    public PageResponse<ReviewResponse> getReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return reviewService.adminList(page, size);
    }

    // Admin cap nhat trang thai danh gia
    @PatchMapping("/{id}/status")
    public ReviewResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReviewStatusRequest request) {

        return reviewService.changeStatus(
            id,
            request.status()
        );
    }
}
