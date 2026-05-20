package com.soulmirror.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private LocalDate birthDate;

    // 5 Onboarding questions (Module A)
    @Column(length = 50)
    private String q1LifeFeeling; // "growing", "stuck", "searching", "healing", "thriving"
    
    @Column(length = 50)
    private String q2SupportStyle; // "listener", "advice", "presence", "space"
    
    @Column(length = 50)
    private String q3Challenge; // "relationships", "career", "identity", "health", "purpose"
    
    @Column(length = 50)
    private String q4MorningMood; // "foggy", "hopeful", "anxious", "peaceful", "energized"
    
    @Column(columnDefinition = "TEXT")
    private String q5SelfDescribe;

    @Column(length = 30)
    private String personalityType; // Computed: "Seeker", "Healer", "Dreamer", "Builder", "Guardian"

    @Column(columnDefinition = "TEXT")
    private String innerProfileJson; // JSON string holding complex dynamic inner profile stats (Module O)

    private boolean onboardingCompleted = false;

    private String birthTime; // format: "HH:mm"

    private String birthPlace; // e.g. "Hanoi, Vietnam"

    @Column(columnDefinition = "TEXT")
    private String natalChartJson; // Cache computed birth chart JSON

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
