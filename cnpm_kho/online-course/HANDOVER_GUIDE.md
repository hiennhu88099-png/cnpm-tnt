# TÀI LIỆU BÀN GIAO NỀN TẢNG VÀ HƯỚNG DẪN PHÁT TRIỂN (DÀNH CHO TV2 & TV3)
> **Dự án:** Hệ thống Quản lý và Bán Khóa học Online (`online-course`)  
> **Người biên soạn:** Thành viên 1 (Team Leader) – Phụ trách Nền tảng, Database & Authentication/Security

---

## 1. TỔNG QUAN HỆ THỐNG VÀ KIẾN TRÚC

### 1.1. Công nghệ sử dụng
* **Backend:** Java 21+, Spring Boot 4.x (Maven)
* **Database:** MySQL 8.0 (chạy qua Docker Compose)
* **Bảo mật:** Spring Security 6+ Stateless, JWT (HMAC-SHA256)
* **Frontend:** React 19 + Vite + React Router + Axios

### 1.2. Cách khởi động môi trường làm việc
1. **Khởi động Database MySQL:**
   ```bash
   cd online-course
   docker compose up -d
   ```
   * MySQL: `localhost:3306`, Database: `online_course_db`, User: `root`, Password: `course123`
   * Web quản trị Adminer: `http://localhost:8082` (Hệ thống: `MySQL`, Máy chủ: `mysql`, Tài khoản: `root`, Mật khẩu: `course123`, CSDL: `online_course_db`)

2. **Khởi động Backend:**
   * Mở thư mục `online-course/backend` bằng IntelliJ IDEA.
   * Chạy file `OnlineCourseBackendApplication.java`. Backend lắng nghe tại `http://localhost:8080`.

3. **Khởi động Frontend:**
   ```bash
   cd online-course/frontend
   npm install
   npm run dev
   ```
   * Frontend chạy tại: `http://localhost:5173`.

---

## 2. PHÂN CHIA NHIỆM VỤ TIẾP THEO

Project gồm **7 bảng** đã chốt. Team Leader đã hoàn thành nền tảng và bảng **1. users**.

| Thành viên | Trách nhiệm Module | Các bảng phụ trách |
| :--- | :--- | :--- |
| **TV1 (Leader)** | Nền tảng, Security, JWT, Quản lý tài khoản User, Frontend Auth | `users` *(ĐÃ HOÀN TẤT)* |
| **TV2** | **Quản lý Khóa học & Nội dung giảng dạy** | `categories`, `courses`, `lessons` |
| **TV3** | **Quản lý Đăng ký, Tiến độ học & Đánh giá** | `enrollments`, `lesson_progress`, `reviews` |

> [!WARNING]
> **Quy tắc quan trọng:** TV2 và TV3 **KHÔNG** chỉnh sửa logic của `User`, `SecurityConfig`, `JwtService`, `AuthController`, `UserService` để tránh gây xung đột Git và hỏng hệ thống bảo mật. Khi cần thông tin người dùng, hãy liên kết `@ManyToOne` đến `User` hoặc lấy `userId` từ JWT token.

---

## 3. QUY ƯỚC LẬP TRÌNH BACKEND (BẮT BUỘC TUÂN THỦ)

### 3.1. Cấu trúc thư mục theo Layer
```
com.onlinecourse.backend/
├── config/             # Cấu hình Spring (Security, CORS, JPA)
├── controller/         # REST Controllers nhận request, trả về ResponseEntity
├── dto/
│   ├── request/        # Các Class Request body (có validate @NotNull, @NotBlank,...)
│   └── response/       # Các Class Response trả về cho client (không trả thẳng Entity)
├── entity/             # JPA Entities (khai báo bảng database)
├── exception/          # Custom Exception và GlobalExceptionHandler
├── repository/         # Spring Data JPA Repositories
├── security/           # Logic xử lý JWT và phân quyền
└── service/            # Business Logic nghiệp vụ
```

