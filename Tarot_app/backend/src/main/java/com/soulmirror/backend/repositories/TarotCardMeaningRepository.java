package com.soulmirror.backend.repositories;

import com.soulmirror.backend.entities.TarotCardMeaning;
import com.soulmirror.backend.enums.MoodLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TarotCardMeaningRepository extends JpaRepository<TarotCardMeaning, Long> {
    List<TarotCardMeaning> findByTarotCardIdAndMoodContext(Long cardId, MoodLevel moodContext);
    List<TarotCardMeaning> findByTarotCardId(Long cardId);
}
