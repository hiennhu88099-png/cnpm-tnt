package com.soulmirror.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class JournalDto {
    private String id;
    private String content;
    private String q1BestThing;
    private String q2Challenge;
    private String q3TomorrowChange;
    private String moodEmoji;
    private String tarotCardName;
    private LocalDateTime createdAt;
}
