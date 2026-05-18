package com.soulmirror.backend.dto;

import com.soulmirror.backend.enums.MoodLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class JournalRequest {
    private String content;
    private String q1BestThing;
    private String q2Challenge;
    private String q3TomorrowChange;
    private UUID moodId;
    private UUID tarotHistoryId;
}
