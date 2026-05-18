package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.AuthResponse;
import com.soulmirror.backend.dto.LoginRequest;
import com.soulmirror.backend.dto.OnboardingRequest;
import com.soulmirror.backend.dto.RegisterRequest;
import com.soulmirror.backend.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/onboarding")
    public ResponseEntity<String> submitOnboarding(@RequestBody OnboardingRequest request, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        String email = authentication.getName();
        authService.submitOnboarding(email, request);
        return ResponseEntity.ok("Onboarding completed successfully");
    }
}
