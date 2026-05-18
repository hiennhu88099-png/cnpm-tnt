package com.soulmirror.backend.dto;

import com.soulmirror.backend.enums.MoodLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MoodDto {
    private MoodLevel moodLevel;
    private String note;
    private LocalDateTime createdAt;
}
