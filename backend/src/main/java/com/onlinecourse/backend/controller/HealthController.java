package com.onlinecourse.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "online-course-backend");

        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            boolean dbUp = result != null && result == 1;
            body.put("status", dbUp ? "UP" : "DEGRADED");
            body.put("database", dbUp ? "UP" : "DOWN");
            body.put("timestamp", Instant.now().toString());
            return ResponseEntity.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(body);
        } catch (Exception ex) {
            body.put("status", "DOWN");
            body.put("database", "DOWN");
            body.put("timestamp", Instant.now().toString());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
        }
    }
}

