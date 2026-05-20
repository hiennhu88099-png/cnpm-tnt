package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.ProfileStatsDto;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.entities.Mood;
import com.soulmirror.backend.entities.TarotHistory;
import com.soulmirror.backend.entities.JournalEntry;
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

        List<TarotHistory> tarotHistories = tarotHistoryRepository.findByUserIdOrderByDrawnAtDesc(user.getId());
        int tarotCount = tarotHistories.size();

        List<JournalEntry> journals = journalEntryRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        int journalCount = journals.size();

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

        // Calculate consecutive streak based on active dates in Vietnam timezone (Asia/Ho_Chi_Minh)
        java.time.ZoneId vnZone = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        java.util.Set<java.time.LocalDate> activeDates = new java.util.HashSet<>();

        for (Mood m : moods) {
            if (m.getLoggedAt() != null) {
                activeDates.add(m.getLoggedAt().toLocalDate());
            }
        }
        for (TarotHistory th : tarotHistories) {
            if (th.getDrawnAt() != null) {
                activeDates.add(th.getDrawnAt().toLocalDate());
            }
        }
        for (JournalEntry j : journals) {
            if (j.getCreatedAt() != null) {
                activeDates.add(j.getCreatedAt().toLocalDate());
            }
        }

        int streak = 0;
        java.time.LocalDate today = java.time.LocalDate.now(vnZone);
        
        if (!activeDates.isEmpty()) {
            if (activeDates.contains(today)) {
                streak = 1;
                java.time.LocalDate checkDate = today.minusDays(1);
                while (activeDates.contains(checkDate)) {
                    streak++;
                    checkDate = checkDate.minusDays(1);
                }
            } else if (activeDates.contains(today.minusDays(1))) {
                streak = 1;
                java.time.LocalDate checkDate = today.minusDays(2);
                while (activeDates.contains(checkDate)) {
                    streak++;
                    checkDate = checkDate.minusDays(1);
                }
            }
        }

        return ProfileStatsDto.builder()
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .personalityType(personality)
                .currentStreak(streak)
                .tarotDrawnCount(tarotCount)
                .journalCount(journalCount)
                .mostFrequentMood(mostFrequentMood)
                .build();
    }
}
