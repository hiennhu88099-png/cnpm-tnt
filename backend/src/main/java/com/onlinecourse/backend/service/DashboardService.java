package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.response.DashboardSummaryResponse;
import com.onlinecourse.backend.repository.CourseRepository;
import com.onlinecourse.backend.repository.EnrollmentRepository;
import com.onlinecourse.backend.repository.ReviewRepository;
import com.onlinecourse.backend.repository.UserRepository;
import com.onlinecourse.backend.entity.UserStatus;
import com.onlinecourse.backend.entity.CourseStatus;
import com.onlinecourse.backend.entity.EnrollmentStatus;
import com.onlinecourse.backend.entity.ReviewStatus;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary() {

        return new DashboardSummaryResponse(
            userRepository.count(),
            userRepository.countByStatus(UserStatus.ACTIVE),
            userRepository.countByStatus(UserStatus.BLOCKED),
            courseRepository.count(),
            courseRepository.countByStatus(CourseStatus.PUBLISHED),
            courseRepository.countByStatus(CourseStatus.DRAFT),
            enrollmentRepository.count(),
            enrollmentRepository.countByStatus(EnrollmentStatus.ACTIVE),
            enrollmentRepository.countByStatus(EnrollmentStatus.COMPLETED),
            reviewRepository.count(),
            reviewRepository.countByStatus(ReviewStatus.APPROVED),
            reviewRepository.countByStatus(ReviewStatus.PENDING),
            reviewRepository.countByStatus(ReviewStatus.HIDDEN),
            averageApprovedRating()
        );
    }

    private double averageApprovedRating() {
        Double average = reviewRepository.averageRatingByStatus(ReviewStatus.APPROVED);
        return average == null ? 0.0 : average;
    }
}
