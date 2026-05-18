package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.SoulProfileDto;
import com.soulmirror.backend.services.ConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    @GetMapping("/discover")
    public ResponseEntity<List<SoulProfileDto>> discoverConnections(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(connectionService.discoverConnections(userDetails.getUsername()));
    }

    @PostMapping("/poke/{soulId}")
    public ResponseEntity<?> pokeUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String soulId
    ) {
        // Logic to send a notification to soulId
        // Currently just a mock success
        return ResponseEntity.ok(Map.of("message", "Đã gửi năng lượng tích cực!"));
    }
}
