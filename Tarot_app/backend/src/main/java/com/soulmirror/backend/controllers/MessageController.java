package com.soulmirror.backend.controllers;

import com.soulmirror.backend.dto.MessageDto;
import com.soulmirror.backend.entities.SoulMessage;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.repositories.SoulMessageRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageController {

    private final SoulMessageRepository messageRepository;
    private final UserRepository userRepository;

    @GetMapping("/{otherSoulId}")
    public ResponseEntity<List<MessageDto>> getChatHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String otherSoulId
    ) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SoulMessage> history = messageRepository.findChatHistory(currentUser.getSoulId(), otherSoulId);

        List<MessageDto> dtos = history.stream().map(m -> MessageDto.builder()
                .id(m.getId().toString())
                .senderSoulId(m.getSenderSoulId())
                .receiverSoulId(m.getReceiverSoulId())
                .content(m.getContent())
                .sentAt(m.getSentAt())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{otherSoulId}")
    public ResponseEntity<MessageDto> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String otherSoulId,
            @RequestBody Map<String, String> body
    ) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String content = body.getOrDefault("content", "");
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        SoulMessage message = SoulMessage.builder()
                .senderSoulId(currentUser.getSoulId())
                .receiverSoulId(otherSoulId)
                .content(content)
                .build();

        message = messageRepository.save(message);

        return ResponseEntity.ok(MessageDto.builder()
                .id(message.getId().toString())
                .senderSoulId(message.getSenderSoulId())
                .receiverSoulId(message.getReceiverSoulId())
                .content(message.getContent())
                .sentAt(message.getSentAt())
                .build());
    }
}
