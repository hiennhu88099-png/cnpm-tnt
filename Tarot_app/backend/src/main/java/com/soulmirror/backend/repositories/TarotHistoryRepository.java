package com.soulmirror.backend.repositories;

import com.soulmirror.backend.entities.TarotHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TarotHistoryRepository extends JpaRepository<TarotHistory, UUID> {
    List<TarotHistory> findByUserIdOrderByDrawnAtDesc(UUID userId);
}
