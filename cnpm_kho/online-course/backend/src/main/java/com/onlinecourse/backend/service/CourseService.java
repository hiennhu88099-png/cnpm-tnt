package com.onlinecourse.backend.service;

import com.onlinecourse.backend.dto.request.CourseRequest;
import com.onlinecourse.backend.dto.response.CourseDetailResponse;
import com.onlinecourse.backend.dto.response.CourseSummaryResponse;
import com.onlinecourse.backend.dto.response.LessonSummaryResponse;
import com.onlinecourse.backend.dto.response.PageResponse;
import com.onlinecourse.backend.entity.*;
import com.onlinecourse.backend.exception.FieldValidationException;
import com.onlinecourse.backend.exception.ResourceNotFoundException;
import com.onlinecourse.backend.repository.CategoryRepository;
import com.onlinecourse.backend.repository.CourseRepository;
import com.onlinecourse.backend.repository.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CourseService {

    public static final int MAX_PAGE_SIZE = 50;

    // Whitelist: sorting by arbitrary properties would let clients probe internal fields or trigger 500s
    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "price", "title");

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final LessonRepository lessonRepository;

    // ---- Public ----

    @Transactional(readOnly = true)
    public PageResponse<CourseSummaryResponse> searchPublished(String keyword, Long categoryId,
                                                               int page, int size, String sort) {
        return PageResponse.from(
                courseRepository.search(normalize(keyword), categoryId,
                        CourseStatus.PUBLISHED, CategoryStatus.ACTIVE, pageable(page, size, sort)),
                CourseSummaryResponse::from);
    }

    // DRAFT/INACTIVE courses and courses of inactive categories are hidden from students
    @Transactional(readOnly = true)
    public CourseDetailResponse getPublishedCourse(Long id) {
        Course course = findCourse(id);
        if (course.getStatus() != CourseStatus.PUBLISHED
                || course.getCategory().getStatus() != CategoryStatus.ACTIVE) {
            throw new ResourceNotFoundException("Course not found");
        }
        return toDetail(course);
    }

    // ---- Admin ----

    @Transactional(readOnly = true)
    public PageResponse<CourseSummaryResponse> searchAll(String keyword, Long categoryId, CourseStatus status,
                                                         int page, int size, String sort) {
        return PageResponse.from(
                courseRepository.search(normalize(keyword), categoryId, status, null, pageable(page, size, sort)),
                CourseSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse getCourse(Long id) {
        return toDetail(findCourse(id));
    }

    @Transactional
    public CourseDetailResponse create(CourseRequest request) {
        Course course = new Course();
        apply(course, request);
        course.setStatus(request.getStatus() != null ? request.getStatus() : CourseStatus.DRAFT);
        return toDetail(courseRepository.saveAndFlush(course));
    }

    @Transactional
    public CourseDetailResponse update(Long id, CourseRequest request) {
        Course course = findCourse(id);
        apply(course, request);
        if (request.getStatus() != null) {
            course.setStatus(request.getStatus());
        }
        // saveAndFlush so the returned updatedAt reflects this update
        return toDetail(courseRepository.saveAndFlush(course));
    }

    // Soft delete: enrollments and reviews (TV3) may reference the course, so it is only hidden
    @Transactional
    public void deactivate(Long id) {
        Course course = findCourse(id);
        course.setStatus(CourseStatus.INACTIVE);
        courseRepository.save(course);
    }

    // ---- Helpers ----

    private void apply(Course course, CourseRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new FieldValidationException("categoryId", "Category not found"));

        course.setCategory(category);
        course.setTitle(request.getTitle().trim());
        course.setDescription(blankToNull(request.getDescription()));
        course.setThumbnail(blankToNull(request.getThumbnail()));
        course.setPrice(request.getPrice());
        course.setInstructorName(blankToNull(request.getInstructorName()));
        course.setLevel(request.getLevel());
        course.setDuration(request.getDuration());
    }

    private CourseDetailResponse toDetail(Course course) {
        List<LessonSummaryResponse> lessons = lessonRepository
                .findAllByCourseIdAndStatusOrderByLessonOrderAsc(course.getId(), LessonStatus.ACTIVE).stream()
                .map(LessonSummaryResponse::from)
                .toList();
        return CourseDetailResponse.from(course, lessons);
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
    }

    private Pageable pageable(int page, int size, String sort) {
        if (page < 0) {
            throw new FieldValidationException("page", "Page must not be negative");
        }
        if (size < 1) {
            throw new FieldValidationException("size", "Size must be at least 1");
        }
        return PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), parseSort(sort));
    }

    // Accepts "field" or "field,asc|desc"; id is appended as a tie-breaker so pages never overlap
    private Sort parseSort(String sort) {
        String[] parts = (sort == null || sort.isBlank() ? "createdAt,desc" : sort).split(",");
        String field = parts[0].trim();
        if (!SORTABLE_FIELDS.contains(field)) {
            throw new FieldValidationException("sort", "Sort field must be one of " + SORTABLE_FIELDS);
        }

        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length > 1) {
            direction = Sort.Direction.fromOptionalString(parts[1].trim())
                    .orElseThrow(() -> new FieldValidationException("sort", "Sort direction must be asc or desc"));
        }
        return Sort.by(direction, field).and(Sort.by(direction, "id"));
    }

    private String normalize(String keyword) {
        return keyword == null || keyword.isBlank() ? null : keyword.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
