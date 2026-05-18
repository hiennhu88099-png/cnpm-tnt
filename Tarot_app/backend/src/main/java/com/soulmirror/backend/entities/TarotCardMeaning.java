package com.soulmirror.backend.entities;

import com.soulmirror.backend.enums.MoodLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tarot_card_meanings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TarotCardMeaning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private TarotCard tarotCard;

    @Enumerated(EnumType.STRING)
    private MoodLevel moodContext; // Null means default meaning regardless of mood

    @Column(length = 30)
    private String personalityType; // Null means default meaning

    @Column(columnDefinition = "TEXT", nullable = false)
    private String messageUpright;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String messageReversed;

    @Column(columnDefinition = "TEXT")
    private String reflectionPrompt; // Câu hỏi gợi mở viết Journal

    @Column(columnDefinition = "TEXT")
    private String actionSuggestion; // Đề xuất hành động nhỏ
}
