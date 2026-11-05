package com.onlinecourse.backend.controller;

import com.onlinecourse.backend.dto.request.CheckoutOrderRequest;
import com.onlinecourse.backend.dto.response.CourseOrderResponse;
import com.onlinecourse.backend.dto.response.CourseSummaryResponse;
import com.onlinecourse.backend.entity.Banner;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.Voucher;
import com.onlinecourse.backend.service.CurrentUserService;
import com.onlinecourse.backend.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final CurrentUserService currentUserService;

    // --- Public Vouchers, Banners & Payment Config ---

    @GetMapping("/vouchers")
    public List<Voucher> getActiveVouchers() {
        return shopService.getActiveVouchers();
    }

    @GetMapping("/banners")
    public List<Banner> getActiveBanners() {
        return shopService.getActiveBanners();
    }

    @GetMapping("/payment/config")
    public Map<String, Object> getPaymentConfig() {
        return shopService.getPaymentConfig();
    }

    @PostMapping("/webhooks/sepay")
    public Map<String, Object> handleSepayWebhook(
        @RequestHeader(value = "Authorization", required = false) String authHeader,
        @RequestBody Map<String, Object> payload
    ) {
        return shopService.processSepayWebhook(authHeader, payload);
    }

    // --- Authenticated Learner Wishlist ---

    @GetMapping("/wishlists")
    public List<CourseSummaryResponse> getMyWishlist(@AuthenticationPrincipal Jwt jwt) {
        User user = currentUserService.current(jwt);
        return shopService.getUserWishlist(user);
    }

    @PostMapping("/wishlists/{courseId}/toggle")
    public Map<String, Object> toggleWishlist(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable Long courseId
    ) {
        User user = currentUserService.current(jwt);
        return shopService.toggleWishlistItem(user, courseId);
    }

    @DeleteMapping("/wishlists/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeWishlist(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable Long courseId
    ) {
        User user = currentUserService.current(jwt);
        shopService.removeWishlistItem(user, courseId);
    }

    // --- Authenticated Learner Cart ---

    @GetMapping("/cart")
    public List<CourseSummaryResponse> getMyCart(@AuthenticationPrincipal Jwt jwt) {
        User user = currentUserService.current(jwt);
        return shopService.getUserCart(user);
    }

    @PostMapping("/cart/{courseId}")
    public List<CourseSummaryResponse> addToCart(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable Long courseId
    ) {
        User user = currentUserService.current(jwt);
        return shopService.addCartItem(user, courseId);
    }

    @DeleteMapping("/cart/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFromCart(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable Long courseId
    ) {
        User user = currentUserService.current(jwt);
        shopService.removeCartItem(user, courseId);
    }

    @DeleteMapping("/cart")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart(@AuthenticationPrincipal Jwt jwt) {
        User user = currentUserService.current(jwt);
        shopService.clearUserCart(user);
    }

    // --- Authenticated Learner Orders & Checkout ---

    @PostMapping("/orders/pending")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseOrderResponse createPendingOrder(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody CheckoutOrderRequest request
    ) {
        User user = currentUserService.current(jwt);
        return shopService.createPendingOrder(user, request);
    }

    @PostMapping("/orders/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseOrderResponse checkout(
        @AuthenticationPrincipal Jwt jwt,
        @RequestBody CheckoutOrderRequest request
    ) {
        User user = currentUserService.current(jwt);
        return shopService.checkoutOrder(user, request);
    }

    @GetMapping("/orders/{orderCode}/status")
    public CourseOrderResponse getOrderStatus(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable String orderCode
    ) {
        User user = currentUserService.current(jwt);
        return shopService.getOrderStatusByCode(user, orderCode);
    }

    @GetMapping("/orders/my")
    public List<CourseOrderResponse> getMyOrders(@AuthenticationPrincipal Jwt jwt) {
        User user = currentUserService.current(jwt);
        return shopService.getUserOrders(user);
    }
}

