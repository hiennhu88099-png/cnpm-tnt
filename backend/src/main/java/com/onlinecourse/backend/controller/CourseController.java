package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.response.CourseDetailResponse;
import com.onlinecourse.backend.dto.response.CourseSummaryResponse;
import com.onlinecourse.backend.dto.response.PageResponse;
import com.onlinecourse.backend.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public, read-only course catalog (no token required). Only PUBLISHED courses of ACTIVE categories are visible.
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // Example: /api/courses?keyword=java&categoryId=1&page=0&size=12&sort=price,asc
    @GetMapping
    public ResponseEntity<PageResponse<CourseSummaryResponse>> searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ResponseEntity.ok(courseService.searchPublished(keyword, categoryId, page, size, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDetailResponse> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getPublishedCourse(id));
    }
}
