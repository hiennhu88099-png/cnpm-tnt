# TASK TV3 — LEARNING SYSTEM + PROGRESS + REVIEW + ADMIN

> **Dự án:** Hệ thống Quản lý và Bán Khóa học Online (`online-course`)  
> **Người nhận:** Thành viên 3 (TV3)  
> **Phạm vi phụ trách:** Quản lý Đăng ký (`enrollments`), Tiến độ học (`lesson_progress`), Đánh giá (`reviews`) & Trang Quản trị Hệ thống (Admin Users, Admin Enrollments, Admin Reviews, Dashboard)  
> **Git Branch:** `feature/learning-admin`  
> **Người giao việc / Nhóm trưởng:** TV1

---

## A. BỐI CẢNH DỰ ÁN

* **Project:** Website bán / quản lý khóa học online.
* **Công nghệ sử dụng:**
  * **Frontend:** React 19 + Vite + Axios + React Router
  * **Backend:** Java 21, Spring Boot 4.x
  * **Database:** MySQL 8.0 chạy bằng Docker Compose
  * **API:** RESTful API chuẩn JSON
  * **Security & Auth:** Spring Security Stateless + JWT do TV1 xây dựng
  * **Quản lý mã nguồn:** Git & GitHub
* **Package Backend dùng chung:** `com.onlinecourse.backend`
* **Database dùng chung:** `online_course_db`
* **Thời điểm triển khai:**
  * TV3 bắt đầu triển khai sau khi TV1 bàn giao nền tảng ổn định (User, Register/Login, SecurityConfig, JWT, Profile).
  * TV3 phối hợp với TV2: sau khi TV2 merge Pull Request đầu tiên chứa Entity `Course` và `Lesson` vào `main`, TV3 pull về để sử dụng làm khóa ngoại cho `enrollments`, `lesson_progress`, `reviews`.
  * **Quy tắc quan trọng:** TV3 không tạo lại Entity `User`, `Role`, `SecurityConfig`, `JwtService` hay luồng Auth riêng. Dùng lại `User` và `UserRepository` của TV1. Không tạo bảng `Course`/`Lesson` mới mà dùng Entity của TV2.

---

## B. PHẠM VI PHỤ TRÁCH

### 1. Ba bảng dữ liệu chính
1. `enrollments` (Lượt đăng ký khóa học)
2. `lesson_progress` (Tiến độ học từng bài học)
3. `reviews` (Đánh giá và nhận xét khóa học)

### 2. Giao diện Người dùng (Học viên)
* **Khóa học của tôi (`MyCoursesPage.jsx`):** Danh sách các khóa đã đăng ký kèm thanh tiến độ `%`.
* **Phòng học trực tuyến (`LearningPage.jsx`):**
  * Video Player bài học (`video_url`).
  * Danh sách bài học kèm tích xanh hoàn thành (`completed`).
  * Nút "Đánh dấu hoàn thành" gọi API cập nhật tiến độ tức thì.
* **Đánh giá khóa học:** Form gửi đánh giá và danh sách nhận xét công khai.

### 3. Giao diện Quản trị (Admin)
Được bảo vệ bởi `<AdminRoute>`:
* **Admin Dashboard (`AdminDashboardPage.jsx`):** 4 thẻ thống kê số liệu thật: Total Users, Total Courses, Total Enrollments, Total Reviews.
* **Admin Users (`AdminUserPage.jsx`):** Danh sách người dùng, tìm kiếm, lọc trạng thái, khóa/mở khóa tài khoản (`ACTIVE` / `BLOCKED`).
* **Admin Enrollments (`AdminEnrollmentPage.jsx`):** Quản lý danh sách đăng ký toàn hệ thống.
* **Admin Reviews (`AdminReviewPage.jsx`):** Kiểm duyệt và ẩn đánh giá không phù hợp (`APPROVED` / `HIDDEN`).

---

## C. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Trước khi code Entity, đối chiếu đúng cấu trúc schema và ràng buộc toàn vẹn dưới đây:

```
users       1 ───── N enrollments 1 ───── N lesson_progress
courses     1 ───── N enrollments
lessons     1 ─────────────────────────── N lesson_progress

users       1 ───── N reviews
courses     1 ───── N reviews
```

