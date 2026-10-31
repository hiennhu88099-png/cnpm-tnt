package com.onlinecourse.backend.dto.request;

import com.onlinecourse.backend.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "Trang thai khong duoc de trong")
        UserStatus status
) {
}