package com.onlinecourse.backend;

import com.jayway.jsonpath.JsonPath;
import com.onlinecourse.backend.repository.UserRepository;
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

    @BeforeEach
    void cleanDatabase() {
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
