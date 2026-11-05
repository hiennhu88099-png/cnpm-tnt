package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.Review;
import com.onlinecourse.backend.entity.ReviewStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository
        extends JpaRepository<Review, Long> {

    long countByStatus(ReviewStatus status);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.status = :status")
    Double averageRatingByStatus(@Param("status") ReviewStatus status);

    boolean existsByUserIdAndCourseId(
        Long userId,
        Long courseId
    );

    long countByCourseIdAndStatus(
        Long courseId,
        ReviewStatus status
    );

    @Query("""
        SELECT AVG(r.rating)
        FROM Review r
        WHERE r.course.id = :courseId
          AND r.status = :status
        """)
    Double averageRating(
        @Param("courseId") Long courseId,
        @Param("status") ReviewStatus status
    );

    @EntityGraph(attributePaths = {"user", "course"})
    Page<Review> findByCourseIdAndStatus(
        Long courseId,
        ReviewStatus status,
        Pageable pageable
    );

    @Override
    @EntityGraph(attributePaths = {"user", "course"})
    Page<Review> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "course"})
    Page<Review> findAllByStatus(ReviewStatus status, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"user", "course"})
    Optional<Review> findById(Long id);
}
