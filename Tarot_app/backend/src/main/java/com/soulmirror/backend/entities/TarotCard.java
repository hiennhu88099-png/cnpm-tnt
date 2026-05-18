package com.soulmirror.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tarot_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TarotCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nameVi;

    @Column(nullable = false, length = 100)
    private String nameEn;

    @Column(nullable = false, length = 20)
    private String arcana; // "major" or "minor"

    @Column(length = 20)
    private String suit; // "cups", "wands", "swords", "pentacles" (null for major)

    private Integer number;

    @ElementCollection
    @CollectionTable(name = "tarot_card_keywords_upright", joinColumns = @JoinColumn(name = "card_id"))
    @Column(name = "keyword")
    private List<String> keywordsUpright;

    @ElementCollection
    @CollectionTable(name = "tarot_card_keywords_reversed", joinColumns = @JoinColumn(name = "card_id"))
    @Column(name = "keyword")
    private List<String> keywordsReversed;

    private String imagePath;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
