package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.SoulProfileDto;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConnectionService {

    private final UserRepository userRepository;

    public List<SoulProfileDto> discoverConnections(String currentEmail) {
        // Return 5 random users for now
        List<User> users = userRepository.findAll();
        
        return users.stream()
                .filter(u -> !u.getEmail().equals(currentEmail)) // Don't include self
                .limit(5)
                .map(u -> {
                    String personality = "Seeker"; // Default or parse from UserProfile
                    if (u.getProfile() != null && u.getProfile().getQ1LifeFeeling() != null) {
                        personality = u.getProfile().getQ1LifeFeeling().equalsIgnoreCase("growing") ? "Builder" : "Seeker";
                    }

                    return SoulProfileDto.builder()
                            .soulId(u.getSoulId())
                            .displayName(u.getDisplayName())
                            .personalityType(personality)
                            .currentMoodEmoji("✨") // Mock
                            .statusMessage("Đang tìm kiếm sự bình yên") // Mock
                            .build();
                })
                .collect(Collectors.toList());
    }
}
