package com.onlinecourse.backend.config;

import com.onlinecourse.backend.entity.Banner;
import com.onlinecourse.backend.entity.Voucher;
import com.onlinecourse.backend.repository.BannerRepository;
import com.onlinecourse.backend.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ShopDataInitializer implements CommandLineRunner {

    private final VoucherRepository voucherRepository;
    private final BannerRepository bannerRepository;

    @Override
    public void run(String... args) {
        if (voucherRepository.count() == 0) {
            voucherRepository.saveAll(List.of(
                Voucher.builder()
                    .code("NEWSTUDENT")
                    .type("percent")
                    .value(new BigDecimal("20"))
                    .maxDiscount(new BigDecimal("100000"))
                    .minOrderAmount(BigDecimal.ZERO)
                    .description("Ưu đãi 20% (tối đa 100K) dành cho học viên đăng ký khóa học mới")
                    .endDate("2026-12-31")
                    .active(true)
                    .build(),
                Voucher.builder()
                    .code("EDUHUB50")
                    .type("fixed")
                    .value(new BigDecimal("50000"))
                    .maxDiscount(new BigDecimal("50000"))
                    .minOrderAmount(new BigDecimal("150000"))
                    .description("Giảm trực tiếp 50.000đ cho đơn đăng ký khóa học từ 150.000đ")
                    .endDate("2026-12-31")
                    .active(true)
                    .build(),
                Voucher.builder()
                    .code("FULLSTACK100")
                    .type("fixed")
                    .value(new BigDecimal("100000"))
                    .maxDiscount(new BigDecimal("100000"))
                    .minOrderAmount(new BigDecimal("400000"))
                    .description("Giảm 100.000đ cho các khóa học chuyên sâu từ 400.000đ")
                    .endDate("2026-12-31")
                    .active(true)
                    .build(),
                Voucher.builder()
                    .code("COMBO150K")
                    .type("fixed")
                    .value(new BigDecimal("150000"))
                    .maxDiscount(new BigDecimal("150000"))
                    .minOrderAmount(new BigDecimal("600000"))
                    .description("Giảm 150.000đ khi mua combo nhiều khóa học từ 600.000đ")
                    .endDate("2026-12-31")
                    .active(true)
                    .build()
            ));
        }

        if (bannerRepository.count() == 0) {
            bannerRepository.saveAll(List.of(
                Banner.builder()
                    .title("Siêu Hội Học Tập EduHub 2026 - Ưu đãi đến 50%")
                    .imageUrl("/banners/hero-main-1.svg")
                    .link("/courses")
                    .type("HomeMain")
                    .position(1)
                    .active(true)
                    .build(),
                Banner.builder()
                    .title("Combo Lập Trình & AI - Tiết kiệm đến 150.000đ")
                    .imageUrl("/banners/promo-left.svg")
                    .link("/courses")
                    .type("Promo")
                    .position(2)
                    .active(true)
                    .build(),
                Banner.builder()
                    .title("Kho Khóa Học Miễn Phí 0đ - Học thử không giới hạn")
                    .imageUrl("/banners/side-right-1.svg")
                    .link("/courses")
                    .type("Side")
                    .position(3)
                    .active(true)
                    .build(),
                Banner.builder()
                    .title("Ưu đãi 50% Khóa học Fullstack & AI")
                    .imageUrl("/banners/float-left.svg")
                    .link("/courses")
                    .type("FloatLeft")
                    .position(4)
                    .active(true)
                    .build(),
                Banner.builder()
                    .title("Nhập mã EDUHUB50 giảm ngay 50.000đ")
                    .imageUrl("/banners/float-right.svg")
                    .link("/cart")
                    .type("FloatRight")
                    .position(5)
                    .active(true)
                    .build()
            ));
        }
    }
}

