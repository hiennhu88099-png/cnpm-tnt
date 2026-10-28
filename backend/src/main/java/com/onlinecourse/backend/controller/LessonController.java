package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.LessonRequest;
import com.onlinecourse.backend.dto.response.LessonResponse;
import com.onlinecourse.backend.dto.response.LessonSummaryResponse;
import com.onlinecourse.backend.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Lesson API. The public curriculum never contains video URLs; writes require ADMIN.
 */
@RestController
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/api/courses/{courseId}/lessons")
    public ResponseEntity<List<LessonSummaryResponse>> getLessons(@PathVariable Long courseId) {
        return ResponseEntity.ok(lessonService.getPublicLessons(courseId));
    }

    @PostMapping("/api/courses/{courseId}/lessons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LessonResponse> create(@PathVariable Long courseId,
                                                 @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonService.create(courseId, request));
    }

    @PutMapping("/api/lessons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LessonResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.ok(lessonService.update(id, request));
    }

    // Soft delete: the lesson becomes INACTIVE so learning progress keeps its reference
    @DeleteMapping("/api/lessons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        lessonService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
