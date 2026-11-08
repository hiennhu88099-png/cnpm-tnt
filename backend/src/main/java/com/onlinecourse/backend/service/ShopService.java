package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.request.BannerUpsertRequest;
import com.onlinecourse.backend.dto.request.CheckoutOrderRequest;
import com.onlinecourse.backend.dto.request.VoucherUpsertRequest;
import com.onlinecourse.backend.dto.response.CourseOrderResponse;
import com.onlinecourse.backend.dto.response.CourseSummaryResponse;
import com.onlinecourse.backend.entity.*;
import com.onlinecourse.backend.exception.FieldValidationException;
import com.onlinecourse.backend.exception.ResourceNotFoundException;
import com.onlinecourse.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final VoucherRepository voucherRepository;
    private final BannerRepository bannerRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final CartItemRepository cartItemRepository;
    private final CourseOrderRepository courseOrderRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;

    @Value("${app.payment.bank-code:MB}")
    private String paymentBankCode;

    @Value("${app.payment.bank-name:MB Bank (Ng\u00e2n h\u00e0ng Qu\u00e2n \u0110\u1ed9i)}")
    private String paymentBankName;

    @Value("${app.payment.account-number:0000012345678}")
    private String paymentAccountNumber;

    @Value("${app.payment.account-holder:EDUHUB ACADEMY}")
    private String paymentAccountHolder;

    @Value("${app.payment.transfer-prefix:EDUHUB}")
    private String paymentTransferPrefix;

    @Value("${app.payment.webhook-secret:}")
    private String paymentWebhookSecret;

    public Map<String, Object> getPaymentConfig() {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("bankCode", paymentBankCode);
        cfg.put("bankName", sanitizeUtf8(paymentBankName));
        cfg.put("accountNumber", paymentAccountNumber);
        cfg.put("accountHolder", paymentAccountHolder);
        cfg.put("transferPrefix", paymentTransferPrefix);
        cfg.put("webhookConfigured", paymentWebhookSecret != null && !paymentWebhookSecret.isBlank());
        return cfg;
    }

    private String sanitizeUtf8(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        if (text.contains("Ã") || text.contains("Ä") || text.contains("á»") || text.contains("Â")) {
            try {
                return new String(text.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1), java.nio.charset.StandardCharsets.UTF_8);
            } catch (Exception ignored) {
            }
        }
        return text;
    }

    // =========================================================================
    // VOUCHERS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Voucher> getActiveVouchers() {
        return voucherRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public Voucher upsertVoucher(Long id, VoucherUpsertRequest req) {
        String code = req.getCode() == null ? "" : req.getCode().trim().toUpperCase();
        if (code.length() < 3) {
            throw new FieldValidationException("code", "Mã giảm giá cần tối thiểu 3 ký tự");
        }

        Optional<Voucher> existingByCode = voucherRepository.findByCodeIgnoreCase(code);
        if (existingByCode.isPresent() && (id == null || !existingByCode.get().getId().equals(id))) {
            throw new FieldValidationException("code", "Mã giảm giá " + code + " đã tồn tại");
        }

        Voucher voucher = id != null
            ? voucherRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá"))
            : new Voucher();

        voucher.setCode(code);
        voucher.setType("percent".equalsIgnoreCase(req.getType()) ? "percent" : "fixed");
        voucher.setValue(req.getValue() != null ? req.getValue() : BigDecimal.ZERO);
        voucher.setMaxDiscount(req.getMaxDiscount() != null ? req.getMaxDiscount() : BigDecimal.ZERO);
        voucher.setMinOrderAmount(req.getMinOrderAmount() != null ? req.getMinOrderAmount() : BigDecimal.ZERO);
        voucher.setDescription(req.getDescription() != null ? req.getDescription().trim() : "");
        voucher.setEndDate(req.getEndDate() != null && !req.getEndDate().isBlank() ? req.getEndDate().trim() : "2026-12-31");
        voucher.setActive(req.getActive() == null || req.getActive());

        return voucherRepository.save(voucher);
    }

    @Transactional
    public Voucher toggleVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá"));
        voucher.setActive(!Boolean.TRUE.equals(voucher.getActive()));
        return voucherRepository.save(voucher);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy mã giảm giá");
        }
        voucherRepository.deleteById(id);
    }

    // =========================================================================
    // BANNERS
    // =========================================================================

    @Transactional(readOnly = true)
    public List<Banner> getAllBanners() {
        return bannerRepository.findAllByOrderByPositionAscIdAsc();
    }

    @Transactional(readOnly = true)
    public List<Banner> getActiveBanners() {
        return bannerRepository.findByActiveTrueOrderByPositionAscIdAsc();
    }

    @Transactional
    public Banner upsertBanner(Long id, BannerUpsertRequest req) {
        Banner banner = id != null
            ? bannerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner"))
            : new Banner();

        banner.setTitle(req.getTitle() != null && !req.getTitle().isBlank() ? req.getTitle().trim() : "Banner khuyến mãi");
        banner.setImageUrl(req.getImageUrl() != null && !req.getImageUrl().isBlank() ? req.getImageUrl().trim() : "/banners/hero-main-1.svg");
        banner.setLink(req.getLink() != null && !req.getLink().isBlank() ? req.getLink().trim() : "/courses");
        banner.setType(req.getType() != null && !req.getType().isBlank() ? req.getType().trim() : "HomeMain");
        banner.setPosition(req.getPosition() != null && req.getPosition() > 0 ? req.getPosition() : 1);
        banner.setActive(req.getActive() == null || req.getActive());

        return bannerRepository.save(banner);
    }

    @Transactional
    public Banner toggleBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner"));
        banner.setActive(!Boolean.TRUE.equals(banner.getActive()));
        return bannerRepository.save(banner);
    }

    @Transactional
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy banner");
        }
        bannerRepository.deleteById(id);
    }

    // =========================================================================
    // WISHLIST
    // =========================================================================

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> getUserWishlist(User user) {
        List<WishlistItem> items = wishlistItemRepository.findByUserIdWithCourse(user.getId());
        List<Course> courses = items.stream().map(WishlistItem::getCourse).toList();
        return mapCoursesToSummary(courses);
    }

    @Transactional
    public Map<String, Object> toggleWishlistItem(User user, Long courseId) {
        Optional<WishlistItem> existing = wishlistItemRepository.findByUserIdAndCourseId(user.getId(), courseId);
        boolean added;
        if (existing.isPresent()) {
            wishlistItemRepository.delete(existing.get());
            added = false;
        } else {
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học"));
            wishlistItemRepository.save(WishlistItem.builder().user(user).course(course).build());
            added = true;
        }
        return Map.of("added", added, "courseId", courseId);
    }

    @Transactional
    public void removeWishlistItem(User user, Long courseId) {
        wishlistItemRepository.deleteByUserIdAndCourseId(user.getId(), courseId);
    }

    // =========================================================================
    // SHOPPING CART
    // =========================================================================

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> getUserCart(User user) {
        List<CartItem> items = cartItemRepository.findByUserIdWithCourse(user.getId());
        List<Course> courses = items.stream().map(CartItem::getCourse).toList();
        return mapCoursesToSummary(courses);
    }

    @Transactional
    public List<CourseSummaryResponse> addCartItem(User user, Long courseId) {
        if (cartItemRepository.findByUserIdAndCourseId(user.getId(), courseId).isEmpty()) {
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học"));
            cartItemRepository.save(CartItem.builder().user(user).course(course).build());
        }
        return getUserCart(user);
    }

    @Transactional
    public void removeCartItem(User user, Long courseId) {
        cartItemRepository.deleteByUserIdAndCourseId(user.getId(), courseId);
    }

    @Transactional
    public void clearUserCart(User user) {
        cartItemRepository.deleteByUserId(user.getId());
    }

    // =========================================================================
    // COURSE ORDERS & MULTI-COURSE CHECKOUT
    // =========================================================================

    @Transactional
    public CourseOrderResponse createPendingOrder(User user, CheckoutOrderRequest req) {
        return upsertOrderInternal(user, req, "PENDING");
    }

    @Transactional
    public CourseOrderResponse checkoutOrder(User user, CheckoutOrderRequest req) {
        return upsertOrderInternal(user, req, "COMPLETED");
    }

    private CourseOrderResponse upsertOrderInternal(User user, CheckoutOrderRequest req, String targetStatus) {
        List<Long> courseIds = req.getCourseIds() == null ? List.of() : req.getCourseIds().stream().filter(Objects::nonNull).distinct().toList();
        if (courseIds.isEmpty()) {
            throw new FieldValidationException("courseIds", "Danh sách khóa học thanh toán không được để trống");
        }

        List<Course> courses = courseRepository.findAllById(courseIds);
        if (courses.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy khóa học để thanh toán");
        }

        String requestedCode = req.getOrderCode() != null && !req.getOrderCode().isBlank()
            ? req.getOrderCode().trim().toUpperCase()
            : "EDU" + (System.currentTimeMillis() % 100000000L);

        Optional<CourseOrder> existingOpt = courseOrderRepository.findByOrderCodeWithUser(requestedCode);
        if (existingOpt.isPresent() && Objects.equals(existingOpt.get().getUser().getId(), user.getId())) {
            CourseOrder existing = existingOpt.get();
            if ("COMPLETED".equalsIgnoreCase(targetStatus) && !"COMPLETED".equalsIgnoreCase(existing.getStatus())) {
                existing.setStatus("COMPLETED");
                activateOrderEnrollments(user, courses, courseIds);
                existing = courseOrderRepository.save(existing);
            } else if ("PENDING".equalsIgnoreCase(targetStatus) && "CANCELLED".equalsIgnoreCase(existing.getStatus())) {
                existing.setStatus("PENDING");
                existing.setCreatedAt(LocalDateTime.now());
                existing = courseOrderRepository.save(existing);
            }
            return CourseOrderResponse.from(existing);
        }

        String orderCode = requestedCode;
        if (courseOrderRepository.existsByOrderCode(orderCode)) {
            orderCode = orderCode + "-" + (System.currentTimeMillis() % 1000L);
        }

        BigDecimal computedSubtotal = courses.stream()
            .map(c -> c.getPrice() != null ? c.getPrice() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal subtotal = req.getSubtotalAmount() != null ? req.getSubtotalAmount() : computedSubtotal;
        BigDecimal discount = req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal finalAmt = req.getFinalAmount() != null
            ? req.getFinalAmount()
            : subtotal.subtract(discount).max(BigDecimal.ZERO);

        String idsCsv = courses.stream().map(c -> String.valueOf(c.getId())).collect(Collectors.joining(","));
        String titles = courses.stream().map(Course::getTitle).collect(Collectors.joining(" | "));

        if ("COMPLETED".equalsIgnoreCase(targetStatus)) {
            activateOrderEnrollments(user, courses, courseIds);
        }

        CourseOrder order = CourseOrder.builder()
            .orderCode(orderCode)
            .user(user)
            .courseIdsCsv(idsCsv)
            .courseTitles(titles)
            .subtotalAmount(subtotal)
            .discountAmount(discount)
            .finalAmount(finalAmt)
            .voucherCode(req.getVoucherCode() != null && !req.getVoucherCode().isBlank() ? req.getVoucherCode().trim().toUpperCase() : null)
            .paymentMethod(req.getPaymentMethod() != null && !req.getPaymentMethod().isBlank() ? req.getPaymentMethod().trim().toUpperCase() : "SEPAY")
            .status(targetStatus)
            .build();

        CourseOrder saved = courseOrderRepository.save(order);
        return CourseOrderResponse.from(saved);
    }

    private void activateOrderEnrollments(User user, List<Course> courses, List<Long> courseIds) {
        for (Course course : courses) {
            if (!enrollmentRepository.existsByUserIdAndCourseId(user.getId(), course.getId())) {
                Enrollment enrollment = Enrollment.builder()
                    .user(user)
                    .course(course)
                    .status(EnrollmentStatus.ACTIVE)
                    .build();
                enrollmentRepository.save(enrollment);
            }
        }
        if (!courseIds.isEmpty()) {
            cartItemRepository.deleteByUserIdAndCourseIdIn(user.getId(), courseIds);
        }
    }

    private void expireStalePendingOrder(CourseOrder order) {
        if (order != null
            && "PENDING".equalsIgnoreCase(order.getStatus())
            && order.getCreatedAt() != null
            && order.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(15))) {
            order.setStatus("CANCELLED");
            courseOrderRepository.save(order);
        }
    }

    @Transactional
    public CourseOrderResponse getOrderStatusByCode(User user, String orderCode) {
        String code = orderCode == null ? "" : orderCode.trim().toUpperCase();
        CourseOrder order = courseOrderRepository.findByOrderCodeWithUser(code)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (!Objects.equals(order.getUser().getId(), user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Không có quyền xem đơn hàng này");
        }
        expireStalePendingOrder(order);
        return CourseOrderResponse.from(order);
    }

    @Transactional
    public CourseOrderResponse cancelOrder(User user, String orderCode) {
        String code = orderCode == null ? "" : orderCode.trim().toUpperCase();
        CourseOrder order = courseOrderRepository.findByOrderCodeWithUser(code)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));
        if (!Objects.equals(order.getUser().getId(), user.getId()) && user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Không có quyền hủy đơn hàng này");
        }
        if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
            throw new FieldValidationException("status", "Đơn hàng đã thanh toán thành công không thể hủy");
        }
        order.setStatus("CANCELLED");
        CourseOrder saved = courseOrderRepository.save(order);
        return CourseOrderResponse.from(saved);
    }

    @Transactional
    public Map<String, Object> processSepayWebhook(String authHeader, Map<String, Object> payload) {
        if (paymentWebhookSecret != null && !paymentWebhookSecret.isBlank()) {
            String expected = "Apikey " + paymentWebhookSecret.trim();
            if (authHeader == null || !authHeader.trim().equalsIgnoreCase(expected)) {
                throw new AccessDeniedException("Xác thực Webhook không hợp lệ");
            }
        }

        String content = String.valueOf(payload.getOrDefault("content", payload.getOrDefault("description", ""))).toUpperCase();
        String transferType = String.valueOf(payload.getOrDefault("transferType", "in")).toLowerCase();
        BigDecimal transferAmount = BigDecimal.ZERO;
        Object rawAmt = payload.get("transferAmount");
        if (rawAmt != null) {
            try {
                transferAmount = new BigDecimal(String.valueOf(rawAmt));
            } catch (NumberFormatException ignored) {
            }
        }

        if (!"in".equals(transferType) || content.isBlank()) {
            return Map.of("success", true, "matched", false, "reason", "Không phải giao dịch tiền vào hoặc thiếu nội dung");
        }

        List<CourseOrder> pendingOrders = courseOrderRepository.findAllPendingWithUser();
        for (CourseOrder order : pendingOrders) {
            String code = order.getOrderCode() == null ? "" : order.getOrderCode().toUpperCase();
            if (!code.isBlank() && content.contains(code)) {
                if (transferAmount.compareTo(order.getFinalAmount()) >= 0) {
                    List<Long> courseIds = Arrays.stream(order.getCourseIdsCsv().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(Long::valueOf)
                        .toList();
                    List<Course> courses = courseRepository.findAllById(courseIds);
                    activateOrderEnrollments(order.getUser(), courses, courseIds);
                    order.setStatus("COMPLETED");
                    courseOrderRepository.save(order);
                    return Map.of("success", true, "matched", true, "orderCode", code, "status", "COMPLETED");
                }
            }
        }

        return Map.of("success", true, "matched", false);
    }

    @Transactional
    public List<CourseOrderResponse> getUserOrders(User user) {
        List<CourseOrder> orders = courseOrderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        orders.forEach(this::expireStalePendingOrder);
        return orders.stream()
            .map(CourseOrderResponse::from)
            .toList();
    }

    @Transactional
    public List<CourseOrderResponse> getAllOrders() {
        List<CourseOrder> orders = courseOrderRepository.findAllWithUserOrderByCreatedAtDesc();
        orders.forEach(this::expireStalePendingOrder);
        return orders.stream()
            .map(CourseOrderResponse::from)
            .toList();
    }

    private List<CourseSummaryResponse> mapCoursesToSummary(List<Course> courses) {
        if (courses.isEmpty()) return List.of();
        List<Long> ids = courses.stream().map(Course::getId).toList();
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : lessonRepository.countByCourseIds(ids, LessonStatus.ACTIVE)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return courses.stream()
            .map(c -> CourseSummaryResponse.from(c, counts.getOrDefault(c.getId(), 0L)))
            .toList();
    }
}

