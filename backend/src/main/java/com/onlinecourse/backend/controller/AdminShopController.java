package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.BannerUpsertRequest;
import com.onlinecourse.backend.dto.request.VoucherUpsertRequest;
import com.onlinecourse.backend.dto.response.CourseOrderResponse;
import com.onlinecourse.backend.entity.Banner;
import com.onlinecourse.backend.entity.Voucher;
import com.onlinecourse.backend.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminShopController {

    private final ShopService shopService;

    // --- Admin Vouchers ---

    @GetMapping("/vouchers")
    public List<Voucher> getAllVouchers() {
        return shopService.getAllVouchers();
    }

    @PostMapping("/vouchers")
    @ResponseStatus(HttpStatus.CREATED)
    public Voucher createVoucher(@RequestBody VoucherUpsertRequest request) {
        return shopService.upsertVoucher(null, request);
    }

    @PutMapping("/vouchers/{id}")
    public Voucher updateVoucher(@PathVariable Long id, @RequestBody VoucherUpsertRequest request) {
        return shopService.upsertVoucher(id, request);
    }

    @PatchMapping("/vouchers/{id}/toggle")
    public Voucher toggleVoucher(@PathVariable Long id) {
        return shopService.toggleVoucher(id);
    }

    @DeleteMapping("/vouchers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVoucher(@PathVariable Long id) {
        shopService.deleteVoucher(id);
    }

    // --- Admin Banners ---

    @GetMapping("/banners")
    public List<Banner> getAllBanners() {
        return shopService.getAllBanners();
    }

    @PostMapping("/banners")
    @ResponseStatus(HttpStatus.CREATED)
    public Banner createBanner(@RequestBody BannerUpsertRequest request) {
        return shopService.upsertBanner(null, request);
    }

    @PutMapping("/banners/{id}")
    public Banner updateBanner(@PathVariable Long id, @RequestBody BannerUpsertRequest request) {
        return shopService.upsertBanner(id, request);
    }

    @PatchMapping("/banners/{id}/toggle")
    public Banner toggleBanner(@PathVariable Long id) {
        return shopService.toggleBanner(id);
    }

    @DeleteMapping("/banners/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBanner(@PathVariable Long id) {
        shopService.deleteBanner(id);
    }

    // --- Admin Course Orders ---

    @GetMapping("/orders")
    public List<CourseOrderResponse> getAllOrders() {
        return shopService.getAllOrders();
    }
}

