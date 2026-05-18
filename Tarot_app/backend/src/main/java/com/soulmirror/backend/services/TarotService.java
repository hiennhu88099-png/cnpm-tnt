package com.soulmirror.backend.services;

import com.soulmirror.backend.dto.TarotDrawRequest;
import com.soulmirror.backend.dto.TarotDrawResponse;
import com.soulmirror.backend.entities.TarotCard;
import com.soulmirror.backend.entities.TarotCardMeaning;
import com.soulmirror.backend.entities.TarotHistory;
import com.soulmirror.backend.entities.User;
import com.soulmirror.backend.repositories.TarotCardMeaningRepository;
import com.soulmirror.backend.repositories.TarotCardRepository;
import com.soulmirror.backend.repositories.TarotHistoryRepository;
import com.soulmirror.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TarotService {

    private final TarotCardRepository tarotCardRepository;
    private final TarotCardMeaningRepository meaningRepository;
    private final TarotHistoryRepository historyRepository;
    private final UserRepository userRepository;

    public TarotDrawResponse drawCard(String email, TarotDrawRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();
        
        List<TarotCard> allCards = tarotCardRepository.findAll();
        if (allCards.isEmpty()) {
            // Provide a fallback if database is empty for testing
            List<String> fallbackNames = List.of(
                "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
                "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
                "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
                "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
                "Judgement", "The World"
            );
            String randomCard = fallbackNames.get(new Random().nextInt(fallbackNames.size()));
            return new TarotDrawResponse(randomCard, "", "🔮", "Vũ trụ đang gửi thông điệp...", "Hãy lắng nghe.");
        }
        
        // Randomly pick a card
        TarotCard drawnCard = allCards.get(new Random().nextInt(allCards.size()));

        // Find meaning based on mood
        List<TarotCardMeaning> meanings = meaningRepository.findByTarotCardIdAndMoodContext(drawnCard.getId(), request.getCurrentMood());
        
        String message = drawnCard.getArcana(); // Placeholder since description is not present
        String advice = "Hãy lắng nghe trực giác của bạn.";
        
        if (!meanings.isEmpty()) {
            TarotCardMeaning meaning = meanings.get(0);
            message = meaning.getMessageUpright();
            advice = meaning.getActionSuggestion();
        }

        // Save history
        TarotHistory history = TarotHistory.builder()
                .user(user)
                .card(drawnCard)
                .moodAtDrawTime(request.getCurrentMood())
                .displayedMessage(message)
                .build();
        historyRepository.save(history);

        return TarotDrawResponse.builder()
                .cardName(drawnCard.getNameVi())
                .imageUrl(drawnCard.getImagePath())
                .emoji("🔮") // Simplification, could be added to DB
                .message(message)
                .advice(advice)
                .build();
    }
}
