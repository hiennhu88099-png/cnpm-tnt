package com.soulmirror.backend.entities;

import com.soulmirror.backend.enums.MoodLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "moods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mood {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MoodLevel level;

    // e.g. ["happy", "anxious", "hopeful"]
    @ElementCollection
    @CollectionTable(name = "mood_emotions", joinColumns = @JoinColumn(name = "mood_id"))
    @Column(name = "emotion")
    private List<String> emotions;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false)
    private LocalDateTime loggedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
