package com.onlinecourse.backend;

import com.onlinecourse.backend.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LessonControllerTest extends CourseApiTestSupport {

    private Course course;

    @BeforeEach
    void createPublishedCourse() {
        Category category = categoryRepository.save(Category.builder().name("Java").build());
        course = courseRepository.save(Course.builder()
                .category(category)
                .title("Spring Boot")
                .price(BigDecimal.ZERO)
                .level(CourseLevel.BEGINNER)
                .status(CourseStatus.PUBLISHED)
                .build());
    }

    private Lesson saveLesson(int order, LessonStatus status) {
        return lessonRepository.save(Lesson.builder()
                .course(course)
                .title("Lesson " + order)
                .videoUrl("https://video.example/secret-" + order + ".mp4")
                .duration(10)
                .lessonOrder(order)
                .status(status)
                .build());
    }

    private String lessonsUrl() {
        return "/api/courses/" + course.getId() + "/lessons";
    }

    private String adminLessonsUrl() {
        return "/api/admin/courses/" + course.getId() + "/lessons";
    }

    private String lessonJson(String title, int order) {
        return """
                {"title":"%s","description":"Intro","videoUrl":"https://video.example/1.mp4","duration":15,"lessonOrder":%d}
                """.formatted(title, order);
    }

    // ---- Public ----

    @Test
    void publicList_withoutToken_returnsActiveLessonsInOrderWithoutVideoUrl() throws Exception {
        saveLesson(2, LessonStatus.ACTIVE);
        saveLesson(1, LessonStatus.ACTIVE);
        saveLesson(3, LessonStatus.INACTIVE);

        getPublic("/api/courses/" + course.getId() + "/lessons")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].lessonOrder").value(1))
                .andExpect(jsonPath("$[1].lessonOrder").value(2))
                .andExpect(jsonPath("$[0].title").value("Lesson 1"))
                .andExpect(jsonPath("$[0].videoUrl").doesNotExist())
                .andExpect(jsonPath("$[0].status").doesNotExist());
    }

    @Test
    void publicList_ofDraftCourse_returns404() throws Exception {
        course.setStatus(CourseStatus.DRAFT);
        courseRepository.save(course);

        getPublic("/api/courses/" + course.getId() + "/lessons")
                .andExpect(status().isNotFound());
    }

    // ---- Admin: authorization ----

    @Test
    void create_asStudent_returns403() throws Exception {
        postAs(userToken(), lessonsUrl(), lessonJson("Intro", 1))
                .andExpect(status().isForbidden());
    }

    @Test
    void update_asStudent_returns403() throws Exception {
        Lesson lesson = saveLesson(1, LessonStatus.ACTIVE);

        putAs(userToken(), "/api/lessons/" + lesson.getId(), lessonJson("Hacked", 1))
                .andExpect(status().isForbidden());
        assertEquals("Lesson 1", lessonRepository.findById(lesson.getId()).orElseThrow().getTitle());
    }

    @Test
    void delete_asStudent_returns403() throws Exception {
        Lesson lesson = saveLesson(1, LessonStatus.ACTIVE);

        deleteAs(userToken(), "/api/lessons/" + lesson.getId())
                .andExpect(status().isForbidden());
        assertEquals(LessonStatus.ACTIVE, lessonRepository.findById(lesson.getId()).orElseThrow().getStatus());
    }

    @Test
    void adminList_asStudent_returns403() throws Exception {
        // The admin listing exposes video URLs, so students must never reach it
        getAs(userToken(), adminLessonsUrl()).andExpect(status().isForbidden());
    }

    // ---- Admin: list / create ----

    @Test
    void adminList_includesVideoUrlAndInactiveLessons() throws Exception {
        saveLesson(1, LessonStatus.ACTIVE);
        saveLesson(2, LessonStatus.INACTIVE);

        getAs(adminToken(), adminLessonsUrl())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].videoUrl").value("https://video.example/secret-1.mp4"))
                .andExpect(jsonPath("$[1].status").value("INACTIVE"));
    }

    @Test
    void create_withValidData_returns201Active() throws Exception {
        postAs(adminToken(), lessonsUrl(), lessonJson("Intro", 1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.courseId").value(course.getId()))
                .andExpect(jsonPath("$.lessonOrder").value(1))
                .andExpect(jsonPath("$.videoUrl").value("https://video.example/1.mp4"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_withDuplicateOrderInSameCourse_returns400() throws Exception {
        saveLesson(1, LessonStatus.ACTIVE);

        postAs(adminToken(), lessonsUrl(), lessonJson("Another", 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.lessonOrder").exists());
    }

    @Test
    void create_withSameOrderInDifferentCourse_succeeds() throws Exception {
        saveLesson(1, LessonStatus.ACTIVE);
        Course other = courseRepository.save(Course.builder()
                .category(course.getCategory())
                .title("Other")
                .price(BigDecimal.ZERO)
                .level(CourseLevel.BEGINNER)
                .build());

        postAs(adminToken(), "/api/courses/" + other.getId() + "/lessons", lessonJson("Intro", 1))
                .andExpect(status().isCreated());
    }

    @Test
    void create_withNonPositiveOrder_returns400() throws Exception {
        postAs(adminToken(), lessonsUrl(), lessonJson("Intro", 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.lessonOrder").exists());
    }

    @Test
    void create_withBlankTitle_returns400() throws Exception {
        postAs(adminToken(), lessonsUrl(), lessonJson("  ", 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void create_withNonHttpVideoUrl_returns400() throws Exception {
        String json = lessonJson("Intro", 1).replace("https://video.example/1.mp4", "javascript:alert(1)");

        postAs(adminToken(), lessonsUrl(), json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.videoUrl").exists());
    }

    @Test
    void create_inUnknownCourse_returns404() throws Exception {
        postAs(adminToken(), "/api/courses/999999/lessons", lessonJson("Intro", 1))
                .andExpect(status().isNotFound());
    }

    // ---- Admin: update / delete ----

    @Test
    void update_keepingSameOrder_succeeds() throws Exception {
        Lesson lesson = saveLesson(1, LessonStatus.ACTIVE);

        putAs(adminToken(), "/api/lessons/" + lesson.getId(), lessonJson("Renamed", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Renamed"));
    }

    @Test
    void update_toOrderOfAnotherLesson_returns400() throws Exception {
        saveLesson(1, LessonStatus.ACTIVE);
        Lesson second = saveLesson(2, LessonStatus.ACTIVE);

        putAs(adminToken(), "/api/lessons/" + second.getId(), lessonJson("Second", 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.lessonOrder").exists());
    }

    @Test
    void update_unknownLesson_returns404() throws Exception {
        putAs(adminToken(), "/api/lessons/999999", lessonJson("Intro", 1))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_softDeletesLessonAndHidesItPublicly() throws Exception {
        Lesson lesson = saveLesson(1, LessonStatus.ACTIVE);

        deleteAs(adminToken(), "/api/lessons/" + lesson.getId())
                .andExpect(status().isNoContent());

        assertEquals(LessonStatus.INACTIVE, lessonRepository.findById(lesson.getId()).orElseThrow().getStatus());
        getPublic("/api/courses/" + course.getId() + "/lessons")
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
