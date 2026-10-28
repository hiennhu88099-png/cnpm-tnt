package com.onlinecourse.backend;

import com.onlinecourse.backend.entity.Role;
import com.onlinecourse.backend.entity.User;
import com.onlinecourse.backend.repository.CategoryRepository;
import com.onlinecourse.backend.repository.CourseRepository;
import com.onlinecourse.backend.repository.LessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * Shared helpers for the course-management API tests (categories, courses, lessons).
 */
public abstract class CourseApiTestSupport extends ApiTestSupport {

    @Autowired
    protected CategoryRepository categoryRepository;

    @Autowired
    protected CourseRepository courseRepository;

    @Autowired
    protected LessonRepository lessonRepository;

    // Runs after ApiTestSupport#cleanDatabase; children first because of the foreign keys
    @BeforeEach
    void cleanCourseData() {
        lessonRepository.deleteAll();
        courseRepository.deleteAll();
        categoryRepository.deleteAll();
    }

    protected String adminToken() throws Exception {
        String email = "admin@example.com";
        register(email, PASSWORD);
        User admin = userRepository.findByEmail(email).orElseThrow();
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        // The role claim is written at login time, so log in after promoting
        return login(email, PASSWORD);
    }

    protected String userToken() throws Exception {
        return registerAndLogin("student@example.com");
    }

    protected ResultActions getPublic(String url) throws Exception {
        return mockMvc.perform(get(url));
    }

    protected ResultActions getAs(String token, String url) throws Exception {
        return mockMvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }

    protected ResultActions postAs(String token, String url, String json) throws Exception {
        return mockMvc.perform(post(url)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    protected ResultActions putAs(String token, String url, String json) throws Exception {
        return mockMvc.perform(put(url)
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    protected ResultActions deleteAs(String token, String url) throws Exception {
        return mockMvc.perform(delete(url).header(HttpHeaders.AUTHORIZATION, bearer(token)));
    }
}
