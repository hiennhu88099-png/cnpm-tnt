package com.onlinecourse.backend;

import com.jayway.jsonpath.JsonPath;
import com.onlinecourse.backend.entity.Category;
import com.onlinecourse.backend.entity.CategoryStatus;
import com.onlinecourse.backend.entity.Course;
import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.CourseStatus;
import com.onlinecourse.backend.repository.BannerRepository;
import com.onlinecourse.backend.repository.VoucherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShopAndPaymentControllerTest extends CourseApiTestSupport {

    @Autowired
    private BannerRepository bannerRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    @BeforeEach
    void cleanShopData() {
        bannerRepository.deleteAll();
        voucherRepository.deleteAll();
    }

    private Course createPublishedCourse(String title, BigDecimal price) {
        Category category = new Category();
        category.setName("Lập trình Web");
        category.setStatus(CategoryStatus.ACTIVE);
        category = categoryRepository.save(category);

        Course course = new Course();
        course.setTitle(title);
        course.setDescription("Khóa học thực chiến");
        course.setPrice(price);
        course.setOriginalPrice(price.add(BigDecimal.valueOf(100000)));
        course.setLevel(CourseLevel.BEGINNER);
        course.setStatus(CourseStatus.PUBLISHED);
        course.setCategory(category);
        course.setInstructorName("Giảng viên EduHub");
        return courseRepository.save(course);
    }

    @Test
    void paymentConfig_isPublicAndReturnsBankDetails() throws Exception {
        getPublic("/api/payment/config")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bankCode").isNotEmpty())
                .andExpect(jsonPath("$.accountNumber").isNotEmpty())
                .andExpect(jsonPath("$.accountHolder").isNotEmpty())
                .andExpect(jsonPath("$.transferPrefix").isNotEmpty());
    }

    @Test
    void adminBannerCrud_andPublicActiveFilter_succeeds() throws Exception {
        String adminToken = adminToken();

        String createdBody = postAs(adminToken, "/api/admin/banners", """
                {
                  "title": "Banner Khuyến Mãi Mùa Hè",
                  "imageUrl": "/banners/hero-main-1.svg",
                  "link": "/courses",
                  "type": "HomeMain",
                  "position": 1,
                  "active": true
                }
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Banner Khuyến Mãi Mùa Hè"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn().getResponse().getContentAsString();

        Integer bannerId = JsonPath.read(createdBody, "$.id");

        // Update banner inline
        putAs(adminToken, "/api/admin/banners/" + bannerId, """
                {
                  "title": "Banner Đã Cập Nhật",
                  "imageUrl": "/banners/promo-left.svg",
                  "link": "/courses?q=Java",
                  "type": "Promo",
                  "position": 2,
                  "active": true
                }
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Banner Đã Cập Nhật"))
                .andExpect(jsonPath("$.type").value("Promo"));

        // Public API sees the active banner
        getPublic("/api/banners")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Banner Đã Cập Nhật"));

        // Toggle active off -> public API no longer returns it
        mockMvc.perform(patch("/api/admin/banners/" + bannerId + "/toggle")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        getPublic("/api/banners")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void adminVoucherCrud_andPublicList_succeeds() throws Exception {
        String adminToken = adminToken();

        postAs(adminToken, "/api/admin/vouchers", """
                {
                  "code": "eduhub99",
                  "type": "percent",
                  "value": 25,
                  "maxDiscount": 120000,
                  "minOrderAmount": 200000,
                  "description": "Giảm 25% tối đa 120K",
                  "endDate": "2027-12-31",
                  "active": true
                }
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("EDUHUB99"))
                .andExpect(jsonPath("$.value").value(25));

        getPublic("/api/vouchers")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].code").value("EDUHUB99"));
    }

    @Test
    void cartAndWishlistFlow_forAuthenticatedStudent_succeeds() throws Exception {
        String studentToken = userToken();
        Course course = createPublishedCourse("Spring Boot Microservices", BigDecimal.valueOf(299000));

        // Add to cart
        postAs(studentToken, "/api/cart/" + course.getId(), "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(course.getId()));

        // Toggle wishlist on
        postAs(studentToken, "/api/wishlists/" + course.getId() + "/toggle", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.added").value(true));

        getAs(studentToken, "/api/wishlists")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void sepayWebhook_completesPendingOrderAndEnrollsStudentAutomatically() throws Exception {
        String studentToken = userToken();
        Course course = createPublishedCourse("Fullstack React & Spring Boot", BigDecimal.valueOf(350000));

        // 1. Student opens QR payment page -> creates PENDING order
        postAs(studentToken, "/api/orders/pending", """
                {
                  "orderCode": "ORD998877",
                  "courseIds": [%d],
                  "paymentMethod": "SEPAY",
                  "subtotal": 350000,
                  "discountAmount": 50000,
                  "finalAmount": 300000,
                  "voucherCode": "EDUHUB50"
                }
                """.formatted(course.getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderCode").value("ORD998877"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        // 2. Polling status before payment returns PENDING
        getAs(studentToken, "/api/orders/ORD998877/status")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        // 3. SePay sends incoming transfer webhook with matching content & amount
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/webhooks/sepay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "transferType": "in",
                                  "transferAmount": 300000,
                                  "content": "Chuyen khoan EDUHUB ORD998877 thanh toan khoa hoc"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // 4. Polling status after webhook returns COMPLETED and student is enrolled
        getAs(studentToken, "/api/orders/ORD998877/status")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        assertEquals(1, enrollmentRepository.count());
    }

    @Test
    void sqlInjectionPayloads_areNeutralizedByParameterizedQueries() throws Exception {
        createPublishedCourse("Java Spring Security", BigDecimal.valueOf(250000));

        // 1. SQL Injection attempt on course keyword search returns 0 matches (not all rows)
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/courses")
                        .param("keyword", "' OR '1'='1' --"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)));

        // 2. SQL Injection attempt on login email is rejected safely
        postJson("/api/auth/login", """
                {
                  "email": "admin@example.com' OR '1'='1",
                  "password": "anything"
                }
                """)
                .andExpect(status().isBadRequest());
    }

    @Test
    void bruteForceLoginAttempts_exceedingRateLimit_returns429TooManyRequests() throws Exception {
        String attackerIp = "203.0.113.99";

        for (int i = 0; i < 20; i++) {
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                            .post("/api/auth/login")
                            .header("X-Forwarded-For", attackerIp)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"victim@example.com","password":"wrongpassword"}
                                    """))
                    .andExpect(status().isUnauthorized());
        }

        // 21st request within the same minute from the same IP is blocked with HTTP 429
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/auth/login")
                        .header("X-Forwarded-For", attackerIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"victim@example.com","password":"wrongpassword"}
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429));
    }
}

