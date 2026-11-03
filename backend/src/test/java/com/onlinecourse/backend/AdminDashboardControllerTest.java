package com.onlinecourse.backend;

import com.onlinecourse.backend.repository.EnrollmentRepository;
import com.onlinecourse.backend.repository.LessonProgressRepository;
import com.onlinecourse.backend.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminDashboardControllerTest extends CourseApiTestSupport {

    private static final String URL = "/api/admin/dashboard/summary";

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private LessonProgressRepository lessonProgressRepository;

    @BeforeEach
    void cleanAllLearningData() {
        lessonProgressRepository.deleteAll();
        reviewRepository.deleteAll();
        enrollmentRepository.deleteAll();
    }

    @Test
    void summary_withoutToken_returns401() throws Exception {
        mockMvc.perform(get(URL))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void summary_withStudentToken_returns403() throws Exception {
        String token = userToken();
        getAs(token, URL)
                .andExpect(status().isForbidden());
    }

    @Test
    void summary_withAdminToken_returnsSummaryMetrics() throws Exception {
        String token = adminToken();

        getAs(token, URL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber())
                .andExpect(jsonPath("$.activeUsers").isNumber())
                .andExpect(jsonPath("$.blockedUsers").isNumber())
                .andExpect(jsonPath("$.totalCourses").isNumber())
                .andExpect(jsonPath("$.publishedCourses").isNumber())
                .andExpect(jsonPath("$.draftCourses").isNumber())
                .andExpect(jsonPath("$.totalEnrollments").isNumber())
                .andExpect(jsonPath("$.activeEnrollments").isNumber())
                .andExpect(jsonPath("$.completedEnrollments").isNumber())
                .andExpect(jsonPath("$.totalReviews").isNumber())
                .andExpect(jsonPath("$.approvedReviews").isNumber())
                .andExpect(jsonPath("$.pendingReviews").isNumber())
                .andExpect(jsonPath("$.hiddenReviews").isNumber())
                .andExpect(jsonPath("$.averageRating").isNumber());
    }
}

