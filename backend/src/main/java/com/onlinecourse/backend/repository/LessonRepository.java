package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.Lesson;
import com.onlinecourse.backend.entity.LessonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findAllByCourseIdOrderByLessonOrderAsc(Long courseId);

    List<Lesson> findAllByCourseIdAndStatusOrderByLessonOrderAsc(Long courseId, LessonStatus status);

    boolean existsByCourseIdAndLessonOrder(Long courseId, Integer lessonOrder);

    // Used on update to allow keeping the same order while rejecting duplicates within the course
    boolean existsByCourseIdAndLessonOrderAndIdNot(Long courseId, Integer lessonOrder, Long id);
}
