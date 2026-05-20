package com.soulmirror.backend.controllers;

import com.soulmirror.backend.services.AstrologyService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/astrology")
@RequiredArgsConstructor
public class AstrologyController {

    private final AstrologyService astrologyService;

    @GetMapping("/natal-chart")
    public ResponseEntity<?> getNatalChart(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            return ResponseEntity.ok(astrologyService.getNatalChart(userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/natal-chart")
    public ResponseEntity<?> calculateNatalChart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody NatalChartRequest request
    ) {
        try {
            String chartJson = astrologyService.calculateNatalChart(
                    userDetails.getUsername(),
                    request.getDay(),
                    request.getMonth(),
                    request.getYear(),
                    request.getHour(),
                    request.getMinute(),
                    request.getBirthPlace()
            );
            // Return raw JSON structure to client
            return ResponseEntity.ok(chartJson);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Data
    public static class NatalChartRequest {
        private int day;
        private int month;
        private int year;
        private int hour;
        private int minute;
        private String birthPlace;
    }
}
