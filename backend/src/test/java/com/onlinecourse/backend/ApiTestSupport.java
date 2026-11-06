package com.onlinecourse.backend;

import com.jayway.jsonpath.JsonPath;
import com.onlinecourse.backend.repository.CartItemRepository;
import com.onlinecourse.backend.repository.CourseOrderRepository;
import com.onlinecourse.backend.repository.EnrollmentRepository;
import com.onlinecourse.backend.repository.LessonProgressRepository;
import com.onlinecourse.backend.repository.ReviewRepository;
import com.onlinecourse.backend.repository.UserRepository;
import com.onlinecourse.backend.repository.WishlistItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base class for API tests: boots the full app (real security filter chain) on an in-memory H2 database.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class ApiTestSupport {

    protected static final String PASSWORD = "Test12345!";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected CartItemRepository cartItemRepository;

    @Autowired
    protected WishlistItemRepository wishlistItemRepository;

    @Autowired
    protected CourseOrderRepository courseOrderRepository;

    @Autowired
    protected LessonProgressRepository lessonProgressRepository;

    @Autowired
    protected ReviewRepository reviewRepository;

    @Autowired
    protected EnrollmentRepository enrollmentRepository;

    @BeforeEach
    void cleanDatabase() {
        lessonProgressRepository.deleteAll();
        reviewRepository.deleteAll();
        enrollmentRepository.deleteAll();
        cartItemRepository.deleteAll();
        wishlistItemRepository.deleteAll();
        courseOrderRepository.deleteAll();
        userRepository.deleteAll();
    }

    protected ResultActions postJson(String url, String json) throws Exception {
        return mockMvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    protected void register(String email, String password) throws Exception {
        postJson("/api/auth/register", """
                {"fullName":"Test User","email":"%s","password":"%s"}
                """.formatted(email, password))
                .andExpect(status().isCreated());
    }

    protected String login(String email, String password) throws Exception {
        String body = postJson("/api/auth/login", """
                {"email":"%s","password":"%s"}
                """.formatted(email, password))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    protected String registerAndLogin(String email) throws Exception {
        register(email, PASSWORD);
        return login(email, PASSWORD);
    }

    protected static String bearer(String token) {
        return "Bearer " + token;
    }
}
