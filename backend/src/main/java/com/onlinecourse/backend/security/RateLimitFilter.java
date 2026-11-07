package com.onlinecourse.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Bộ lọc bảo vệ chống tấn công DoS & Brute-force (Rate Limiting theo IP).
 * - Giới hạn chặt với các API xác thực (/api/auth/login, /api/auth/register) để chống dò mật khẩu.
 * - Giới hạn tổng lưu lượng cho các API còn lại để chống spam / flood request.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;

    @Value("${app.security.rate-limit.auth-per-minute:20}")
    private int authLimitPerMinute;

    @Value("${app.security.rate-limit.api-per-minute:300}")
    private int apiLimitPerMinute;

    private final Map<String, WindowBucket> buckets = new ConcurrentHashMap<>();

    public void resetBuckets() {
        buckets.clear();
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Bổ sung các HTTP Security Headers chống Clickjacking, MIME-sniffing & rò rỉ Referrer
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

        String uri = request.getRequestURI();
        if (uri == null || !uri.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean isAuthAttempt = uri.equals("/api/auth/login") || uri.equals("/api/auth/register");
        int maxAllowed = isAuthAttempt ? authLimitPerMinute : apiLimitPerMinute;
        String bucketKey = (isAuthAttempt ? "AUTH:" : "API:") + resolveClientIp(request);

        long now = System.currentTimeMillis();
        WindowBucket bucket = buckets.compute(bucketKey, (key, existing) -> {
            if (existing == null || now - existing.windowStartMs >= WINDOW_MS) {
                return new WindowBucket(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        int currentCount = bucket.count.get();
        int remaining = Math.max(0, maxAllowed - currentCount);
        response.setHeader("X-RateLimit-Limit", String.valueOf(maxAllowed));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        if (currentCount > maxAllowed) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("""
                    {"status":429,"message":"Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau 1 phút."}
                    """.trim());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private record WindowBucket(long windowStartMs, AtomicInteger count) {
    }
}

