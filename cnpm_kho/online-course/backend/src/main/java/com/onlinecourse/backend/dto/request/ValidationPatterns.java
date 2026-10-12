package com.onlinecourse.backend.dto.request;

public final class ValidationPatterns {

    // Vietnamese phone: 0xxxxxxxxx or +84xxxxxxxxx; empty string is allowed so the field stays optional
    public static final String PHONE = "^$|^(0|\\+84)\\d{9}$";
    public static final String PHONE_MESSAGE = "Phone must be 10 digits starting with 0 (or +84 followed by 9 digits)";

    private ValidationPatterns() {
    }
}
