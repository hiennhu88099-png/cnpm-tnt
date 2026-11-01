
package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.request.*;
import com.onlinecourse.backend.dto.response.*;
import com.onlinecourse.backend.entity.*;
import com.onlinecourse.backend.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;

    // Tao danh gia moi
    @Transactional
    public ReviewResponse create(
            User user,
            ReviewRequest request) {

        enrollmentService.requireAccess(
            user,
            request.courseId()
        );

        if (reviewRepository.existsByUserIdAndCourseId(
                user.getId(),
                request.courseId())) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Review already exists"
            );
        }

        Course course = courseRepository
            .findById(request.courseId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Course not found"
            ));

        Review review = Review.builder()
            .user(user)
            .course(course)
            .rating(request.rating())
            .comment(request.comment())
            .status(ReviewStatus.APPROVED)
            .build();

        review = reviewRepository.save(review);

        return toResponse(review);
    }

    // Tinh tong so va diem danh gia trung binh
    @Transactional(readOnly = true)
    public ReviewSummaryResponse summary(Long courseId) {

        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Course not found"
            );
        }

        long count = reviewRepository.countByCourseIdAndStatus(
            courseId,
            ReviewStatus.APPROVED
        );

        Double average = reviewRepository.averageRating(
            courseId,
            ReviewStatus.APPROVED
        );

        return new ReviewSummaryResponse(
            average == null
                ? 0
                : Math.round(average * 10) / 10.0,
            count
        );
    }

    // Danh sach danh gia cong khai
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> publicReviews(
            Long courseId,
            int page,
            int size) {

        checkPagination(page, size);

        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Course not found"
            );
        }

        return PageResponse.from(
            reviewRepository.findByCourseIdAndStatus(
                courseId,
                ReviewStatus.APPROVED,
                PageRequest.of(
                    page,
                    size,
                    Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                    )
                )
            ),
            this::toResponse
        );
    }

    // Sua danh gia cua chinh minh
    @Transactional
    public ReviewResponse update(
            User user,
            Long reviewId,
            UpdateReviewRequest request) {

        Review review = findReview(reviewId);

        if (!review.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Cannot edit another user's review"
            );
        }

        review.setRating(request.rating());
        review.setComment(request.comment());

        return toResponse(reviewRepository.save(review));
    }

    // Xoa danh gia
    @Transactional
    public void delete(User user, Long reviewId) {

        Review review = findReview(reviewId);

        if (user.getRole() != Role.ADMIN &&
                !review.getUser().getId().equals(user.getId())) {

            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Cannot delete another user's review"
            );
        }

        reviewRepository.delete(review);
    }

    // Admin xem tat ca danh gia
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> adminList(
            int page,
            int size) {

        checkPagination(page, size);

        return PageResponse.from(
            reviewRepository.findAll(
                PageRequest.of(
                    page,
                    size,
                    Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                    )
                )
            ),
            this::toResponse
        );
    }

    // Admin an hoac hien danh gia
    @Transactional
    public ReviewResponse changeStatus(
            Long reviewId,
            ReviewStatus status) {

        if (status != ReviewStatus.APPROVED &&
                status != ReviewStatus.HIDDEN) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Status must be APPROVED or HIDDEN"
            );
        }

        Review review = findReview(reviewId);
        review.setStatus(status);

        return toResponse(reviewRepository.save(review));
    }

    private Review findReview(Long id) {

        return reviewRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Review not found"
            ));
    }

    private void checkPagination(int page, int size) {

        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid pagination"
            );
        }
    }

    private ReviewResponse toResponse(Review review) {

        return new ReviewResponse(
            review.getId(),
            review.getUser().getId(),
            review.getUser().getFullName(),
            review.getUser().getAvatar(),
            review.getCourse().getId(),
            review.getCourse().getTitle(),
            review.getRating(),
            review.getComment(),
            review.getStatus(),
            review.getCreatedAt()
        );
    }
}
