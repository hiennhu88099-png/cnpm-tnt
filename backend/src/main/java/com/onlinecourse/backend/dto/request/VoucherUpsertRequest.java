package com.onlinecourse.backend.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VoucherUpsertRequest {
    private String code;
    private String type;
    private BigDecimal value;
    private BigDecimal maxDiscount;
    private BigDecimal minOrderAmount;
    private String description;
    private String endDate;
    private Boolean active;
}

