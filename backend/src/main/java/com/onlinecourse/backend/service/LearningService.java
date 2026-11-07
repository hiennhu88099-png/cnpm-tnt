package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.response.*;
import com.onlinecourse.backend.entity.*;
import com.onlinecourse.backend.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningService {

    private final LessonRepository lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;

    // Lay danh sach bai hoc cho hoc vien
    @Transactional(readOnly = true)
    public List<LearningLessonResponse> lessons(
            User user, Long courseId) {

        Enrollment enrollment =
            accessibleEnrollment(user, courseId);

        Map<Long, LessonProgress> progressMap = enrollment == null
            ? Map.of()
            : progressRepository
                .findByEnrollmentId(enrollment.getId())
                .stream()
                .collect(Collectors.toMap(
                    p -> p.getLesson().getId(),
                    Function.identity(),
                    (existing, replacement) -> existing
                ));

        return lessonRepository
            .findAllByCourseIdAndStatusOrderByLessonOrderAsc(
                courseId,
                LessonStatus.ACTIVE
            )
            .stream()
            .map(lesson -> {
                LessonProgress lp = progressMap.get(lesson.getId());
                boolean completed = lp != null && lp.isCompleted();
                int lastWatchedSec = lp != null && lp.getLastWatchedSecond() != null
                    ? lp.getLastWatchedSecond()
                    : 0;
                return new LearningLessonResponse(
                    lesson.getId(),
                    lesson.getTitle(),
                    lesson.getDescription(),
                    lesson.getVideoUrl(),
                    lesson.getDuration(),
                    lesson.getLessonOrder(),
                    completed,
                    lastWatchedSec
                );
            })
            .toList();
    }

    // Luu vi tri giay dang xem video xuong database (Resume Playback da thiet bi)
    @Transactional
    public Map<String, Object> saveWatchPosition(
            User user, Long lessonId, int lastWatchedSecond) {

        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Lesson not found"
            ));

        if (lesson.getStatus() != LessonStatus.ACTIVE) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Lesson inactive"
            );
        }

        Long courseId = lesson.getCourse().getId();
        Enrollment enrollment = enrollmentService.requireAccess(user, courseId);

        LessonProgress progress = progressRepository
            .findByEnrollmentIdAndLessonId(enrollment.getId(), lessonId)
            .orElseGet(() ->
                LessonProgress.builder()
                    .enrollment(enrollment)
                    .lesson(lesson)
                    .build()
            );

        int safeSecond = Math.max(0, lastWatchedSecond);
        progress.setLastWatchedSecond(safeSecond);
        progressRepository.saveAndFlush(progress);

        return Map.of(
            "lessonId", lessonId,
            "lastWatchedSecond", safeSecond,
            "completed", progress.isCompleted()
        );
    }

    // Danh dau bai hoc da hoan thanh
    @Transactional
    public ProgressResponse complete(
            User user, Long lessonId) {

        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Lesson not found"
            ));

        if (lesson.getStatus() != LessonStatus.ACTIVE) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Lesson inactive"
            );
        }

        Long courseId = lesson.getCourse().getId();

        // Kiem tra quyen hoc khoa hoc
        Enrollment enrollment =
            enrollmentService.requireAccess(user, courseId);

        LessonProgress progress = progressRepository
            .findByEnrollmentIdAndLessonId(
                enrollment.getId(),
                lessonId
            )
            .orElseGet(() ->
                LessonProgress.builder()
                    .enrollment(enrollment)
                    .lesson(lesson)
                    .build()
            );

        if (!progress.isCompleted()) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());

            progressRepository.saveAndFlush(progress);
        }

        ProgressResponse result =
            progressFor(enrollment, courseId);

        // Neu hoan thanh tat ca bai hoc
        if (result.totalLessons() > 0 &&
                result.completedLessons() == result.totalLessons() &&
                enrollment.getStatus() == EnrollmentStatus.ACTIVE) {

            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollmentRepository.save(enrollment);
        }

        return result;
    }

    // Xem tien do khoa hoc
    @Transactional(readOnly = true)
    public ProgressResponse progress(
            User user, Long courseId) {

        Enrollment enrollment =
            accessibleEnrollment(user, courseId);

        if (enrollment == null) {
            long total = lessonRepository
                .findAllByCourseIdAndStatusOrderByLessonOrderAsc(
                    courseId,
                    LessonStatus.ACTIVE
                )
                .size();

            return new ProgressResponse(
                courseId,
                total,
                0,
                0
            );
        }

        return progressFor(enrollment, courseId);
    }

    // Lay dang ky hop le cua hoc vien
    private Enrollment accessibleEnrollment(
            User user, Long courseId) {

        if (user.getRole() == Role.ADMIN) {
            return enrollmentRepository
                .findByUserIdAndCourseId(
                    user.getId(),
                    courseId
                )
                .filter(e ->
                    e.getStatus() != EnrollmentStatus.CANCELLED
                )
                .orElse(null);
        }

        return enrollmentService.requireAccess(
            user,
            courseId
        );
    }

    // Tinh phan tram hoan thanh
    private ProgressResponse progressFor(
            Enrollment enrollment, Long courseId) {

        List<Lesson> lessons = lessonRepository
            .findAllByCourseIdAndStatusOrderByLessonOrderAsc(
                courseId,
                LessonStatus.ACTIVE
            );

        if (lessons.isEmpty()) {
            return new ProgressResponse(
                courseId, 0, 0, 0
            );
        }

        Set<Long> lessonIds = lessons.stream()
            .map(Lesson::getId)
            .collect(Collectors.toSet());

        long completed = progressRepository
            .findByEnrollmentIdAndCompletedTrue(
                enrollment.getId()
            )
            .stream()
            .filter(p ->
                lessonIds.contains(p.getLesson().getId())
            )
            .count();

        double percent = Math.round(
            completed * 10000.0 / lessons.size()
        ) / 100.0;

        return new ProgressResponse(
            courseId,
            lessons.size(),
            completed,
            percent
        );
    }
}
