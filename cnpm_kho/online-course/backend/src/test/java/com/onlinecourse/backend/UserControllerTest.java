package com.onlinecourse.backend;

import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerTest extends ApiTestSupport {

    private static final String EMAIL = "me@example.com";

    private ResultActions getMe(String token) throws Exception {
        return mockMvc.perform(get("/api/users/me").header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    private ResultActions putJson(String url, String token, String json) throws Exception {
        return mockMvc.perform(put(url)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    // ---- Protected API access ----

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void me_withTamperedToken_returns401() throws Exception {
        String token = registerAndLogin(EMAIL);
        getMe(token.substring(0, token.length() - 2) + "xx")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired token"));
    }

    @Test
    void me_withValidToken_returnsCurrentUser() throws Exception {
        String token = registerAndLogin(EMAIL);
        getMe(token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void adminRoute_asUser_returns403() throws Exception {
        String token = registerAndLogin(EMAIL);
        mockMvc.perform(get("/api/admin/users").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void liveToken_ofUserBlockedLater_isRejected() throws Exception {
        String token = registerAndLogin(EMAIL);
        User user = userRepository.findByEmail(EMAIL).orElseThrow();
        user.setStatus(UserStatus.BLOCKED);
        userRepository.save(user);

        getMe(token).andExpect(status().isUnauthorized());
    }

    @Test
    void corsPreflight_fromAllowedOrigin_isAccepted() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
    }

    @Test
    void corsPreflight_fromUnknownOrigin_isRejected() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden());
    }

    // ---- Profile ----

    @Test
    void updateProfile_validRequest_updatesEditableFieldsOnly() throws Exception {
        String token = registerAndLogin(EMAIL);

        putJson("/api/users/me", token, """
                {"fullName":"  Nguyen Van A ","phone":"0901234567","avatar":"https://example.com/a.png",
                 "email":"hacker@example.com","role":"ADMIN"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.phone").value("0901234567"))
                .andExpect(jsonPath("$.avatar").value("https://example.com/a.png"))
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void updateProfile_invalidFields_returns400() throws Exception {
        String token = registerAndLogin(EMAIL);

        putJson("/api/users/me", token, """
                {"fullName":"","phone":"999","avatar":"javascript:alert(1)"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.phone").exists())
                .andExpect(jsonPath("$.errors.avatar").value("Avatar must be an http(s) URL"));
    }

    // ---- Change password ----

    @Test
    void changePassword_wrongCurrentPassword_returns400OnThatField() throws Exception {
        String token = registerAndLogin(EMAIL);

        putJson("/api/users/me/password", token, """
                {"currentPassword":"wrong-pass","newPassword":"NewPass123","confirmPassword":"NewPass123"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.currentPassword").value("Current password is incorrect"));
    }

    @Test
    void changePassword_confirmMismatch_returns400() throws Exception {
        String token = registerAndLogin(EMAIL);

        putJson("/api/users/me/password", token, """
                {"currentPassword":"Test12345!","newPassword":"NewPass123","confirmPassword":"Different1"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.confirmPassword").value("Confirm password does not match"));
    }

    @Test
    void changePassword_sameAsCurrent_returns400() throws Exception {
        String token = registerAndLogin(EMAIL);

        putJson("/api/users/me/password", token, """
                {"currentPassword":"Test12345!","newPassword":"Test12345!","confirmPassword":"Test12345!"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.newPassword").exists());
    }

    @Test
    void changePassword_success_revokesOldTokensAndOnlyNewPasswordWorks() throws Exception {
        String token = registerAndLogin(EMAIL);

        putJson("/api/users/me/password", token, """
                {"currentPassword":"Test12345!","newPassword":"NewPass123","confirmPassword":"NewPass123"}
                """)
                .andExpect(status().isNoContent());

        // Old token is rejected immediately, even within the same second it was issued
        getMe(token).andExpect(status().isUnauthorized());

        postJson("/api/auth/login", """
                {"email":"%s","password":"Test12345!"}
                """.formatted(EMAIL))
                .andExpect(status().isUnauthorized());

        String newToken = login(EMAIL, "NewPass123");
        getMe(newToken).andExpect(status().isOk());
    }

    // ---- Error handling ----

    @Test
    void unknownEndpoint_returns404() throws Exception {
        String token = registerAndLogin(EMAIL);
        mockMvc.perform(get("/api/does-not-exist").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Endpoint not found"));
    }

    @Test
    void unsupportedMethod_returns405() throws Exception {
        String token = registerAndLogin(EMAIL);
        mockMvc.perform(delete("/api/users/me").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isMethodNotAllowed());
    }
}
