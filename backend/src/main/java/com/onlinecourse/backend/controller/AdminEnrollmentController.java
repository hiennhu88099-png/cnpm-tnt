package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.response.EnrollmentResponse;
import com.onlinecourse.backend.dto.response.PageResponse;
import com.onlinecourse.backend.service.EnrollmentService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
public class AdminEnrollmentController {

    private final EnrollmentService enrollmentService;

    @GetMapping
    public PageResponse<EnrollmentResponse> getEnrollments(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return enrollmentService.adminList(
            userId,
            courseId,
            page,
            size
        );
    }
}
