package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.Enrollment;
import com.onlinecourse.backend.entity.EnrollmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository
        extends JpaRepository<Enrollment, Long> {

    boolean existsByUserIdAndCourseId(
        Long userId, Long courseId
    );

    long countByStatus(EnrollmentStatus status);

    @EntityGraph(attributePaths = {
        "user", "course", "course.category"
    })
    Optional<Enrollment> findByUserIdAndCourseId(
        Long userId, Long courseId
    );

    @EntityGraph(attributePaths = {
        "user", "course", "course.category"
    })
    List<Enrollment> findByUserIdOrderByEnrolledAtDesc(
        Long userId
    );

    @Override
    @EntityGraph(attributePaths = {
        "user", "course", "course.category"
    })
    Optional<Enrollment> findById(Long id);

    @EntityGraph(attributePaths = {
        "user", "course"
    })
    @Query("""
        SELECT e FROM Enrollment e
        WHERE (:userId IS NULL OR e.user.id = :userId)
          AND (:courseId IS NULL OR e.course.id = :courseId)
          AND (:keyword IS NULL
               OR LOWER(e.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(e.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(e.course.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
    Page<Enrollment> search(
        @Param("userId") Long userId,
        @Param("courseId") Long courseId,
        @Param("keyword") String keyword,
        Pageable pageable
    );
}