### 3.2. Quy ước API RESTful & Mã phản hồi HTTP
* `GET /api/...`: Lấy dữ liệu $\rightarrow$ `200 OK`
* `POST /api/...`: Tạo mới $\rightarrow$ `201 Created`
* `PUT /api/...`: Cập nhật $\rightarrow$ `200 OK`
* `DELETE /api/...`: Xóa $\rightarrow$ `204 No Content`
* Dữ liệu không hợp lệ $\rightarrow$ `400 Bad Request` (tự động xử lý nếu dùng `@Valid` trên Request DTO)
* Chưa đăng nhập / Token sai $\rightarrow$ `401 Unauthorized`
* Không đủ quyền (ví dụ User thường gọi API của Admin) $\rightarrow$ `403 Forbidden`
* Không tìm thấy bản ghi $\rightarrow$ `404 Not Found` (dùng `ResourceNotFoundException`)

### 3.3. Định dạng lỗi đồng nhất (Error Response Format)
Hệ thống đã có `GlobalExceptionHandler`. Khi gặp lỗi, API sẽ trả về JSON chuẩn:
```json
{
  "status": 400,
  "message": "Validation error",
  "errors": {
    "title": "Title is required",
    "price": "Price must be greater than 0"
  },
  "timestamp": "2026-10-11T15:00:00"
}
```

---

## 4. HƯỚNG DẪN KỸ THUẬT QUAN TRỌNG

