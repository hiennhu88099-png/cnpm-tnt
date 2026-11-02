package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.EnrollmentRequest;
import com.onlinecourse.backend.dto.response.EnrollmentResponse;
import com.onlinecourse.backend.service.EnrollmentService;
import com.onlinecourse.backend.service.CurrentUserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final CurrentUserService userService;

    // ÄÄƒng kÃ½ khÃ³a há»c
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EnrollmentResponse enroll(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody EnrollmentRequest request) {

        return enrollmentService.enroll(
            userService.current(jwt),
            request.courseId()
        );
    }

    // Danh sÃ¡ch khÃ³a há»c cá»§a tÃ´i
    @GetMapping("/my-courses")
    public List<EnrollmentResponse> myCourses(
            @AuthenticationPrincipal Jwt jwt) {

        return enrollmentService.myCourses(
            userService.current(jwt)
        );
    }

    // Chi tiáº¿t Ä‘Äƒng kÃ½
    @GetMapping("/{id}")
    public EnrollmentResponse detail(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {

        return enrollmentService.detail(
            userService.current(jwt),
            id
        );
    }
}

