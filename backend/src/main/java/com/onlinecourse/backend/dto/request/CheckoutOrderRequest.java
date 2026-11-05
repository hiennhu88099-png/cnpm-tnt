package com.onlinecourse.backend.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CheckoutOrderRequest {
    private String orderCode;
    private List<Long> courseIds;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String voucherCode;
    private String paymentMethod;
}