### 4.1. Cách lấy thông tin Người dùng hiện tại trong Controller
Khi client gửi request kèm Bearer Token, bạn có thể lấy `userId` trực tiếp trong Controller:

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateCourseRequest request) {

        // Lấy ID của user đang đăng nhập từ Subject của token:
        Long currentUserId = Long.valueOf(jwt.getSubject());

        // Truyền vào service để xử lý:
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.createCourse(currentUserId, request));
    }
}
```

### 4.2. Cách cấu hình Phân quyền (Public / User / Admin)
* Các API công khai (Public - ai cũng xem được, ví dụ xem danh sách khóa học):
  * Mở [SecurityConfig.java](file:///f:/Project/cnpm_kho/online-course/backend/src/main/java/com/onlinecourse/backend/config/SecurityConfig.java) và thêm vào danh sách permitAll:
    ```java
    .requestMatchers(HttpMethod.GET, "/api/courses/**", "/api/categories/**").permitAll()
    ```
* Các API chỉ dành riêng cho Quản trị viên (ADMIN):
  * Mặc định mọi URL bắt đầu bằng `/api/admin/**` đã được cấu hình yêu cầu role `ADMIN`:
    ```java
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    ```
  * Hoặc đặt trực tiếp trong Controller dành cho Admin: `@RequestMapping("/api/admin/courses")`.

### 4.3. Cách tạo Entity liên kết với bảng `users`
Khi tạo các Entity mới cần liên kết với người dùng (ví dụ: `Enrollment`, `Review`, `Course.instructor`):

```java
@Entity
@Table(name = "enrollments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại liên kết tới bảng users:
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime enrolledAt;
}
```

### 4.4. Cách kết nối API Backend vào Giao diện Frontend (React)
Frontend đã có sẵn một **bộ giao diện mẫu (design system)** — trang mới chỉ cần ghép các component có sẵn, **không tự viết màu / style riêng**.

* **Xem trực quan mọi component:** chạy frontend rồi mở `http://localhost:5173/ui-kit` (có kèm code mẫu copy được).
* **Cấu trúc:**
  ```
  frontend/src/
  ├── styles/tokens.css      # màu, cỡ chữ, bo góc, khoảng cách → luôn dùng var(--...)
  ├── styles/components.css  # style của component dùng chung
  ├── styles/layout.css      # header, footer, khung trang tài khoản, khung đăng nhập
  ├── styles/pages.css       # style riêng từng trang → thêm khối mới ở CUỐI file
  ├── components/ui/         # Button, Card, Alert, Badge, CourseCard, ProgressBar, StarRating,
  │                          # EmptyState, PageHeader, Avatar, Spinner/PageLoading, Icon
  ├── components/FormField.jsx  # ô nhập liệu (input / textarea / select) + hiển thị lỗi
  ├── config/site.js         # tên thương hiệu, menu header (MAIN_NAV), menu tài khoản (ACCOUNT_NAV)
  ├── data/mockData.js       # dữ liệu khóa học mẫu cho trang chủ (TV2 thay bằng API rồi xóa)
  └── utils/format.js        # formatPrice (399.000 ₫ / Miễn phí), formatDate, formatNumber
  ```
* **Khung một trang mới** (ví dụ trang danh sách khóa học của TV2):
  ```jsx
  import { useEffect, useState } from 'react';
  import { courseApi } from '../api/courseApi';
  import { parseApiError } from '../api/apiError';
  import { Alert, CourseCard, EmptyState, PageHeader, PageLoading } from '../components/ui';

  export default function CourseListPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      courseApi.getAllCourses()
        .then(setCourses)
        .catch((err) => setError(parseApiError(err).message))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <PageLoading />;

    return (
      <div className="container section">
        <PageHeader title="Tất cả khóa học" subtitle="Chọn khóa học phù hợp với bạn" />
        <Alert variant="error">{error}</Alert>
        {courses.length === 0 ? (
          <EmptyState title="Chưa có khóa học nào" />
        ) : (
          <div className="course-grid">
            {courses.map((c) => <CourseCard key={c.id} course={c} to={`/courses/${c.id}`} />)}
          </div>
        )}
      </div>
    );
  }
  ```
  Sau đó: thêm route trong `App.jsx` (đã có comment chỗ cho TV2/TV3) và thêm link vào `MAIN_NAV` trong `config/site.js`.
* **Gợi ý theo vai trò:**
  * **TV2:** `CourseCard` đọc các field `title, instructorName, categoryName, thumbnail, price, originalPrice, averageRating, reviewCount, lessonCount, level` → nên đặt tên field trong `CourseResponse` giống vậy để dùng thẳng. Form tạo/sửa khóa học dùng `FormField` + `form-row` + `form-actions`.
  * **TV3:** trang "Khóa học của tôi" dùng `<CourseCard course={c} footer={<ProgressBar value={c.progress} />} />`; đánh giá dùng `StarRating`. Muốn thêm mục vào trang Tài khoản: thêm route trong `<Route element={<AccountLayout />}>` và một dòng vào `ACCOUNT_NAV`.
* **Mẫu API Frontend:** Đã tạo sẵn file [frontend/src/api/courseApi.js](file:///f:/Project/cnpm_kho/online-course/frontend/src/api/courseApi.js) chứa các hàm `courseApi.getAllCourses()`, `courseApi.getCourseById()`, `enrollmentApi.enrollCourse()`,...
* **Token tự động:** Axios client tại `frontend/src/api/client.js` đã tự động chèn header `Authorization: Bearer <token>` vào mọi request khi người dùng đăng nhập. TV2 và TV3 chỉ cần gọi hàm API mà không cần lo xử lý token bằng tay!

---

## 5. CHECKLIST BẮT ĐẦU CHO TV2 VÀ TV3
1. [ ] Clone mã nguồn từ repository của nhóm về máy.
2. [ ] Khởi động Docker MySQL và IntelliJ chạy thử Backend để thấy console log `Started OnlineCourseBackendApplication`.
3. [ ] Chạy Frontend (`cd frontend` -> `npm install` -> `npm run dev`) để trải nghiệm luồng Đăng ký / Đăng nhập / Trang chủ tại `http://localhost:5173`, và xem bộ giao diện mẫu tại `http://localhost:5173/ui-kit`.
4. [ ] Tạo nhánh Git riêng (ví dụ: `feature/course-management` cho TV2, `feature/enrollment-review` cho TV3).
5. [ ] Tạo Entity và DTO theo đúng quy ước layer nêu trên.
6. [ ] Tạo Pull Request để Team Leader review trước khi merge vào nhánh chính `main`.
