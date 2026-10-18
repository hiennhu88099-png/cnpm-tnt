package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.response.LessonSummaryResponse;
import com.onlinecourse.backend.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public curriculum of a course (no token required). Video URLs are never returned here.
 */
@RestController
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @GetMapping("/api/courses/{courseId}/lessons")
    public ResponseEntity<List<LessonSummaryResponse>> getLessons(@PathVariable Long courseId) {
        return ResponseEntity.ok(lessonService.getPublicLessons(courseId));
    }
}
