package com.onlinecourse.backend.dto.request;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUserUpsertRequest(
        @Email(message = "Email khong dung dinh dang")
        String email,

        @NotBlank(message = "Ho va ten khong duoc de trong")
        @Size(min = 2, max = 100, message = "Ho va ten tu 2 den 100 ky tu")
        String fullName,

        String phone,

        Role role,

        UserStatus status,

        String password,

        String newPassword
) {
}

