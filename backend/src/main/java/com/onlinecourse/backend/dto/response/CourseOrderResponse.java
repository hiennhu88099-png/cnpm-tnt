package com.onlinecourse.backend.dto.response;

import com.onlinecourse.backend.entity.CourseOrder;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CourseOrderResponse {
    private Long id;
    private String orderCode;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String courseIdsCsv;
    private String courseTitles;
    private BigDecimal subtotalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String voucherCode;
    private String paymentMethod;
    private String status;
    private LocalDateTime createdAt;

    public static CourseOrderResponse from(CourseOrder order) {
        return CourseOrderResponse.builder()
            .id(order.getId())
            .orderCode(order.getOrderCode())
            .userId(order.getUser().getId())
            .userFullName(order.getUser().getFullName())
            .userEmail(order.getUser().getEmail())
            .courseIdsCsv(order.getCourseIdsCsv())
            .courseTitles(order.getCourseTitles())
            .subtotalAmount(order.getSubtotalAmount())
            .discountAmount(order.getDiscountAmount())
            .finalAmount(order.getFinalAmount())
            .voucherCode(order.getVoucherCode())
            .paymentMethod(order.getPaymentMethod())
            .status(order.getStatus())
            .createdAt(order.getCreatedAt())
            .build();
    }
}

