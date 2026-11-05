package com.onlinecourse.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String type = "percent";

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal value = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "max_discount", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxDiscount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "min_order_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String description;

    @Column(name = "end_date", length = 20)
    private String endDate;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

