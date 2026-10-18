package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.LessonRequest;
import com.onlinecourse.backend.dto.response.LessonResponse;
import com.onlinecourse.backend.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin lesson management. Access is restricted to ADMIN by SecurityConfig (/api/admin/**).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminLessonController {

    private final LessonService lessonService;

    @GetMapping("/courses/{courseId}/lessons")
    public ResponseEntity<List<LessonResponse>> getLessons(@PathVariable Long courseId) {
        return ResponseEntity.ok(lessonService.getAllLessons(courseId));
    }

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<LessonResponse> create(@PathVariable Long courseId,
                                                 @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonService.create(courseId, request));
    }

    @PutMapping("/lessons/{id}")
    public ResponseEntity<LessonResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.ok(lessonService.update(id, request));
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        lessonService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
