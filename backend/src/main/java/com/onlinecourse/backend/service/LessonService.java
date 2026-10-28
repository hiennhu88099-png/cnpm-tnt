package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.request.LessonRequest;
import com.onlinecourse.backend.dto.response.LessonResponse;
import com.onlinecourse.backend.dto.response.LessonSummaryResponse;
import com.onlinecourse.backend.entity.Course;
import com.onlinecourse.backend.entity.Lesson;
import com.onlinecourse.backend.entity.LessonStatus;
import com.onlinecourse.backend.exception.FieldValidationException;
import com.onlinecourse.backend.exception.ResourceNotFoundException;
import com.onlinecourse.backend.repository.CourseRepository;
import com.onlinecourse.backend.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;

    // ---- Public ----

    // Curriculum preview: summaries only, never the video URL
    @Transactional(readOnly = true)
    public List<LessonSummaryResponse> getPublicLessons(Long courseId) {
        Course course = findCourse(courseId);
        if (!course.isVisibleToPublic()) {
            throw new ResourceNotFoundException("Course not found");
        }
        return lessonRepository.findAllByCourseIdAndStatusOrderByLessonOrderAsc(courseId, LessonStatus.ACTIVE).stream()
                .map(LessonSummaryResponse::from)
                .toList();
    }

    // ---- Admin ----

    @Transactional(readOnly = true)
    public List<LessonResponse> getAllLessons(Long courseId) {
        findCourse(courseId);
        return lessonRepository.findAllByCourseIdOrderByLessonOrderAsc(courseId).stream()
                .map(LessonResponse::from)
                .toList();
    }

    @Transactional
    public LessonResponse create(Long courseId, LessonRequest request) {
        Course course = findCourse(courseId);
        // Inactive lessons keep their order slot, matching the UNIQUE(course_id, lesson_order) constraint
        if (lessonRepository.existsByCourseIdAndLessonOrder(courseId, request.getLessonOrder())) {
            throw duplicateOrder();
        }

        Lesson lesson = new Lesson();
        lesson.setCourse(course);
        apply(lesson, request);
        lesson.setStatus(request.getStatus() != null ? request.getStatus() : LessonStatus.ACTIVE);
        return LessonResponse.from(lessonRepository.saveAndFlush(lesson));
    }

    @Transactional
    public LessonResponse update(Long id, LessonRequest request) {
        Lesson lesson = findLesson(id);
        Long courseId = lesson.getCourse().getId();
        if (lessonRepository.existsByCourseIdAndLessonOrderAndIdNot(courseId, request.getLessonOrder(), id)) {
            throw duplicateOrder();
        }

        apply(lesson, request);
        if (request.getStatus() != null) {
            lesson.setStatus(request.getStatus());
        }
        // saveAndFlush so the returned updatedAt reflects this update
        return LessonResponse.from(lessonRepository.saveAndFlush(lesson));
    }

    // Soft delete: learning progress (TV3) may reference the lesson, so it is only hidden
    @Transactional
    public void deactivate(Long id) {
        Lesson lesson = findLesson(id);
        lesson.setStatus(LessonStatus.INACTIVE);
        lessonRepository.save(lesson);
    }

    // ---- Helpers ----

    private void apply(Lesson lesson, LessonRequest request) {
        lesson.setTitle(request.getTitle().trim());
        lesson.setDescription(blankToNull(request.getDescription()));
        lesson.setVideoUrl(blankToNull(request.getVideoUrl()));
        lesson.setDuration(request.getDuration());
        lesson.setLessonOrder(request.getLessonOrder());
    }

    private FieldValidationException duplicateOrder() {
        return new FieldValidationException("lessonOrder", "Lesson order already exists in this course");
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
    }

    private Lesson findLesson(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
