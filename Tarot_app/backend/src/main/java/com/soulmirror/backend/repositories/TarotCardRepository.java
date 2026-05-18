package com.soulmirror.backend.repositories;

import com.soulmirror.backend.entities.TarotCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TarotCardRepository extends JpaRepository<TarotCard, Long> {
    Optional<TarotCard> findByNameEn(String nameEn);
}
