package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.ProfileStatsDto;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.entities.Mood;
import com.soulmirror.backend.enums.MoodLevel;
import com.soulmirror.backend.repositories.JournalEntryRepository;
import com.soulmirror.backend.repositories.MoodRepository;
import com.soulmirror.backend.repositories.TarotHistoryRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final TarotHistoryRepository tarotHistoryRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final MoodRepository moodRepository;

    public ProfileStatsDto getProfileStats(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();

        int tarotCount = tarotHistoryRepository.findByUserIdOrderByDrawnAtDesc(user.getId()).size();
        int journalCount = journalEntryRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();

        List<Mood> moods = moodRepository.findByUserIdOrderByLoggedAtDesc(user.getId());
        String mostFrequentMood = "Chưa có";
        if (!moods.isEmpty()) {
            Map<MoodLevel, Long> moodCounts = moods.stream()
                    .collect(Collectors.groupingBy(Mood::getLevel, Collectors.counting()));
            
            MoodLevel topMood = moodCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(MoodLevel.NEUTRAL);
            
            mostFrequentMood = topMood.name();
        }

        String personality = "Seeker";
        if (user.getProfile() != null && user.getProfile().getQ1LifeFeeling() != null) {
            personality = user.getProfile().getQ1LifeFeeling().equalsIgnoreCase("growing") ? "Builder" : "Seeker";
        }

        return ProfileStatsDto.builder()
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .personalityType(personality)
                .currentStreak(moods.isEmpty() ? 0 : 1) // Simplified streak logic
                .tarotDrawnCount(tarotCount)
                .journalCount(journalCount)
                .mostFrequentMood(mostFrequentMood)
                .build();
    }
}
