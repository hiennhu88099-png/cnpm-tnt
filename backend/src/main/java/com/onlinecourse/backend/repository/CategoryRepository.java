package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.Category;
import com.onlinecourse.backend.entity.CategoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByStatusOrderByNameAsc(CategoryStatus status);

    boolean existsByNameIgnoreCase(String name);

    // Used on update to allow keeping the same name while rejecting duplicates of other categories
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
