package com.soulmirror.backend.repositories;

import com.soulmirror.backend.entities.SoulMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SoulMessageRepository extends JpaRepository<SoulMessage, UUID> {
    
    @Query("SELECT m FROM SoulMessage m WHERE (m.senderSoulId = :user1 AND m.receiverSoulId = :user2) OR (m.senderSoulId = :user2 AND m.receiverSoulId = :user1) ORDER BY m.sentAt ASC")
    List<SoulMessage> findChatHistory(@Param("user1") String user1, @Param("user2") String user2);
}
