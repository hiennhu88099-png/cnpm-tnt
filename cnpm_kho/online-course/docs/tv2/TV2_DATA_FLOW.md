# Luồng dữ liệu của phần Khóa học (TV2)

Phần này mình ghi lại dữ liệu khóa học đi từ database lên tới giao diện như thế nào, lấy code trong project ra làm ví dụ luôn.

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

Ở `CourseListPage.jsx` mình để bộ lọc trên URL (q, categoryId, sort, page) để F5 hay bấm Back vẫn giữ kết quả. Mỗi lần bộ lọc đổi thì gọi lại API:

```jsx
const fetchCourses = useCallback(
  () => courseApi.getAllCourses({ keyword, categoryId, sort, page, size: PAGE_SIZE }),
  [keyword, categoryId, sort, page],
);
const { data: result, error, loading, reload } = useApiQuery(fetchCourses);
```

Kết quả trả về có `content` là mảng khóa học, mỗi cái render ra một `CourseCard`.

### Axios

Hàm `getAllCourses` trong `courseApi.js` chỉ gọi `client.get`, có lọc bỏ mấy tham số rỗng cho URL gọn:

```js
getAllCourses: async (params) => {
  const res = await client.get('/api/courses', { params: cleanParams(params) });
  return res.data;
},
```

`client` là axios instance của TV1 làm sẵn, có baseURL `http://localhost:8080` và tự gắn token `Bearer ...` vào header nếu đã đăng nhập. Nên bên mình không phải tự thêm token.

### Controller

Spring tự lấy các tham số trên URL. API này ai cũng xem được nên không có `@PreAuthorize`:

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

Trong service mình truyền cứng `PUBLISHED` và `ACTIVE` vào, để học viên không thể xem được khóa học nháp hay đã ẩn dù có sửa URL:

```java
public PageResponse<CourseSummaryResponse> searchPublished(String keyword, Long categoryId,
                                                           int page, int size, String sort) {
    return toSummaryPage(courseRepository.search(normalize(keyword), categoryId,
            CourseStatus.PUBLISHED, CategoryStatus.ACTIVE, pageable(page, size, sort)));
}
```

Hàm `pageable()` kiểm tra page không được âm, size tối đa 50, còn sort chỉ cho `createdAt`, `price`, `title` (sort bậy sẽ báo 400 chứ không bị lỗi 500).

Số bài học thì nếu mỗi khóa học query riêng để đếm thì 12 khóa là 12 câu query. Nên mình đếm một lần cho cả trang bằng `GROUP BY`:

```java
private PageResponse<CourseSummaryResponse> toSummaryPage(Page<Course> page) {
    Map<Long, Long> lessonCounts = countActiveLessons(page.getContent());
    return PageResponse.from(page,
            course -> CourseSummaryResponse.from(course, lessonCounts.getOrDefault(course.getId(), 0L)));
}
```

### Repository

Câu query tìm kiếm viết bằng JPQL. Tham số nào null thì coi như không lọc theo cái đó. Phân trang thì để `Pageable` lo (nó tự thêm ORDER BY, LIMIT và đếm tổng số dòng):

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

`@EntityGraph` để lấy luôn category trong cùng câu query (cần tên danh mục để hiện trên thẻ khóa học).

Câu đếm bài học:

```java
@Query("""
        SELECT l.course.id, COUNT(l) FROM Lesson l
        WHERE l.course.id IN :courseIds AND l.status = :status
        GROUP BY l.course.id
        """)
List<Object[]> countByCourseIds(...);
```

Admin cũng dùng chung hàm `search` này, chỉ khác là truyền null cho status để thấy hết.

### Entity và bảng MySQL

`Course.java` map với bảng `courses`. Một số chỗ đáng chú ý:

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "category_id", nullable = false)
private Category category;

@Column(nullable = false, precision = 12, scale = 2)
private BigDecimal price = BigDecimal.ZERO;

@Column(precision = 12, scale = 2)
private BigDecimal originalPrice;   // giá gốc, có thể để trống

@Enumerated(EnumType.STRING)
private CourseStatus status = CourseStatus.DRAFT;
```

- Giá dùng `BigDecimal` / `DECIMAL(12,2)` chứ không dùng double, để không bị sai số khi tính tiền.
- Status lưu dạng chữ (`DRAFT`, `PUBLISHED`, `INACTIVE`) nhìn trong DB dễ hiểu hơn lưu số.

### Đi ngược lên

Entity `Course` được chuyển sang `CourseSummaryResponse` (chỉ giữ các trường cần cho thẻ khóa học), bọc trong `PageResponse`, Spring chuyển thành JSON:

```json
{ "content": [ ... ], "page": 0, "size": 12, "totalElements": 25, "totalPages": 3 }
```

Axios nhận về `res.data`, React lấy `content` để hiện danh sách và `totalPages` để làm phân trang.

Mình không trả thẳng Entity ra ngoài vì sẽ lộ những trường không muốn cho xem (vd `videoUrl` của bài học), với lại category là LAZY nên trả thẳng dễ bị lỗi.

## 2. Admin tạo khóa học

Admin bấm Lưu ở trang `/admin/courses/new` thì gọi `POST /api/courses`.

Trên form (`AdminCourseFormPage.jsx`), dữ liệu input đều là chuỗi nên phải đổi giá, danh mục, thời lượng sang số trước khi gửi:

```jsx
const payload = toPayload(form);
const created = await courseApi.createCourse(payload);
navigate(`/admin/lessons?courseId=${created.id}`, { ... });
```

Tạo xong thì chuyển luôn sang trang bài học để thêm bài. Nếu backend báo lỗi thì `parseApiError` tách lỗi theo từng ô để hiện ngay dưới ô đó.

Ở controller có 2 lớp kiểm tra:

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<CourseDetailResponse> create(@Valid @RequestBody CourseCreateRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(courseService.create(request));
}
```

- `@PreAuthorize`: không phải admin thì trả 403, chưa đăng nhập thì 401.
- `@Valid`: kiểm tra các annotation trong `CourseRequest` như `@NotBlank` cho tên, `@DecimalMin` cho giá...

Còn những điều kiện không ghi bằng annotation được thì kiểm tra trong service, ví dụ giá gốc không được nhỏ hơn giá bán, danh mục phải tồn tại:

```java
public CourseDetailResponse create(CourseCreateRequest request) {
    Course course = new Course();
    apply(course, request);
    course.setStatus(request.getStatus() != null ? request.getStatus() : CourseStatus.DRAFT);
    return toDetail(courseRepository.saveAndFlush(course));
}
```

Khóa học mới mặc định là `DRAFT`, admin phải chủ động chuyển sang `PUBLISHED` thì học viên mới thấy. `saveAndFlush` có sẵn trong `JpaRepository`, nó chạy câu INSERT, `created_at` thì `@CreationTimestamp` tự điền.

## 3. Khi có lỗi

Lỗi ở tầng nào thì cũng đi qua `GlobalExceptionHandler` (của TV1) nên frontend luôn nhận cùng một kiểu JSON:

```json
{ "status": 400, "message": "Validation error", "errors": { "originalPrice": "..." }, "timestamp": "..." }
```

- Sai dữ liệu (`@Valid` hoặc lỗi do service báo) → 400, có `errors` theo từng trường
- Không có quyền → 403
- Không tìm thấy hoặc khóa học đang ẩn → 404

Riêng lỗi 403 mình phải thêm handler cho `AccessDeniedException`, vì trước đó user thường gọi API admin lại bị trả về 500.
