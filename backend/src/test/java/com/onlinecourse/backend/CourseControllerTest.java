package com.onlinecourse.backend;

import com.onlinecourse.backend.entity.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CourseControllerTest extends CourseApiTestSupport {

    private static final String ADMIN_URL = "/api/admin/courses";

    private Category saveCategory(String name, CategoryStatus status) {
        return categoryRepository.save(Category.builder().name(name).status(status).build());
    }

    private Course saveCourse(Category category, String title, CourseStatus status, String price) {
        return courseRepository.save(Course.builder()
                .category(category)
                .title(title)
                .description("About " + title)
                .price(new BigDecimal(price))
                .level(CourseLevel.BEGINNER)
                .status(status)
                .build());
    }

    private Lesson saveLesson(Course course, int order, LessonStatus status) {
        return lessonRepository.save(Lesson.builder()
                .course(course)
                .title("Lesson " + order)
                .videoUrl("https://video.example/secret-" + order + ".mp4")
                .duration(10)
                .lessonOrder(order)
                .status(status)
                .build());
    }

    private String validCourseJson(Long categoryId) {
        return """
                {"categoryId":%d,"title":"Spring Boot","description":"REST API","price":199000,
                 "instructorName":"Teacher","level":"BEGINNER","duration":600}
                """.formatted(categoryId);
    }

    // ---- Public list ----

    @Test
    void publicList_showsOnlyPublishedCoursesOfActiveCategories() throws Exception {
        Category active = saveCategory("Java", CategoryStatus.ACTIVE);
        Category inactive = saveCategory("Legacy", CategoryStatus.INACTIVE);
        saveCourse(active, "Published", CourseStatus.PUBLISHED, "100");
        saveCourse(active, "Draft", CourseStatus.DRAFT, "100");
        saveCourse(active, "Hidden", CourseStatus.INACTIVE, "100");
        saveCourse(inactive, "Orphan", CourseStatus.PUBLISHED, "100");

        getPublic("/api/courses")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Published"))
                .andExpect(jsonPath("$.content[0].categoryName").value("Java"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void publicList_filtersByKeywordAndCategory() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        Category python = saveCategory("Python", CategoryStatus.ACTIVE);
        saveCourse(java, "Java Spring Boot", CourseStatus.PUBLISHED, "100");
        saveCourse(java, "Java Basics", CourseStatus.PUBLISHED, "100");
        saveCourse(python, "Spring of Python", CourseStatus.PUBLISHED, "100");

        getPublic("/api/courses?keyword=SPRING&categoryId=" + java.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Java Spring Boot"));
    }

    @Test
    void publicList_paginates() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        for (int i = 1; i <= 5; i++) {
            saveCourse(java, "Course " + i, CourseStatus.PUBLISHED, "100");
        }

        getPublic("/api/courses?page=1&size=2")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    void publicList_capsPageSizeAt50() throws Exception {
        getPublic("/api/courses?size=500")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(50));
    }

    @Test
    void publicList_sortsByPriceAscending() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        saveCourse(java, "Expensive", CourseStatus.PUBLISHED, "500");
        saveCourse(java, "Free", CourseStatus.PUBLISHED, "0");
        saveCourse(java, "Cheap", CourseStatus.PUBLISHED, "50");

        getPublic("/api/courses?sort=price,asc")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Free"))
                .andExpect(jsonPath("$.content[2].title").value("Expensive"));
    }

    @Test
    void publicList_withUnsupportedSortField_returns400() throws Exception {
        getPublic("/api/courses?sort=category.secret,asc")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.sort").exists());
    }

    @Test
    void publicList_withNegativePage_returns400() throws Exception {
        getPublic("/api/courses?page=-1")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.page").exists());
    }

    // ---- Public detail ----

    @Test
    void publicDetail_ofPublishedCourse_listsActiveLessonsInOrderWithoutVideoUrl() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        Course course = saveCourse(java, "Spring", CourseStatus.PUBLISHED, "100");
        saveLesson(course, 2, LessonStatus.ACTIVE);
        saveLesson(course, 1, LessonStatus.ACTIVE);
        saveLesson(course, 3, LessonStatus.INACTIVE);

        getPublic("/api/courses/" + course.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Spring"))
                .andExpect(jsonPath("$.description").value("About Spring"))
                .andExpect(jsonPath("$.lessons", hasSize(2)))
                .andExpect(jsonPath("$.lessons[0].lessonOrder").value(1))
                .andExpect(jsonPath("$.lessons[1].lessonOrder").value(2))
                .andExpect(jsonPath("$.lessons[0].videoUrl").doesNotExist());
    }

    @Test
    void publicDetail_ofDraftCourse_returns404() throws Exception {
        Course course = saveCourse(saveCategory("Java", CategoryStatus.ACTIVE), "Draft", CourseStatus.DRAFT, "100");

        getPublic("/api/courses/" + course.getId()).andExpect(status().isNotFound());
    }

    @Test
    void publicDetail_ofCourseInInactiveCategory_returns404() throws Exception {
        Course course = saveCourse(saveCategory("Legacy", CategoryStatus.INACTIVE), "Old", CourseStatus.PUBLISHED, "100");

        getPublic("/api/courses/" + course.getId()).andExpect(status().isNotFound());
    }

    // ---- Admin: authorization ----

    @Test
    void create_asStudent_returns403() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        postAs(userToken(), ADMIN_URL, validCourseJson(java.getId()))
                .andExpect(status().isForbidden());
    }

    // ---- Admin: create ----

    @Test
    void create_withValidData_returns201AsDraft() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);

        postAs(adminToken(), ADMIN_URL, validCourseJson(java.getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Spring Boot"))
                .andExpect(jsonPath("$.price").value(199000))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.categoryId").value(java.getId()));
    }

    @Test
    void create_withUnknownCategory_returns400() throws Exception {
        postAs(adminToken(), ADMIN_URL, validCourseJson(999999L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.categoryId").exists());
    }

    @Test
    void create_withNegativePrice_returns400() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        String json = validCourseJson(java.getId()).replace("199000", "-1");

        postAs(adminToken(), ADMIN_URL, json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.price").exists());
    }

    @Test
    void create_withBlankTitle_returns400() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        String json = validCourseJson(java.getId()).replace("\"Spring Boot\"", "\"  \"");

        postAs(adminToken(), ADMIN_URL, json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void create_withoutLevel_returns400() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        String json = validCourseJson(java.getId()).replace("\"level\":\"BEGINNER\",", "");

        postAs(adminToken(), ADMIN_URL, json)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.level").exists());
    }

    // ---- Admin: list / detail / update / delete ----

    @Test
    void adminList_includesDraftsAndFiltersByStatus() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        saveCourse(java, "Published", CourseStatus.PUBLISHED, "100");
        saveCourse(java, "Draft", CourseStatus.DRAFT, "100");
        String token = adminToken();

        getAs(token, ADMIN_URL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        getAs(token, ADMIN_URL + "?status=DRAFT")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("Draft"));
    }

    @Test
    void adminDetail_ofDraftCourse_returnsCourse() throws Exception {
        Course course = saveCourse(saveCategory("Java", CategoryStatus.ACTIVE), "Draft", CourseStatus.DRAFT, "100");

        getAs(adminToken(), ADMIN_URL + "/" + course.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void update_canPublishCourse() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);
        Course course = saveCourse(java, "Draft", CourseStatus.DRAFT, "100");
        String json = validCourseJson(java.getId()).replace("\"duration\":600", "\"duration\":600,\"status\":\"PUBLISHED\"");

        putAs(adminToken(), ADMIN_URL + "/" + course.getId(), json)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Spring Boot"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        getPublic("/api/courses/" + course.getId()).andExpect(status().isOk());
    }

    @Test
    void update_unknownCourse_returns404() throws Exception {
        Category java = saveCategory("Java", CategoryStatus.ACTIVE);

        putAs(adminToken(), ADMIN_URL + "/999999", validCourseJson(java.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_softDeletesCourse() throws Exception {
        Course course = saveCourse(saveCategory("Java", CategoryStatus.ACTIVE), "Live", CourseStatus.PUBLISHED, "100");

        deleteAs(adminToken(), ADMIN_URL + "/" + course.getId())
                .andExpect(status().isNoContent());

        assertEquals(CourseStatus.INACTIVE, courseRepository.findById(course.getId()).orElseThrow().getStatus());
        getPublic("/api/courses/" + course.getId()).andExpect(status().isNotFound());
    }
}
