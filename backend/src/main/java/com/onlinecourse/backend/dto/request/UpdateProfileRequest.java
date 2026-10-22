package com.onlinecourse.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Fields a user may change on their own profile. Email, role and status are deliberately not editable here.
 */
@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    @Pattern(regexp = ValidationPatterns.PHONE, message = ValidationPatterns.PHONE_MESSAGE)
    private String phone;

    @Size(max = 255, message = "Avatar URL must be at most 255 characters")
    @Pattern(regexp = "^$|^https?://.+", message = "Avatar must be an http(s) URL")
    private String avatar;
}
