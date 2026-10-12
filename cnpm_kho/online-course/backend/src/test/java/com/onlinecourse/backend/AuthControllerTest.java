package com.onlinecourse.backend;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest extends ApiTestSupport {

    // ---- Register ----

    @Test
    void register_validRequest_returns201WithoutPasswordAndStoresBcryptHash() throws Exception {
        postJson("/api/auth/register", """
                {"fullName":"  Test User ","email":"Test.User@Example.com","password":"Test12345!","phone":"0901234567"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("test.user@example.com"))
                .andExpect(jsonPath("$.fullName").value("Test User"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.password").doesNotExist());

        User saved = userRepository.findByEmail("test.user@example.com").orElseThrow();
        assertThat(saved.getPassword()).startsWith("$2a$").isNotEqualTo("Test12345!");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void register_duplicateEmailIgnoringCase_returns409() throws Exception {
        register("dup@example.com", PASSWORD);

        postJson("/api/auth/register", """
                {"fullName":"Other","email":"DUP@example.com","password":"Test12345!"}
                """)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    @Test
    void register_invalidFields_returns400WithErrorPerField() throws Exception {
        postJson("/api/auth/register", """
                {"fullName":"","email":"not-an-email","password":"123","phone":"12ab"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation error"))
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.email").value("Invalid email format"))
                .andExpect(jsonPath("$.errors.password").exists())
                .andExpect(jsonPath("$.errors.phone").exists());
    }

    @Test
    void register_malformedJson_returns400() throws Exception {
        postJson("/api/auth/register", "{bad")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed JSON request"));
    }

    // ---- Login ----

    @Test
    void login_validCredentials_returnsBearerTokenAndUser() throws Exception {
        register("login@example.com", PASSWORD);

        postJson("/api/auth/login", """
                {"email":"LOGIN@example.com","password":"Test12345!"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.user.email").value("login@example.com"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void login_wrongPasswordAndUnknownEmail_returnSame401Message() throws Exception {
        register("login@example.com", PASSWORD);

        postJson("/api/auth/login", """
                {"email":"login@example.com","password":"wrong-password"}
                """)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        postJson("/api/auth/login", """
                {"email":"nobody@example.com","password":"Test12345!"}
                """)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void login_blockedUser_returns403() throws Exception {
        register("blocked@example.com", PASSWORD);
        User user = userRepository.findByEmail("blocked@example.com").orElseThrow();
        user.setStatus(UserStatus.BLOCKED);
        userRepository.save(user);

        postJson("/api/auth/login", """
                {"email":"blocked@example.com","password":"Test12345!"}
                """)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is blocked"));
    }

    @Test
    void login_missingFields_returns400() throws Exception {
        postJson("/api/auth/login", "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void login_tokenContainsThreeJwtParts() throws Exception {
        String token = registerAndLogin("jwt@example.com");
        assertThat(token.split("\\.")).hasSize(3);
        assertThat(token).startsWith("eyJ");
    }
}
