package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository
        extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByEnrollmentIdAndLessonId(
        Long enrollmentId,
        Long lessonId
    );

    List<LessonProgress> findByEnrollmentIdAndCompletedTrue(
        Long enrollmentId
    );
}
