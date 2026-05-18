package com.soulmirror.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileStatsDto {
    private String displayName;
    private String email;
    private String personalityType;
    private int currentStreak;
    private int tarotDrawnCount;
    private int journalCount;
    private String mostFrequentMood;
}
