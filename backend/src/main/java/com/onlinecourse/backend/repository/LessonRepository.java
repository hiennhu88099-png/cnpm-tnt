package com.onlinecourse.backend.repository;

import com.onlinecourse.backend.entity.Lesson;
import com.onlinecourse.backend.entity.LessonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findAllByCourseIdOrderByLessonOrderAsc(Long courseId);

    List<Lesson> findAllByCourseIdAndStatusOrderByLessonOrderAsc(Long courseId, LessonStatus status);

    boolean existsByCourseIdAndLessonOrder(Long courseId, Integer lessonOrder);

    // Used on update to allow keeping the same order while rejecting duplicates within the course
    boolean existsByCourseIdAndLessonOrderAndIdNot(Long courseId, Integer lessonOrder, Long id);

    // Lesson counts for a whole page of courses in one query (avoids N+1); rows are [courseId, count]
    @Query("""
            SELECT l.course.id, COUNT(l) FROM Lesson l
            WHERE l.course.id IN :courseIds AND l.status = :status
            GROUP BY l.course.id
            """)
    List<Object[]> countByCourseIds(@Param("courseIds") Collection<Long> courseIds,
                                    @Param("status") LessonStatus status);
}
