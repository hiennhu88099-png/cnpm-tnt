package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.TarotDrawRequest;
import com.soulmirror.backend.dto.TarotDrawResponse;
import com.soulmirror.backend.services.TarotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.soulmirror.backend.services.GeminiService;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tarot")
@RequiredArgsConstructor
public class TarotController {

    private final TarotService tarotService;
    private final GeminiService geminiService;

    @PostMapping("/draw")
    public ResponseEntity<?> drawCard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TarotDrawRequest request
    ) {
        try {
            return ResponseEntity.ok(tarotService.drawCard(userDetails.getUsername(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(
            @RequestBody Map<String, String> body
    ) {
        String message = body.getOrDefault("message", "");
        String history = body.getOrDefault("history", "");
        String response = geminiService.chatWithAI(message, history);
        return ResponseEntity.ok(Map.of("response", response));
    }
}
