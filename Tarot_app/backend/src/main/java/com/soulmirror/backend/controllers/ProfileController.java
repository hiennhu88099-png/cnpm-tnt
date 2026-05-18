package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.ProfileStatsDto;
import com.soulmirror.backend.services.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/stats")
    public ResponseEntity<ProfileStatsDto> getStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(profileService.getProfileStats(userDetails.getUsername()));
    }
}
