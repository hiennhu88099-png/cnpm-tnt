package com.onlinecourse.backend;

import com.jayway.jsonpath.JsonPath;
import com.onlinecourse.backend.entity.Category;
import com.onlinecourse.backend.entity.CategoryStatus;
import com.onlinecourse.backend.entity.Course;
import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.CourseStatus;
import com.onlinecourse.backend.entity.Lesson;
import com.onlinecourse.backend.entity.LessonStatus;
import com.onlinecourse.backend.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EnrollmentLearningReviewControllerTest extends CourseApiTestSupport {

    @Autowired
    private ReviewRepository reviewRepository;

    @BeforeEach
    void cleanReviews() {
        reviewRepository.deleteAll();
    }

    private Course createCourseWithTwoLessons(String title, BigDecimal price) {
        Category category = new Category();
        category.setName("Kỹ thuật Phần mềm");
        category.setStatus(CategoryStatus.ACTIVE);
        category = categoryRepository.save(category);

        Course course = new Course();
        course.setTitle(title);
        course.setDescription("Khóa học kiểm thử toàn diện");
        course.setPrice(price);
        course.setOriginalPrice(price.add(BigDecimal.valueOf(100000)));
        course.setLevel(CourseLevel.INTERMEDIATE);
        course.setStatus(CourseStatus.PUBLISHED);
        course.setCategory(category);
        course.setInstructorName("TS. Nguyễn Minh Tuấn");
        course = courseRepository.save(course);

        Lesson lesson1 = new Lesson();
        lesson1.setCourse(course);
        lesson1.setTitle("Bài 1: Giới thiệu mở thử miễn phí");
        lesson1.setVideoUrl("https://vjs.zencdn.net/v/oceans.mp4");
        lesson1.setDuration(12);
        lesson1.setLessonOrder(1);
        lesson1.setStatus(LessonStatus.ACTIVE);
        lessonRepository.save(lesson1);

        Lesson lesson2 = new Lesson();
        lesson2.setCourse(course);
        lesson2.setTitle("Bài 2: Kiến trúc chuyên sâu");
        lesson2.setVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
        lesson2.setDuration(25);
        lesson2.setLessonOrder(2);
        lesson2.setStatus(LessonStatus.ACTIVE);
        lessonRepository.save(lesson2);

        return course;
    }

    @Test
    void courseDetail_exposesPreviewVideoUrlOnlyForFirstLesson() throws Exception {
        Course course = createCourseWithTwoLessons("Clean Architecture & DDD", BigDecimal.valueOf(399000));

        getPublic("/api/courses/" + course.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lessons", hasSize(2)))
                .andExpect(jsonPath("$.lessons[0].lessonOrder").value(1))
                .andExpect(jsonPath("$.lessons[0].previewVideoUrl").value("https://vjs.zencdn.net/v/oceans.mp4"))
                .andExpect(jsonPath("$.lessons[1].lessonOrder").value(2))
                .andExpect(jsonPath("$.lessons[1].previewVideoUrl").value(nullValue()));
    }

    @Test
    void enrollmentAndLessonCompletion_updatesProgressTo100PercentAndMarksCompleted() throws Exception {
        String studentToken = userToken();
        Course course = createCourseWithTwoLessons("Git Flow & CI/CD Thực Chiến", BigDecimal.ZERO);
        var lessons = lessonRepository.findAllByCourseIdAndStatusOrderByLessonOrderAsc(course.getId(), LessonStatus.ACTIVE);

        // 1. Enroll in course
        postAs(studentToken, "/api/enrollments", """
                {"courseId": %d}
                """.formatted(course.getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // 2. Duplicate enrollment is rejected with 409 Conflict
        postAs(studentToken, "/api/enrollments", """
                {"courseId": %d}
                """.formatted(course.getId()))
                .andExpect(status().isConflict());

        // 3. Complete Lesson 1 -> 50% progress
        postAs(studentToken, "/api/lessons/" + lessons.get(0).getId() + "/complete", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedLessons").value(1))
                .andExpect(jsonPath("$.totalLessons").value(2))
                .andExpect(jsonPath("$.progressPercentage").value(50.0));

        // 4. Complete Lesson 2 -> 100% progress and enrollment becomes COMPLETED
        postAs(studentToken, "/api/lessons/" + lessons.get(1).getId() + "/complete", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedLessons").value(2))
                .andExpect(jsonPath("$.totalLessons").value(2))
                .andExpect(jsonPath("$.progressPercentage").value(100.0));

        getAs(studentToken, "/api/enrollments/my-courses")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$[0].progress").value(100.0));
    }

    @Test
    void reviewLifecycle_andCourseCatalogRatingAggregation_succeeds() throws Exception {
        String studentToken = userToken();
        String adminToken = adminToken();
        Course course = createCourseWithTwoLessons("Spring Security & JWT", BigDecimal.ZERO);

        postAs(studentToken, "/api/enrollments", """
                {"courseId": %d}
                """.formatted(course.getId()))
                .andExpect(status().isCreated());

        // 1. Enrolled student submits a 5-star review
        String createdReview = postAs(studentToken, "/api/reviews", """
                {
                  "courseId": %d,
                  "rating": 5,
                  "comment": "Khóa học giải thích rất chi tiết và dễ hiểu!"
                }
                """.formatted(course.getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andReturn().getResponse().getContentAsString();

        Integer reviewId = JsonPath.read(createdReview, "$.id");

        // 2. Admin approves the review (if not already APPROVED)
        mockMvc.perform(patch("/api/admin/reviews/" + reviewId + "/status")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "APPROVED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // 3. Course catalog API aggregates averageRating = 5.0 and reviewCount = 1 from DB
        getPublic("/api/courses")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].averageRating").value(5.0))
                .andExpect(jsonPath("$.content[0].reviewCount").value(1));
    }
}

