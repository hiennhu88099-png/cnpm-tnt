package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.MoodDto;
import com.soulmirror.backend.services.MoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/moods")
@RequiredArgsConstructor
public class MoodController {

    private final MoodService moodService;

    @PostMapping
    public ResponseEntity<MoodDto> saveMood(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody MoodDto moodDto
    ) {
        return ResponseEntity.ok(moodService.saveMood(userDetails.getUsername(), moodDto));
    }

    @GetMapping
    public ResponseEntity<List<MoodDto>> getMoods(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(moodService.getUserMoods(userDetails.getUsername()));
    }
}
