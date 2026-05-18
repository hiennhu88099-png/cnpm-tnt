package com.soulmirror.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TarotDrawResponse {
    private String cardName;
    private String imageUrl;
    private String emoji;
    private String message;
    private String advice;
}
