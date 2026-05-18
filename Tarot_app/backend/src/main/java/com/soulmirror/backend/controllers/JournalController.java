package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.JournalDto;
import com.soulmirror.backend.dto.JournalRequest;
import com.soulmirror.backend.services.JournalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/journals")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @PostMapping
    public ResponseEntity<JournalDto> createEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody JournalRequest request
    ) {
        return ResponseEntity.ok(journalService.createEntry(userDetails.getUsername(), request));
    }

    @GetMapping
    public ResponseEntity<List<JournalDto>> getEntries(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(journalService.getUserEntries(userDetails.getUsername()));
    }
}
