package com.onlinecourse.backend;

import com.jayway.jsonpath.JsonPath;
import com.onlinecourse.backend.entity.Category;
import com.onlinecourse.backend.entity.CategoryStatus;
import com.onlinecourse.backend.entity.Course;
import com.onlinecourse.backend.entity.CourseLevel;
import com.onlinecourse.backend.entity.CourseStatus;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryControllerTest extends CourseApiTestSupport {

    private static final String URL = "/api/categories";
    private static final String ADMIN_LIST_URL = "/api/admin/categories";

    private Category saveCategory(String name, CategoryStatus status) {
        return categoryRepository.save(Category.builder().name(name).status(status).build());
    }

    // ---- Public ----

    @Test
    void publicList_withoutToken_returnsOnlyActiveCategories() throws Exception {
        saveCategory("Java", CategoryStatus.ACTIVE);
        saveCategory("Legacy", CategoryStatus.INACTIVE);

        getPublic("/api/categories")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Java"));
    }

    @Test
    void publicDetail_ofActiveCategory_returnsCategory() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);

        getPublic("/api/categories/" + category.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Java"));
    }

    @Test
    void publicDetail_ofInactiveCategory_returns404() throws Exception {
        Category category = saveCategory("Legacy", CategoryStatus.INACTIVE);

        getPublic("/api/categories/" + category.getId())
                .andExpect(status().isNotFound());
    }

    @Test
    void publicDetail_ofUnknownId_returns404() throws Exception {
        getPublic("/api/categories/999999").andExpect(status().isNotFound());
    }

    // ---- Admin: authorization ----

    @Test
    void create_withoutToken_returns401() throws Exception {
        postJson(URL, "{\"name\":\"Java\"}")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_asStudent_returns403() throws Exception {
        postAs(userToken(), URL, "{\"name\":\"Java\"}")
                .andExpect(status().isForbidden());
    }

    @Test
    void update_asStudent_returns403() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);

        putAs(userToken(), URL + "/" + category.getId(), "{\"name\":\"Hacked\"}")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
        assertEquals("Java", categoryRepository.findById(category.getId()).orElseThrow().getName());
    }

    @Test
    void delete_asStudent_returns403() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);

        deleteAs(userToken(), URL + "/" + category.getId())
                .andExpect(status().isForbidden());
        assertEquals(CategoryStatus.ACTIVE, categoryRepository.findById(category.getId()).orElseThrow().getStatus());
    }

    @Test
    void adminList_asStudent_returns403() throws Exception {
        getAs(userToken(), ADMIN_LIST_URL).andExpect(status().isForbidden());
    }

    // ---- Admin: create ----

    @Test
    void create_asAdmin_withValidData_returns201Active() throws Exception {
        postAs(adminToken(), URL, """
                {"name":"  Java  ","description":"Backend","image":"https://img.example/java.png"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Java"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_withBlankName_returns400() throws Exception {
        postAs(adminToken(), URL, "{\"name\":\"   \"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void create_withDuplicateName_ignoringCase_returns400() throws Exception {
        saveCategory("Java", CategoryStatus.ACTIVE);

        postAs(adminToken(), URL, "{\"name\":\"java\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void create_withNonHttpImage_returns400() throws Exception {
        postAs(adminToken(), URL, "{\"name\":\"Java\",\"image\":\"javascript:alert(1)\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.image").exists());
    }

    // ---- Admin: list / update / delete ----

    @Test
    void adminList_returnsActiveAndInactive() throws Exception {
        saveCategory("Java", CategoryStatus.ACTIVE);
        saveCategory("Legacy", CategoryStatus.INACTIVE);

        getAs(adminToken(), ADMIN_LIST_URL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void update_keepingSameName_succeeds() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);

        putAs(adminToken(), URL + "/" + category.getId(), """
                {"name":"Java","description":"Updated"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated"));
    }

    @Test
    void update_toNameOfAnotherCategory_returns400() throws Exception {
        saveCategory("Java", CategoryStatus.ACTIVE);
        Category other = saveCategory("Python", CategoryStatus.ACTIVE);

        putAs(adminToken(), URL + "/" + other.getId(), "{\"name\":\"JAVA\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void update_canReactivateCategory() throws Exception {
        Category category = saveCategory("Legacy", CategoryStatus.INACTIVE);

        putAs(adminToken(), URL + "/" + category.getId(), "{\"name\":\"Legacy\",\"status\":\"ACTIVE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void update_unknownId_returns404() throws Exception {
        putAs(adminToken(), URL + "/999999", "{\"name\":\"Java\"}")
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_softDeletesCategory() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);

        deleteAs(adminToken(), URL + "/" + category.getId())
                .andExpect(status().isNoContent());

        Category reloaded = categoryRepository.findById(category.getId()).orElseThrow();
        assertEquals(CategoryStatus.INACTIVE, reloaded.getStatus());
    }

    @Test
    void delete_categoryReferencedByCourse_keepsCategoryAndCourse() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);
        Course course = courseRepository.save(Course.builder()
                .category(category).title("Spring Boot").level(CourseLevel.BEGINNER)
                .status(CourseStatus.PUBLISHED).build());

        deleteAs(adminToken(), URL + "/" + category.getId())
                .andExpect(status().isNoContent());

        // No hard delete: both rows survive, the category is only deactivated
        assertEquals(CategoryStatus.INACTIVE, categoryRepository.findById(category.getId()).orElseThrow().getStatus());
        assertTrue(courseRepository.existsById(course.getId()));
    }

    @Test
    void createdCategory_appearsInPublicList() throws Exception {
        String body = postAs(adminToken(), URL, "{\"name\":\"Java\"}")
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(body, "$.id");

        getPublic("/api/categories")
                .andExpect(jsonPath("$[0].id").value(id));
    }
}
