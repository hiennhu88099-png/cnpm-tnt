# Luồng dữ liệu phân hệ Quản lý Khóa học

Tài liệu mô tả cách dữ liệu khóa học đi từ cơ sở dữ liệu lên giao diện người dùng qua từng tầng kiến trúc của dự án.

Thứ tự các tầng:

```
MySQL -> Entity -> Repository -> Service -> Controller -> (JSON) -> Axios -> React
```

Các file chính:
- Entity: `entity/Course.java`, `Category.java`, `Lesson.java`
- Repository: `repository/CourseRepository.java`, `LessonRepository.java`
- Service: `service/CourseService.java`
- Controller: `controller/CourseController.java`
- DTO: thư mục `dto/request` và `dto/response`
- Frontend: `src/api/client.js`, `src/api/courseApi.js`, `src/pages/CourseListPage.jsx`

## 1. Lấy danh sách khóa học (học viên xem)

Ví dụ người dùng vào trang `/courses` và tìm "java". Frontend sẽ gọi:

```
GET /api/courses?keyword=java&page=0&size=12
```

### Trên React

Ở `CourseListPage.jsx`, bộ lọc được đồng bộ trên URL (`q`, `categoryId`, `sort`, `page`) để F5 hay bấm Back vẫn giữ kết quả. Mỗi lần bộ lọc đổi thì gọi lại API:

```jsx
const fetchCourses = useCallback(
  () => courseApi.getAllCourses({ keyword, categoryId, sort, page, size: PAGE_SIZE }),
  [keyword, categoryId, sort, page],
);
const { data: result, error, loading, reload } = useApiQuery(fetchCourses);
```

Kết quả trả về có `content` là mảng khóa học, mỗi phần tử render ra một `CourseCard`.

### Axios

Hàm `getAllCourses` trong `courseApi.js` gọi `client.get` và lọc bỏ các tham số rỗng để URL gọn:

```js
getAllCourses: async (params) => {
  const res = await client.get('/api/courses', { params: cleanParams(params) });
  return res.data;
},
```

`client` là axios instance dùng chung, tự động gắn token `Bearer ...` vào header nếu người dùng đã đăng nhập.

### Controller

Spring tự lấy các tham số trên URL. API này public nên không yêu cầu `@PreAuthorize`:

```java
@GetMapping
public ResponseEntity<PageResponse<CourseSummaryResponse>> searchCourses(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(defaultValue = "createdAt,desc") String sort) {
    return ResponseEntity.ok(courseService.searchPublished(keyword, categoryId, page, size, sort));
}
```

### Service

Trong service truyền cố định `PUBLISHED` và `ACTIVE` để học viên không thể xem khóa học nháp hay đã ẩn:

```java
public PageResponse<CourseSummaryResponse> searchPublished(String keyword, Long categoryId,
                                                           int page, int size, String sort) {
    return toSummaryPage(courseRepository.search(normalize(keyword), categoryId,
            CourseStatus.PUBLISHED, CategoryStatus.ACTIVE, pageable(page, size, sort)));
}
```

Hàm `pageable()` kiểm tra `page` không âm, `size` tối đa 50, và `sort` chỉ cho phép `createdAt`, `price`, `title`.

Số bài học được đếm một lần cho cả trang bằng `GROUP BY` để tránh lỗi N+1 query:

```java
private PageResponse<CourseSummaryResponse> toSummaryPage(Page<Course> page) {
    Map<Long, Long> lessonCounts = countActiveLessons(page.getContent());
    return PageResponse.from(page,
            course -> CourseSummaryResponse.from(course, lessonCounts.getOrDefault(course.getId(), 0L)));
}
```

### Repository

Câu query tìm kiếm viết bằng JPQL:

```java
@EntityGraph(attributePaths = "category")
@Query("""
        SELECT c FROM Course c
        WHERE (:courseStatus IS NULL OR c.status = :courseStatus)
          AND (:categoryStatus IS NULL OR c.category.status = :categoryStatus)
          AND (:categoryId IS NULL OR c.category.id = :categoryId)
          AND (:keyword IS NULL
               OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
        """)
Page<Course> search(...);
```

`@EntityGraph` giúp nạp luôn `category` trong cùng câu query.

Câu đếm bài học:

```java
@Query("""
        SELECT l.course.id, COUNT(l) FROM Lesson l
        WHERE l.course.id IN :courseIds AND l.status = :status
        GROUP BY l.course.id
        """)
List<Object[]> countByCourseIds(...);
```

### Entity và bảng MySQL

`Course.java` ánh xạ với bảng `courses`:

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "category_id", nullable = false)
private Category category;

@Column(nullable = false, precision = 12, scale = 2)
private BigDecimal price = BigDecimal.ZERO;

@Column(precision = 12, scale = 2)
private BigDecimal originalPrice;

@Enumerated(EnumType.STRING)
private CourseStatus status = CourseStatus.DRAFT;
```

- Giá dùng `BigDecimal` / `DECIMAL(12,2)` để đảm bảo độ chính xác khi tính toán tiền tệ.
- Trạng thái lưu dạng chuỗi (`DRAFT`, `PUBLISHED`, `INACTIVE`).

### Phản hồi JSON

Entity `Course` được chuyển sang `CourseSummaryResponse`, bọc trong `PageResponse`:

```json
{ "content": [ ... ], "page": 0, "size": 12, "totalElements": 25, "totalPages": 3 }
```

## 2. Admin tạo khóa học

Admin bấm Lưu ở trang `/admin/courses/new` sẽ gọi `POST /api/courses`:

```jsx
const payload = toPayload(form);
const created = await courseApi.createCourse(payload);
navigate(`/admin/lessons?courseId=${created.id}`, { ... });
```

Ở controller có 2 lớp kiểm tra:

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<CourseDetailResponse> create(@Valid @RequestBody CourseCreateRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(request));
}
```

- `@PreAuthorize`: không phải admin thì trả 403, chưa đăng nhập thì 401.
- `@Valid`: kiểm tra các ràng buộc dữ liệu trong `CourseRequest`.

## 3. Xử lý ngoại lệ

Mọi ngoại lệ đi qua `GlobalExceptionHandler` để trả về cùng một cấu trúc JSON:

```json
{ "status": 400, "message": "Validation error", "errors": { "originalPrice": "..." }, "timestamp": "..." }
```

- Sai dữ liệu (`@Valid` hoặc lỗi nghiệp vụ) → 400
- Không có quyền → 403
- Không tìm thấy hoặc khóa học đang ẩn → 404

