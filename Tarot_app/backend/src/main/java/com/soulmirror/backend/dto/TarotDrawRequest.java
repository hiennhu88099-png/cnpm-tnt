package com.soulmirror.backend.dto;

import com.soulmirror.backend.enums.MoodLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TarotDrawRequest {
    private MoodLevel currentMood;
    private int numberOfCards; // 1 to 3
    private String description;
}
