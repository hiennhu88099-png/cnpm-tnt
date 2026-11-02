package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.response.LearningLessonResponse;
import com.onlinecourse.backend.dto.response.ProgressResponse;
import com.onlinecourse.backend.service.LearningService;
import com.onlinecourse.backend.service.CurrentUserService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;
    private final CurrentUserService userService;

    // Danh sach bai hoc co video
    @GetMapping("/api/learning/courses/{courseId}/lessons")
    public List<LearningLessonResponse> lessons(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long courseId) {

        return learningService.lessons(
            userService.current(jwt),
            courseId
        );
    }

    // Danh dau hoan thanh bai hoc
    @PostMapping("/api/lessons/{lessonId}/complete")
    public ProgressResponse complete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long lessonId) {

        return learningService.complete(
            userService.current(jwt),
            lessonId
        );
    }

    // Xem tien do khoa hoc
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/courses/{courseId}/progress")
    public ProgressResponse progress(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long courseId) {

        return learningService.progress(
            userService.current(jwt),
            courseId
        );
    }
}
