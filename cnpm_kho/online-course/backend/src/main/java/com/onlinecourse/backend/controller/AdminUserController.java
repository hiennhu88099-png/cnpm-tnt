package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.UpdateUserStatusRequest;
import com.onlinecourse.backend.dto.response.AdminUserResponse;
import com.onlinecourse.backend.service.AdminUserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<AdminUserResponse> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @PatchMapping("/{id}/status")
    public AdminUserResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long adminId = Long.valueOf(jwt.getSubject());

        return adminUserService.updateStatus(
                id,
                request.status(),
                adminId
        );
    }
}