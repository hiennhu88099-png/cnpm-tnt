package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.MoodDto;
import com.soulmirror.backend.entities.Mood;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.repositories.MoodRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MoodService {

    private final MoodRepository moodRepository;
    private final UserRepository userRepository;

    public MoodDto saveMood(String email, MoodDto moodDto) {
        User user = userRepository.findByEmail(email).orElseThrow();

        Mood mood = Mood.builder()
                .user(user)
                .level(moodDto.getMoodLevel())
                .note(moodDto.getNote())
                .loggedAt(java.time.LocalDateTime.now())
                .build();

        Mood saved = moodRepository.save(mood);
        return MoodDto.builder()
                .moodLevel(saved.getLevel())
                .note(saved.getNote())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public List<MoodDto> getUserMoods(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return moodRepository.findByUserIdOrderByLoggedAtDesc(user.getId())
                .stream()
                .map(m -> MoodDto.builder()
                        .moodLevel(m.getLevel())
                        .note(m.getNote())
                        .createdAt(m.getLoggedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
