package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.CourseRequest;
import com.onlinecourse.backend.dto.response.CourseDetailResponse;
import com.onlinecourse.backend.dto.response.CourseSummaryResponse;
import com.onlinecourse.backend.dto.response.PageResponse;
import com.onlinecourse.backend.entity.CourseStatus;
import com.onlinecourse.backend.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin course management. Access is restricted to ADMIN by SecurityConfig (/api/admin/**).
 */
@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<PageResponse<CourseSummaryResponse>> searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) CourseStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {
        return ResponseEntity.ok(courseService.searchAll(keyword, categoryId, status, page, size, sort));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDetailResponse> getCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourse(id));
    }

    @PostMapping
    public ResponseEntity<CourseDetailResponse> create(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDetailResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        courseService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
