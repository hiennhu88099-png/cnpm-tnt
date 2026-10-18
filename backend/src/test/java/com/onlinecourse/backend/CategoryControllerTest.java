package com.onlinecourse.backend;

import com.jayway.jsonpath.JsonPath;
import com.onlinecourse.backend.entity.Category;
import com.onlinecourse.backend.entity.CategoryStatus;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryControllerTest extends CourseApiTestSupport {

    private static final String ADMIN_URL = "/api/admin/categories";

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
        postJson(ADMIN_URL, "{\"name\":\"Java\"}")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_asStudent_returns403() throws Exception {
        postAs(userToken(), ADMIN_URL, "{\"name\":\"Java\"}")
                .andExpect(status().isForbidden());
    }

    // ---- Admin: create ----

    @Test
    void create_asAdmin_withValidData_returns201Active() throws Exception {
        postAs(adminToken(), ADMIN_URL, """
                {"name":"  Java  ","description":"Backend","image":"https://img.example/java.png"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Java"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void create_withBlankName_returns400() throws Exception {
        postAs(adminToken(), ADMIN_URL, "{\"name\":\"   \"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void create_withDuplicateName_ignoringCase_returns400() throws Exception {
        saveCategory("Java", CategoryStatus.ACTIVE);

        postAs(adminToken(), ADMIN_URL, "{\"name\":\"java\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void create_withNonHttpImage_returns400() throws Exception {
        postAs(adminToken(), ADMIN_URL, "{\"name\":\"Java\",\"image\":\"javascript:alert(1)\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.image").exists());
    }

    // ---- Admin: list / update / delete ----

    @Test
    void adminList_returnsActiveAndInactive() throws Exception {
        saveCategory("Java", CategoryStatus.ACTIVE);
        saveCategory("Legacy", CategoryStatus.INACTIVE);

        getAs(adminToken(), ADMIN_URL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void update_keepingSameName_succeeds() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);

        putAs(adminToken(), ADMIN_URL + "/" + category.getId(), """
                {"name":"Java","description":"Updated"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Updated"));
    }

    @Test
    void update_toNameOfAnotherCategory_returns400() throws Exception {
        saveCategory("Java", CategoryStatus.ACTIVE);
        Category other = saveCategory("Python", CategoryStatus.ACTIVE);

        putAs(adminToken(), ADMIN_URL + "/" + other.getId(), "{\"name\":\"JAVA\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void update_canReactivateCategory() throws Exception {
        Category category = saveCategory("Legacy", CategoryStatus.INACTIVE);

        putAs(adminToken(), ADMIN_URL + "/" + category.getId(), "{\"name\":\"Legacy\",\"status\":\"ACTIVE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void update_unknownId_returns404() throws Exception {
        putAs(adminToken(), ADMIN_URL + "/999999", "{\"name\":\"Java\"}")
                .andExpect(status().isNotFound());
    }

    @Test
    void delete_softDeletesCategory() throws Exception {
        Category category = saveCategory("Java", CategoryStatus.ACTIVE);

        deleteAs(adminToken(), ADMIN_URL + "/" + category.getId())
                .andExpect(status().isNoContent());

        Category reloaded = categoryRepository.findById(category.getId()).orElseThrow();
        assertEquals(CategoryStatus.INACTIVE, reloaded.getStatus());
    }

    @Test
    void createdCategory_appearsInPublicList() throws Exception {
        String body = postAs(adminToken(), ADMIN_URL, "{\"name\":\"Java\"}")
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(body, "$.id");

        getPublic("/api/categories")
                .andExpect(jsonPath("$[0].id").value(id));
    }
}
