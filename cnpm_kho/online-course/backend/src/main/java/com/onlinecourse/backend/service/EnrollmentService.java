package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.response.EnrollmentResponse;
import com.onlinecourse.backend.dto.response.PageResponse;

import com.onlinecourse.backend.entity.*;
import com.onlinecourse.backend.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final CourseRepository courseRepository;

    // Đăng ký khóa học
    @Transactional
    public EnrollmentResponse enroll(User user, Long courseId) {

        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Course not found"
            ));

        // Kiểm tra khóa học được phép đăng ký
        if (!course.isVisibleToPublic()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Course is not published or category is inactive"
            );
        }

        // Kiểm tra đăng ký trùng
        if (enrollmentRepository.existsByUserIdAndCourseId(
                user.getId(), courseId)) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "User already enrolled in this course"
            );
        }

        // Tạo đăng ký mới
        Enrollment enrollment = Enrollment.builder()
            .user(user)
            .course(course)
            .status(EnrollmentStatus.ACTIVE)
            .build();

        enrollment = enrollmentRepository.save(enrollment);

        return toResponse(enrollment);
    }

    // Lấy danh sách khóa học của tôi
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> myCourses(User user) {

        return enrollmentRepository
            .findByUserIdOrderByEnrolledAtDesc(user.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // Xem chi tiết đăng ký
    @Transactional(readOnly = true)
    public EnrollmentResponse detail(
            User user, Long enrollmentId) {

        Enrollment enrollment = enrollmentRepository
            .findById(enrollmentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Enrollment not found"
            ));

        // Chỉ chủ sở hữu hoặc Admin được xem
        if (user.getRole() != Role.ADMIN &&
                !enrollment.getUser().getId().equals(user.getId())) {

            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Not your enrollment"
            );
        }

        return toResponse(enrollment);
    }

    // Admin xem toàn bộ đăng ký
    @Transactional(readOnly = true)
    public PageResponse<EnrollmentResponse> adminList(
            Long userId,
            Long courseId,
            int page,
            int size) {

        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid pagination"
            );
        }

        return PageResponse.from(
            enrollmentRepository.search(
                userId,
                courseId,
                PageRequest.of(
                    page,
                    size,
                    Sort.by(
                        Sort.Direction.DESC,
                        "enrolledAt"
                    )
                )
            ),
            this::toResponse
        );
    }

    // Kiểm tra quyền học khóa học
    @Transactional(readOnly = true)
    public Enrollment requireAccess(
            User user, Long courseId) {

        Enrollment enrollment = enrollmentRepository
            .findByUserIdAndCourseId(
                user.getId(),
                courseId
            )
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Enrollment required"
            ));

        if (enrollment.getStatus() == EnrollmentStatus.CANCELLED) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Enrollment cancelled"
            );
        }

        return enrollment;
    }

    // Chuyển Entity thành Response
    public EnrollmentResponse toResponse(Enrollment enrollment) {

        Course course = enrollment.getCourse();

        return new EnrollmentResponse(
            enrollment.getId(),
            enrollment.getUser().getId(),
            course.getId(),
            course.getTitle(),
            course.getThumbnail(),
            course.getInstructorName(),
            course.getLevel(),
            enrollment.getEnrolledAt(),
            enrollment.getStatus(),
            progressPercent(enrollment)
        );
    }

    // Tính phần trăm tiến độ học
    public double progressPercent(Enrollment enrollment) {

        List<Lesson> lessons = lessonRepository
            .findAllByCourseIdAndStatusOrderByLessonOrderAsc(
                enrollment.getCourse().getId(),
                LessonStatus.ACTIVE
            );

        if (lessons.isEmpty()) {
            return 0;
        }

        Set<Long> lessonIds = lessons.stream()
            .map(Lesson::getId)
            .collect(Collectors.toSet());

        long completed = progressRepository
            .findByEnrollmentIdAndCompletedTrue(
                enrollment.getId()
            )
            .stream()
            .filter(progress ->
                lessonIds.contains(
                    progress.getLesson().getId()
                )
            )
            .count();

        return Math.round(
            completed * 10000.0 / lessons.size()
        ) / 100.0;
    }
}
