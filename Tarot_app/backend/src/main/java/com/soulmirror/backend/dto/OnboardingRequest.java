package com.soulmirror.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class OnboardingRequest {
    private LocalDate birthDate;
    private String q1LifeFeeling;
    private String q2SupportStyle;
    private String q3Challenge;
    private String q4MorningMood;
    private String q5SelfDescribe;
}
