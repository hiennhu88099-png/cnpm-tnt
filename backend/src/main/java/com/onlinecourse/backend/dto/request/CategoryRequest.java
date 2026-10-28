package com.onlinecourse.backend.dto.request;

import com.onlinecourse.backend.entity.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Admin payload for creating or updating a category.
 * status is optional: new categories default to ACTIVE, updates keep the current status when it is omitted.
 */
@Data
public class CategoryRequest {
    @NotBlank(message = "Category name is required")
    @Size(max = 150, message = "Category name must be at most 150 characters")
    private String name;

    @Size(max = 5000, message = "Description must be at most 5000 characters")
    private String description;

    @Size(max = 500, message = "Image URL must be at most 500 characters")
    @Pattern(regexp = "^$|^https?://.+", message = "Image must be an http(s) URL")
    private String image;

    private CategoryStatus status;
}
