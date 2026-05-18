package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.JournalDto;
import com.soulmirror.backend.dto.JournalRequest;
import com.soulmirror.backend.entities.JournalEntry;
import com.soulmirror.backend.entities.Mood;
import com.soulmirror.backend.entities.TarotHistory;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.repositories.JournalEntryRepository;
import com.soulmirror.backend.repositories.MoodRepository;
import com.soulmirror.backend.repositories.TarotHistoryRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalRepository;
    private final UserRepository userRepository;
    private final MoodRepository moodRepository;
    private final TarotHistoryRepository tarotHistoryRepository;

    public JournalDto createEntry(String email, JournalRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();

        Mood mood = null;
        if (request.getMoodId() != null) {
            mood = moodRepository.findById(request.getMoodId()).orElse(null);
        }

        TarotHistory tarotHistory = null;
        if (request.getTarotHistoryId() != null) {
            tarotHistory = tarotHistoryRepository.findById(request.getTarotHistoryId()).orElse(null);
        }

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .content(request.getContent())
                .q1BestThing(request.getQ1BestThing())
                .q2Challenge(request.getQ2Challenge())
                .q3TomorrowChange(request.getQ3TomorrowChange())
                .mood(mood)
                .tarotHistory(tarotHistory)
                .build();

        JournalEntry saved = journalRepository.save(entry);

        return mapToDto(saved);
    }

    public List<JournalDto> getUserEntries(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return journalRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private JournalDto mapToDto(JournalEntry entry) {
        String moodEmoji = entry.getMood() != null ? entry.getMood().getLevel().name() : null; // simplified
        String cardName = entry.getTarotHistory() != null ? entry.getTarotHistory().getCard().getNameVi() : null;

        return JournalDto.builder()
                .id(entry.getId().toString())
                .content(entry.getContent())
                .q1BestThing(entry.getQ1BestThing())
                .q2Challenge(entry.getQ2Challenge())
                .q3TomorrowChange(entry.getQ3TomorrowChange())
                .moodEmoji(moodEmoji)
                .tarotCardName(cardName)
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
