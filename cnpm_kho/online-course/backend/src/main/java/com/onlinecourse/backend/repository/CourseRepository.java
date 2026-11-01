package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.CategoryStatus;
import com.onlinecourse.backend.entity.Course;
import com.onlinecourse.backend.entity.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    /**
     * Search courses by optional keyword (title/description), category and statuses (null = no filter).
     * The public listing always passes PUBLISHED + ACTIVE so DRAFT courses are never exposed.
     */
    @EntityGraph(attributePaths = "category")
    @Query("""
            SELECT c FROM Course c
            WHERE (:courseStatus IS NULL OR c.status = :courseStatus)
              AND (:categoryStatus IS NULL OR c.category.status = :categoryStatus)
              AND (:categoryId IS NULL OR c.category.id = :categoryId)
              AND (:keyword IS NULL
                   OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Course> search(@Param("keyword") String keyword,
                        @Param("categoryId") Long categoryId,
                        @Param("courseStatus") CourseStatus courseStatus,
                        @Param("categoryStatus") CategoryStatus categoryStatus,
                        Pageable pageable);

    boolean existsByCategoryId(Long categoryId);
}