### 1. Bảng `enrollments`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã lượt đăng ký |
| `user_id` | BIGINT | NOT NULL, FK -> `users(id)` | Học viên đăng ký |
| `course_id` | BIGINT | NOT NULL, FK -> `courses(id)` | Khóa học được đăng ký |
| `enrolled_at`| DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời gian đăng ký |
| `status` | ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') | NOT NULL, DEFAULT 'ACTIVE' | Trạng thái đăng ký |

**Quy tắc nghiệp vụ:**
* **Chống đăng ký trùng:** Bắt buộc tạo ràng buộc UNIQUE trên cặp `(user_id, course_id)`. Một user không được đăng ký cùng 1 khóa học 2 lần.
* Chỉ cho phép đăng ký khóa học đang ở trạng thái `PUBLISHED` và danh mục `ACTIVE`.
* Không nhận `user_id` từ client gửi lên; **bắt buộc lấy `userId` từ token xác thực JWT** (`jwt.getSubject()`).
* Học viên chỉ được xem danh sách đăng ký của chính mình; Admin xem được danh sách của toàn hệ thống.

---

### 2. Bảng `lesson_progress`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã tiến độ bài học |
| `enrollment_id`| BIGINT | NOT NULL, FK -> `enrollments(id)` | Khóa học đã đăng ký |
| `lesson_id` | BIGINT | NOT NULL, FK -> `lessons(id)` | Bài học cụ thể |
| `completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Trạng thái hoàn thành bài học |
| `completed_at`| DATETIME | NULL | Thời điểm hoàn thành |

**Quy tắc nghiệp vụ:**
* Ràng buộc UNIQUE trên cặp `(enrollment_id, lesson_id)`. Mỗi bài học chỉ có 1 bản ghi tiến độ trong một lượt đăng ký.
* **Xác thực tính toàn vẹn khóa ngoại:** Bài học (`lesson_id`) phải thực sự thuộc về khóa học (`course_id`) mà học viên đã đăng ký (`enrollment_id`). Tuyệt đối không cho phép đánh dấu hoàn thành bài học của khóa học khác.
* Khi nhấn nút hoàn thành nhiều lần, không sinh thêm bản ghi mà chỉ giữ nguyên `completed = true`.
* **Công thức tính tiến độ khóa học:**
  $$\text{Tiến độ (\%)} = \frac{\text{Số bài học đã hoàn thành}}{\text{Tổng số bài học hợp lệ trong khóa}} \times 100$$
  *(Nếu khóa học chưa có bài học nào thì trả về 0%, tránh lỗi chia cho 0).*

---

### 3. Bảng `reviews`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã đánh giá |
| `user_id` | BIGINT | NOT NULL, FK -> `users(id)` | Người đánh giá |
| `course_id` | BIGINT | NOT NULL, FK -> `courses(id)` | Khóa học được đánh giá |
| `rating` | TINYINT | NOT NULL | Điểm đánh giá (từ 1 đến 5 sao) |
| `comment` | TEXT | NULL | Nội dung nhận xét |
| `status` | ENUM('PENDING', 'APPROVED', 'HIDDEN') | NOT NULL, DEFAULT 'APPROVED' | Trạng thái kiểm duyệt |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo đánh giá |

**Quy tắc nghiệp vụ:**
* Ràng buộc UNIQUE trên `(user_id, course_id)`: Mỗi học viên chỉ được đánh giá 1 lần cho mỗi khóa học.
* Điểm `rating` bắt buộc từ 1 đến 5 (`@Min(1) @Max(5)`).
* **Điều kiện tiên quyết:** Chỉ học viên đã đăng ký (`enrollments`) khóa học đó mới được quyền viết review. Nếu chưa đăng ký, từ chối với lỗi 403 / 400.
* Học viên chỉ được chỉnh sửa hoặc xóa review của chính mình; Admin có quyền xóa hoặc thay đổi status kiểm duyệt.
* Các review bị trạng thái `HIDDEN` sẽ không xuất hiện trong danh sách công khai.

---

## D. ENROLLMENT API

### 1. Đăng ký khóa học
* **Endpoint:** `POST /api/enrollments`
* **Quyền hạn:** Người dùng đã đăng nhập (lấy `userId` từ JWT `jwt.getSubject()`)
* **Request Body:**
  ```json
  {
    "courseId": 1
  }
  ```
* **Quy trình xử lý tại Backend:**
  1. Xác định `userId` từ token xác thực.
  2. Kiểm tra `Course` tồn tại và có `status = 'PUBLISHED'`.
  3. Kiểm tra xem người dùng đã đăng ký khóa học này chưa (`existsByUserIdAndCourseId`). Nếu đã đăng ký, trả lỗi 400/409 rõ ràng: *"User already enrolled in this course"*.
  4. Tạo bản ghi `Enrollment` mới với `status = 'ACTIVE'`.
  5. Trả về `201 Created` kèm thông tin đăng ký.

### 2. Danh sách khóa học đã đăng ký của tôi (My Courses)
* **Endpoint:** `GET /api/enrollments/my-courses`
* **Quyền hạn:** Người dùng đã đăng nhập
* **Response:** Danh sách các khóa học đã đăng ký, bao gồm:
  * `id` (mã enrollment)
  * `courseId`, `title`, `thumbnail`, `instructorName`, `level`
  * `enrolledAt`, `status`
  * `progress`: tỷ lệ hoàn thành (tính theo %, từ 0 đến 100)

### 3. Chi tiết một lượt đăng ký
* **Endpoint:** `GET /api/enrollments/{id}`
* **Quyền hạn:** Chỉ chủ sở hữu lượt đăng ký hoặc ADMIN

### 4. Quản lý Đăng ký dành cho Admin
* **Endpoint:** `GET /api/admin/enrollments?page=0&size=10`
* **Quyền hạn:** Chỉ ADMIN
* **Mô tả:** Xem toàn bộ danh sách đăng ký trong hệ thống (hỗ trợ phân trang, lọc theo course/user nếu có).

---

## E. LEARNING & PROGRESS API

### 1. Lấy danh sách bài học để học (kèm Video URL)
* **Endpoint:** `GET /api/learning/courses/{courseId}/lessons`
* **Quyền hạn:** Học viên đã đăng ký khóa học đó (hoặc ADMIN)
* **Logic:**
  1. Lấy `userId` từ JWT.
  2. Kiểm tra xem `userId` có `Enrollment` đang hoạt động với `courseId` không. Nếu không, trả `403 Forbidden`.
  3. Lấy danh sách bài học của khóa học từ `LessonRepository`, kèm theo trạng thái `completed` (true/false) lấy từ bảng `lesson_progress`.
  4. Trả về đầy đủ `video_url` cho học viên học.

### 2. Đánh dấu bài học đã hoàn thành
* **Endpoint:** `POST /api/lessons/{lessonId}/complete`
* **Quyền hạn:** Học viên đã đăng ký khóa học chứa bài học đó
* **Logic:**
  1. Xác định `userId` từ JWT.
  2. Tìm bài học theo `lessonId`.
  3. Tìm `Enrollment` của user đối với khóa học chứa bài học đó. Nếu không tìm thấy, từ chối `403 Forbidden`.
  4. Tìm hoặc tạo mới bản ghi `lesson_progress` với `completed = true`, `completedAt = now()`. Nếu đã hoàn thành trước đó, giữ nguyên.
  5. Tính toán lại phần trăm tiến độ của khóa học và trả về kết quả.

### 3. Lấy tổng quan tiến độ của khóa học
* **Endpoint:** `GET /api/courses/{courseId}/progress`
* **Quyền hạn:** Học viên sở hữu lượt đăng ký hoặc ADMIN
* **Response:**
  ```json
  {
    "courseId": 1,
    "totalLessons": 10,
    "completedLessons": 6,
    "progressPercentage": 60.0
  }
  ```

---

## F. REVIEW API

### 1. Gửi đánh giá mới cho khóa học
* **Endpoint:** `POST /api/reviews`
* **Quyền hạn:** Học viên đã đăng ký khóa học
* **Request Body:**
  ```json
  {
    "courseId": 1,
    "rating": 5,
    "comment": "Khóa học rất chi tiết và dễ hiểu!"
  }
  ```
* **Logic:**
  1. Lấy `userId` từ JWT.
  2. Kiểm tra user đã đăng ký khóa học (`enrollments`) chưa. Nếu chưa $\rightarrow$ từ chối `403 Forbidden`.
  3. Kiểm tra user đã review khóa học này chưa $\rightarrow$ từ chối nếu trùng lặp.
  4. Validate `rating` từ 1 đến 5.
  5. Lưu review mới với `status = 'APPROVED'`.

### 2. Xem danh sách đánh giá công khai
* **Endpoint:** `GET /api/courses/{courseId}/reviews?page=0&size=10`
* **Quyền hạn:** Public (ai cũng xem được)
* **Mô tả:** Trả về danh sách review có `status = 'APPROVED'`, kèm thông tin tên người đánh giá, avatar, số sao, nội dung và ngày tạo.

### 3. Sửa và Xóa đánh giá
* `PUT /api/reviews/{id}`: Tác giả cập nhật nhận xét và số sao của mình.
* `DELETE /api/reviews/{id}`: Tác giả hoặc ADMIN xóa đánh giá.

### 4. Admin kiểm duyệt đánh giá
* `GET /api/admin/reviews?page=0&size=10`: Danh sách toàn bộ đánh giá trong hệ thống.
* `PATCH /api/admin/reviews/{id}/status`: Đổi trạng thái (`APPROVED` / `HIDDEN`). Body: `{"status": "HIDDEN"}`.

---

## G. ADMIN USER MANAGEMENT & DASHBOARD

### 1. Quản lý Người dùng (Admin Users)
TV3 tận dụng Entity `User`, enum `UserStatus` và `UserRepository` do TV1 xây dựng sẵn:
* **Tổ chức code:** TV3 tạo riêng `AdminUserController.java` (đặt tại `/api/admin/users`) và `AdminUserService.java`, inject `UserRepository` để xử lý. **Không sửa đổi `UserService.java` hay `UserController.java` của TV1.**
* **API:**
  * `GET /api/admin/users?page=0&size=10`: Xem danh sách người dùng (hỗ trợ phân trang, lọc theo role hoặc status, tìm kiếm theo email/fullName).
  * `PATCH /api/admin/users/{id}/status`: Khóa hoặc mở khóa tài khoản người dùng (`ACTIVE` / `BLOCKED`).
* **Lưu ý bảo mật:**
  * Tuyệt đối không trả mật khẩu mã hóa (`password`) trong bất kỳ response nào. Dùng `UserResponse`.
  * Không cho phép đổi role của user qua API status.
  * *Cơ chế chặn:* TV1 đã cài sẵn `ActiveUserTokenValidator`. Khi tài khoản chuyển sang `BLOCKED`, mọi request kèm token của tài khoản đó sẽ lập tức bị từ chối `401/403` ngay trong lần gọi tiếp theo!

### 2. Admin Dashboard Summary
* **Endpoint:** `GET /api/admin/dashboard/summary`
* **Quyền hạn:** Chỉ ADMIN
* **Response:**
  ```json
  {
    "totalUsers": 128,
    "totalCourses": 15,
    "totalEnrollments": 342,
    "totalReviews": 89
  }
  ```
* Số liệu lấy thực tế từ database (`count()` trên các Repository), không hard-code.

---

## H. GIAO DIỆN FRONTEND (REACT)

Dùng chung hệ thống Design System (`/ui-kit`), `AuthContext` và các hàm gọi API có sẵn trong `frontend/src/api/courseApi.js` (`enrollmentApi`, `adminApi`):

### 1. Dành cho Học viên
1. **Khóa học của tôi (`MyCoursesPage.jsx` - `/my-courses`):**
   * Đặt trong `<ProtectedRoute>`.
   * Hiển thị dạng lưới thẻ `<CourseCard />`, ở chân thẻ gắn thanh tiến độ `<ProgressBar value={course.progress} />`.
   * Nút "Tiếp tục học" dẫn thẳng tới trang học `/learning/${course.courseId}`.
2. **Giao diện phòng học trực tuyến (`LearningPage.jsx` - `/learning/:courseId`):**
   * Cột bên trái: Trình phát video bài học (`video_url`) và nội dung chi tiết bài học.
   * Cột bên phải: Danh sách các bài học với icon tích xanh nếu đã hoàn thành (`completed`).
   * Nút bấm "Đánh dấu hoàn thành" gọi API `completeLesson`, cập nhật thanh tiến độ và tích xanh ngay lập tức.
3. **Đánh giá khóa học:**
   * Hiển thị điểm trung bình và danh sách nhận xét bằng `<StarRating />`.
   * Form viết đánh giá: chỉ hiển thị khi người dùng đã đăng ký khóa học và chưa từng đánh giá.

### 2. Dành cho Quản trị viên (Admin)
Được bọc trong `<AdminRoute>` (chỉ người có `role === 'ADMIN'` mới truy cập được):
1. **Admin Dashboard (`AdminDashboardPage.jsx` - `/admin`):**
   * 4 thẻ thống kê số liệu thật từ API `adminApi.getDashboardSummary()`.
2. **Admin Users (`AdminUserPage.jsx` - `/admin/users`):**
   * Bảng danh sách người dùng, lọc trạng thái `ACTIVE` / `BLOCKED`.
   * Nút Chặn (`BLOCKED`) / Mở khóa (`ACTIVE`) kèm modal xác nhận.
3. **Admin Enrollments (`AdminEnrollmentPage.jsx` - `/admin/enrollments`):**
   * Bảng danh sách đăng ký toàn hệ thống.
4. **Admin Reviews (`AdminReviewPage.jsx` - `/admin/reviews`):**
   * Xem và ẩn các đánh giá vi phạm quy chuẩn.

---

## I. CHECKLIST KIỂM THỬ BẮT BUỘC

Trước khi tạo Pull Request, TV3 phải tự kiểm thử đạt tất cả các tiêu chí sau:

- [ ] **Enrollment:**
  - [ ] Đăng ký thành công khóa học hợp lệ.
  - [ ] Đăng ký trùng lặp bị từ chối với thông báo lỗi rõ ràng.
  - [ ] Không thể đăng ký khóa học đang ở trạng thái `DRAFT` hoặc `INACTIVE`.
  - [ ] Học viên chỉ xem được danh sách khóa học của chính mình.
- [ ] **Learning & Progress:**
  - [ ] Người chưa đăng ký gọi API `/api/learning/...` bị từ chối `403 Forbidden`.
  - [ ] Người đã đăng ký xem được đầy đủ danh sách bài học có `video_url`.
  - [ ] Đánh dấu hoàn thành cập nhật đúng tiến độ % (0%, 50%, 100%).
  - [ ] Không thể đánh dấu hoàn thành bài học thuộc khóa học khác.
  - [ ] Bấm nút hoàn thành nhiều lần không sinh ra dữ liệu trùng.
- [ ] **Review:**
  - [ ] Chỉ học viên đã đăng ký mới viết được review.
  - [ ] Người chưa đăng ký gửi review bị từ chối `403 Forbidden`.
  - [ ] Rating < 1 hoặc > 5 bị từ chối validate.
  - [ ] Một học viên không thể gửi 2 review cho cùng 1 khóa học.
  - [ ] Không thể sửa hoặc xóa review của người khác.
  - [ ] Review có trạng thái `HIDDEN` không xuất hiện trong danh sách công khai.
- [ ] **Admin:**
  - [ ] Tài khoản role `USER` truy cập các API `/api/admin/**` đều bị `403 Forbidden`.
  - [ ] Tài khoản role `USER` truy cập các trang React Admin trên trình duyệt bị `AdminRoute` chuyển hướng về trang chủ.
  - [ ] Khóa tài khoản (`BLOCKED`) làm cho người đó bị vô hiệu hóa token ngay lập tức và không thể đăng nhập lại.
  - [ ] Dashboard trả về số liệu thực tế từ database.
- [ ] **Frontend:**
  - [ ] Giao diện gọi API thật qua Axios (không dùng mock data cứng).
  - [ ] Hiển thị đầy đủ loading spinner, thông báo lỗi và danh sách rỗng.
  - [ ] Responsive trên mobile và desktop.

---

## K. QUY TRÌNH GIT VÀ BÀN GIAO

* **Branch làm việc:** `feature/learning-admin` (tuyệt đối **không push thẳng vào `main`**).
* **Quy trình:**
  1. Pull phiên bản `main` mới nhất sau khi TV1 đã merge nền tảng và TV2 đã merge Entity `Course`/`Lesson`:
     ```bash
     git checkout main
     git pull origin main
     ```
  2. Tạo branch tính năng của TV3:
     ```bash
     git checkout -b feature/learning-admin
     ```
  3. Tạo các Entity `Enrollment`, `LessonProgress`, `Review` và các Repository liên quan.
  4. Viết Service, Controller, REST API và kiểm thử từng chức năng bằng Postman.
  5. Ghép API vào giao diện React (My Courses, Learning Page, Admin Pages).
  6. Push branch lên GitHub và tạo Pull Request tag TV1 và TV2 vào review chéo.
* **Sản phẩm bàn giao:**
  * Toàn bộ mã nguồn Backend và Frontend của module.
  * Danh sách API và kết quả kiểm thử Postman.
  * TV3 phải giải thích được trọn vẹn nghiệp vụ: vì sao cần kiểm tra danh tính từ JWT, unique constraint chống trùng lặp, logic kiểm tra toàn vẹn bài học thuộc khóa học, và cơ chế bảo vệ phân quyền Admin.
