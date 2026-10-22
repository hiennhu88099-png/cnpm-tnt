package com.onlinecourse.backend.exception;

import lombok.Getter;

/**
 * A business rule failed on one specific field (e.g. wrong current password).
 * Returned as 400 in the same shape as bean-validation errors, so the frontend can show it under that field.
 */
@Getter
public class FieldValidationException extends RuntimeException {
    private final String field;

    public FieldValidationException(String field, String message) {
        super(message);
        this.field = field;
    }
}
