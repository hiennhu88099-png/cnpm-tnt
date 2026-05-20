package com.soulmirror.backend.entities;

import com.soulmirror.backend.enums.MoodLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tarot_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TarotHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarot_card_id", nullable = false)
    private TarotCard card;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MoodLevel moodAtDrawTime;

    @Column(columnDefinition = "TEXT")
    private String displayedMessage;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime drawnAt;
}
