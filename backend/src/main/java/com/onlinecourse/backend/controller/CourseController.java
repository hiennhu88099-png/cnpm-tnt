package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.CourseCreateRequest;
import com.onlinecourse.backend.dto.request.CourseUpdateRequest;
import com.onlinecourse.backend.dto.response.CourseDetailResponse;
import com.onlinecourse.backend.dto.response.CourseSummaryResponse;
import com.onlinecourse.backend.dto.response.PageResponse;
import com.onlinecourse.backend.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Course API. Reads are public (only PUBLISHED courses of ACTIVE categories); writes require ADMIN.
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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseDetailResponse> create(@Valid @RequestBody CourseCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseDetailResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody CourseUpdateRequest request) {
        return ResponseEntity.ok(courseService.update(id, request));
    }

    // Soft delete: the course becomes INACTIVE so enrollments and reviews keep their reference
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        courseService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
