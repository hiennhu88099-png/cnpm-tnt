package com.onlinecourse.backend.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * Writes security errors in the same JSON shape as GlobalExceptionHandler.
 * Security filters run before the DispatcherServlet, so @RestControllerAdvice never sees these errors.
 */
final class SecurityErrorWriter {

    private SecurityErrorWriter() {
    }

    // Messages are fixed constants (never user input), so no JSON escaping is needed
    static void write(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(String.format(
                "{\"status\":%d,\"message\":\"%s\",\"timestamp\":\"%s\"}",
                status.value(), message, LocalDateTime.now()));
    }
}
