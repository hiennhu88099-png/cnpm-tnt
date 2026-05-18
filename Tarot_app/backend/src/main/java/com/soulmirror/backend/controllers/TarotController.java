package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.TarotDrawRequest;
import com.soulmirror.backend.dto.TarotDrawResponse;
import com.soulmirror.backend.services.TarotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tarot")
@RequiredArgsConstructor
public class TarotController {

    private final TarotService tarotService;

    @PostMapping("/draw")
    public ResponseEntity<TarotDrawResponse> drawCard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody TarotDrawRequest request
    ) {
        return ResponseEntity.ok(tarotService.drawCard(userDetails.getUsername(), request));
    }
}
