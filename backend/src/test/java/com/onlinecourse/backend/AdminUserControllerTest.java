package com.onlinecourse.backend;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.entity.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserControllerTest extends CourseApiTestSupport {

    private static final String URL = "/api/admin/users";

    @Test
    void getAllUsers_withoutToken_returns401() throws Exception {
        mockMvc.perform(get(URL))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllUsers_withStudentToken_returns403() throws Exception {
        String token = userToken();
        getAs(token, URL)
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_withAdminToken_returnsUsersList() throws Exception {
        String adminToken = adminToken();
        register("student1@example.com", PASSWORD);

        getAs(adminToken, URL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void updateStatus_withoutToken_returns401() throws Exception {
        mockMvc.perform(patch(URL + "/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "BLOCKED"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateStatus_withStudentToken_returns403() throws Exception {
        String token = userToken();
        mockMvc.perform(patch(URL + "/1/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "BLOCKED"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateStatus_blockAnotherUser_succeeds() throws Exception {
        String adminToken = adminToken();
        register("student@example.com", PASSWORD);
        User student = userRepository.findByEmail("student@example.com").orElseThrow();
        assertEquals(UserStatus.ACTIVE, student.getStatus());

        mockMvc.perform(patch(URL + "/" + student.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "BLOCKED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BLOCKED"));

        User reloaded = userRepository.findById(student.getId()).orElseThrow();
        assertEquals(UserStatus.BLOCKED, reloaded.getStatus());
    }

    @Test
    void updateStatus_adminBlockingThemselves_returns400() throws Exception {
        String adminToken = adminToken();
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        mockMvc.perform(patch(URL + "/" + admin.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "BLOCKED"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStatus_userNotFound_returns404() throws Exception {
        String adminToken = adminToken();

        mockMvc.perform(patch(URL + "/99999/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "BLOCKED"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateStatus_missingStatus_returns400() throws Exception {
        String adminToken = adminToken();
        register("student@example.com", PASSWORD);
        User student = userRepository.findByEmail("student@example.com").orElseThrow();

        mockMvc.perform(patch(URL + "/" + student.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {}
                                """))
                .andExpect(status().isBadRequest());
    }
}
