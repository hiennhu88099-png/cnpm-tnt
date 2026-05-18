package com.soulmirror.backend.repositories;

import com.soulmirror.backend.entities.Mood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MoodRepository extends JpaRepository<Mood, UUID> {
    List<Mood> findByUserIdOrderByLoggedAtDesc(UUID userId);
    List<Mood> findByUserIdAndLoggedAtBetweenOrderByLoggedAtDesc(UUID userId, LocalDateTime start, LocalDateTime end);
}
