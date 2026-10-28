package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.request.CategoryRequest;
import com.onlinecourse.backend.dto.response.CategoryResponse;
import com.onlinecourse.backend.entity.Category;
import com.onlinecourse.backend.entity.CategoryStatus;
import com.onlinecourse.backend.exception.FieldValidationException;
import com.onlinecourse.backend.exception.ResourceNotFoundException;
import com.onlinecourse.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    // ---- Public ----

    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findAllByStatusOrderByNameAsc(CategoryStatus.ACTIVE).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    // Inactive categories are hidden from students, so they are reported as not found
    @Transactional(readOnly = true)
    public CategoryResponse getActiveCategory(Long id) {
        Category category = findCategory(id);
        if (category.getStatus() != CategoryStatus.ACTIVE) {
            throw new ResourceNotFoundException("Category not found");
        }
        return CategoryResponse.from(category);
    }

    // ---- Admin ----

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll(Sort.by("name")).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String name = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new FieldValidationException("name", "Category name already exists");
        }

        Category category = Category.builder()
                .name(name)
                .description(blankToNull(request.getDescription()))
                .image(blankToNull(request.getImage()))
                .status(request.getStatus() != null ? request.getStatus() : CategoryStatus.ACTIVE)
                .build();
        return CategoryResponse.from(categoryRepository.saveAndFlush(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = findCategory(id);
        String name = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new FieldValidationException("name", "Category name already exists");
        }

        category.setName(name);
        category.setDescription(blankToNull(request.getDescription()));
        category.setImage(blankToNull(request.getImage()));
        if (request.getStatus() != null) {
            category.setStatus(request.getStatus());
        }
        // saveAndFlush so the returned updatedAt reflects this update
        return CategoryResponse.from(categoryRepository.saveAndFlush(category));
    }

    // Soft delete: courses may still reference this category, so it is only deactivated
    @Transactional
    public void deactivate(Long id) {
        Category category = findCategory(id);
        category.setStatus(CategoryStatus.INACTIVE);
        categoryRepository.save(category);
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
