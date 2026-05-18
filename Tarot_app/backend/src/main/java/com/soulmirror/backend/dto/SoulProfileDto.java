package com.soulmirror.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SoulProfileDto {
    private String soulId;
    private String displayName;
    private String personalityType;
    private String currentMoodEmoji;
    private String statusMessage;
}
