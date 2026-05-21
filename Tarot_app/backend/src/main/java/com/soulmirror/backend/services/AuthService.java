package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.AuthResponse;
import com.soulmirror.backend.dto.LoginRequest;
import com.soulmirror.backend.dto.OnboardingRequest;
import com.soulmirror.backend.dto.RegisterRequest;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.entities.UserProfile;
import com.soulmirror.backend.enums.Role;
import com.soulmirror.backend.repositories.UserProfileRepository;
import com.soulmirror.backend.repositories.UserRepository;
import com.soulmirror.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use.");
        }

        String generatedSoulId = "Soul-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        var user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .soulId(generatedSoulId)
                .role(Role.USER)
                .isActive(true)
                .isVerified(false)
                .build();

        var savedUser = userRepository.save(user);

        // Initialize empty profile
        var profile = UserProfile.builder()
                .user(savedUser)
                .onboardingCompleted(false)
                .build();
        userProfileRepository.save(profile);

        var jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .email(savedUser.getEmail())
                .soulId(savedUser.getSoulId())
                .displayName(savedUser.getDisplayName())
                .onboardingCompleted(false)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        
        var profile = userProfileRepository.findByUserId(user.getId())
                .orElseThrow();

        var jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .soulId(user.getSoulId())
                .displayName(user.getDisplayName())
                .onboardingCompleted(profile.isOnboardingCompleted())
                .build();
    }

    @Transactional
    public void submitOnboarding(String email, OnboardingRequest request) {
        var user = userRepository.findByEmail(email).orElseThrow();
        var profile = userProfileRepository.findByUserId(user.getId()).orElseThrow();

        profile.setBirthDate(request.getBirthDate());
        profile.setBirthTime(request.getBirthTime());
        profile.setBirthPlace(request.getBirthPlace());
        profile.setQ1LifeFeeling(request.getQ1LifeFeeling());
        profile.setQ2SupportStyle(request.getQ2SupportStyle());
        profile.setQ3Challenge(request.getQ3Challenge());
        profile.setQ4MorningMood(request.getQ4MorningMood());
        profile.setQ5SelfDescribe(request.getQ5SelfDescribe());
        
        // Simple mock logic for personality type computation based on Q1
        profile.setPersonalityType(computePersonality(request.getQ1LifeFeeling()));
        profile.setOnboardingCompleted(true);

        userProfileRepository.save(profile);
    }

    private String computePersonality(String q1) {
        if (q1 == null) return "Seeker";
        switch (q1.toLowerCase()) {
            case "growing": return "Builder";
            case "stuck": return "Seeker";
            case "searching": return "Dreamer";
            case "healing": return "Healer";
            case "thriving": return "Guardian";
            default: return "Seeker";
        }
    }
}
