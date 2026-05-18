package com.soulmirror.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "journal_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String q1BestThing;
    private String q2Challenge;
    private String q3TomorrowChange;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mood_id")
    private Mood mood;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarot_history_id")
    private TarotHistory tarotHistory;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
