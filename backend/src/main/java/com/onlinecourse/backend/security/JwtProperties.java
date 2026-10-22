package com.onlinecourse.backend.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, Duration expiration) {

    public JwtProperties {
        // HS256 needs a key of at least 256 bits; fail at startup instead of on the first login
        if (secret == null || secret.getBytes().length < 32) {
            throw new IllegalStateException("app.jwt.secret (env JWT_SECRET) must be set and at least 32 characters long");
        }
        if (expiration == null) {
            expiration = Duration.ofHours(1);
        }
    }
}
