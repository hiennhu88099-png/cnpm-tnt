package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.UserStatus;
import java.time.LocalDateTime;

public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String avatar,
        Role role,
        UserStatus status,
        LocalDateTime createdAt
) {
}