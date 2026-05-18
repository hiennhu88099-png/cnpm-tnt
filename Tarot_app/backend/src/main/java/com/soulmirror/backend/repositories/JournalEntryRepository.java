package com.soulmirror.backend.repositories;

import com.soulmirror.backend.entities.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {
    List<JournalEntry> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
