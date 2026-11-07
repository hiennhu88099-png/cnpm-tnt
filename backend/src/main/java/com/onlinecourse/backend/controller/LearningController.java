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
import java.util.Map;

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

    // Luu vi tri giay dang xem video xuong DB (Resume Playback)
    @PutMapping("/api/lessons/{lessonId}/watch-position")
    public Map<String, Object> saveWatchPosition(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long lessonId,
            @RequestBody Map<String, Object> payload) {

        int lastWatchedSecond = 0;
        Object raw = payload != null ? payload.get("lastWatchedSecond") : null;
        if (raw instanceof Number num) {
            lastWatchedSecond = num.intValue();
        } else if (raw != null) {
            try {
                lastWatchedSecond = Integer.parseInt(raw.toString());
            } catch (NumberFormatException ignored) {
                lastWatchedSecond = 0;
            }
        }

        return learningService.saveWatchPosition(
            userService.current(jwt),
            lessonId,
            lastWatchedSecond
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
