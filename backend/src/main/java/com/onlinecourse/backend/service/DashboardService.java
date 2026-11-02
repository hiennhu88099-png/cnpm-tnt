package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.response.DashboardSummaryResponse;
import com.onlinecourse.backend.repository.CourseRepository;
import com.onlinecourse.backend.repository.EnrollmentRepository;
import com.onlinecourse.backend.repository.ReviewRepository;
import com.onlinecourse.backend.repository.UserRepository;

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
            courseRepository.count(),
            enrollmentRepository.count(),
            reviewRepository.count()
        );
    }
}
