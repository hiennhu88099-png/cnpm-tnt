package com.onlinecourse.backend.dto.request;

import lombok.Data;

@Data
public class BannerUpsertRequest {
    private String title;
    private String imageUrl;
    private String link;
    private String type;
    private Integer position;
    private Boolean active;
}

