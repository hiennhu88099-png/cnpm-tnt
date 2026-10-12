# ĐẶC TẢ YÊU CẦU & KẾ HOẠCH TRIỂN KHAI CHO TV3 — LEARNING SYSTEM & ADMIN

> **Dự án:** Hệ thống Quản lý và Bán Khóa học Online (`online-course`)  
> **Người nhận:** Thành viên 3 (TV3)  
> **Phạm vi phụ trách:** Quản lý Đăng ký (`enrollments`), Tiến độ học (`lesson_progress`), Đánh giá (`reviews`) & Trang Quản trị (Admin Users, Admin Enrollments, Admin Reviews, Dashboard)  
> **Git Branch:** `feature/learning-admin`

---

## 1. BỐI CẢNH & PHẠM VI DỰ ÁN

* **Công nghệ sử dụng:**
  * Backend: Java 21, Spring Boot, Maven
  * Database: MySQL 8.0 (chạy qua Docker Compose)
  * Frontend: React 19 + Vite + Axios
  * Security: Sử dụng Spring Security & JWT do TV1 đã xây dựng sẵn
* **Package Backend dùng chung:** `com.onlinecourse.backend`
* **Database dùng chung:** `online_course_db`
* **Quy tắc quan trọng:**
  * TV3 bắt đầu triển khai sau khi TV1 bàn giao nền tảng ổn định và TV2 đã merge các Entity nền tảng (`Course`, `Lesson`).
  * **Không** tự tạo lại `User`, `Role`, `SecurityConfig`, `JwtService` hay luồng Auth riêng. Dùng lại `User` và `UserRepository` của TV1.
  * Chỉ tập trung vào 3 bảng: `enrollments`, `lesson_progress`, `reviews` và các tính năng Admin liên quan.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

TV3 đối chiếu đúng 3 bảng sau. Không tự ý sửa schema hoặc thay đổi foreign key:

### 2.1. Bảng `enrollments`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã lượt đăng ký |
| `user_id` | BIGINT | NOT NULL, FK -> `users(id)` | Học viên đăng ký |
| `course_id` | BIGINT | NOT NULL, FK -> `courses(id)` | Khóa học được đăng ký |
| `enrolled_at`| DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời gian đăng ký |
| `status` | ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') | NOT NULL, DEFAULT 'ACTIVE' | Trạng thái đăng ký |

**Quy tắc nghiệp vụ:**
* **Chống đăng ký trùng:** Tạo ràng buộc UNIQUE trên cặp `(user_id, course_id)`. Một học viên không được đăng ký cùng một khóa học 2 lần.
* Chỉ cho phép đăng ký khóa học đang ở trạng thái `PUBLISHED`.
* Không nhận `user_id` từ client gửi lên; phải lấy `userId` từ token xác thực của người dùng đang đăng nhập (`jwt.getSubject()`).
* Học viên chỉ được xem danh sách đăng ký của chính mình; Admin xem được toàn bộ hệ thống.

---

### 2.2. Bảng `lesson_progress`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã tiến độ bài học |
| `enrollment_id`| BIGINT | NOT NULL, FK -> `enrollments(id)` | Khóa học đã đăng ký |
| `lesson_id` | BIGINT | NOT NULL, FK -> `lessons(id)` | Bài học cụ thể |
| `completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Trạng thái hoàn thành bài học |
| `completed_at`| DATETIME | NULL | Thời điểm hoàn thành |

**Quy tắc nghiệp vụ:**
* Ràng buộc UNIQUE trên cặp `(enrollment_id, lesson_id)`. Mỗi bài học chỉ có 1 bản ghi tiến độ trong một lượt đăng ký.
* **Xác thực tính toàn vẹn:** Bài học (`lesson_id`) phải thực sự thuộc khóa học (`course_id`) mà học viên đã đăng ký (`enrollment_id`). Tuyệt đối không cho phép đánh dấu hoàn thành bài học của khóa khác.
* Khi nhấn nút hoàn thành nhiều lần, không sinh thêm bản ghi mà chỉ giữ nguyên `completed = true`.
* **Công thức tính tiến độ khóa học:**
  $$\text{Tiến độ (\%)} = \frac{\text{Số bài học đã hoàn thành}}{\text{Tổng số bài học hợp lệ trong khóa}} \times 100$$
  *(Nếu khóa học chưa có bài học nào thì trả về 0%, tránh lỗi chia cho 0).*

---

### 2.3. Bảng `reviews`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã đánh giá |
| `user_id` | BIGINT | NOT NULL, FK -> `users(id)` | Người đánh giá |
| `course_id` | BIGINT | NOT NULL, FK -> `courses(id)` | Khóa học được đánh giá |
| `rating` | TINYINT | NOT NULL | Điểm đánh giá (từ 1 đến 5) |
| `comment` | TEXT | NULL | Nội dung nhận xét |
| `status` | ENUM('PENDING', 'APPROVED', 'HIDDEN') | NOT NULL, DEFAULT 'APPROVED' | Trạng thái kiểm duyệt |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo đánh giá |

**Quy tắc nghiệp vụ:**
* Ràng buộc UNIQUE trên `(user_id, course_id)`: Mỗi học viên chỉ được đánh giá 1 lần cho mỗi khóa học.
* Điểm `rating` bắt buộc nằm trong khoảng từ 1 đến 5.
* **Điều kiện tiên quyết:** Chỉ học viên đã đăng ký (`enrollments`) khóa học đó mới có quyền viết review.
* Học viên chỉ được chỉnh sửa hoặc xóa review của chính mình.
* Các review bị trạng thái `HIDDEN` sẽ không xuất hiện trong danh sách công khai.

---

## 3. DANH SÁCH REST API CẦN XÂY DỰNG

### 3.1. Enrollment API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/enrollments` | Đã đăng nhập | Đăng ký khóa học (`body: { courseId: 1 }`, user lấy từ JWT) |
| `GET` | `/api/enrollments/my-courses` | Đã đăng nhập | Xem danh sách các khóa học đã đăng ký của bản thân (kèm % tiến độ) |
| `GET` | `/api/enrollments/{id}` | Chủ sở hữu / ADMIN | Xem chi tiết thông tin đăng ký |
| `GET` | `/api/admin/enrollments` | Chỉ ADMIN | Quản lý danh sách đăng ký toàn hệ thống (phân trang, lọc theo khóa học) |

### 3.2. Learning & Progress API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/learning/courses/{courseId}/lessons` | Học viên đã đăng ký | Lấy danh sách bài học đầy đủ (bao gồm `video_url` và trạng thái `completed`) |
| `POST` | `/api/lessons/{lessonId}/complete` | Học viên đã đăng ký | Đánh dấu bài học đã hoàn thành |
| `GET` | `/api/courses/{courseId}/progress` | Học viên đã đăng ký / ADMIN | Lấy tổng quan tiến độ của học viên đối với khóa học |

### 3.3. Review API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Đã đăng ký khóa | Gửi đánh giá mới cho khóa học (`courseId`, `rating`, `comment`) |
| `GET` | `/api/courses/{courseId}/reviews` | Public | Xem danh sách đánh giá công khai của khóa học (phân trang) |
| `PUT` | `/api/reviews/{id}` | Tác giả review | Cập nhật đánh giá của mình |
| `DELETE` | `/api/reviews/{id}` | Tác giả / ADMIN | Xóa đánh giá |
| `GET` | `/api/admin/reviews` | Chỉ ADMIN | Danh sách toàn bộ đánh giá để kiểm duyệt |
| `PATCH` | `/api/admin/reviews/{id}/status` | Chỉ ADMIN | Thay đổi trạng thái kiểm duyệt (`APPROVED` / `HIDDEN`) |

### 3.4. Admin User & Dashboard API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | Chỉ ADMIN | Xem danh sách người dùng (phân trang, tìm kiếm email/tên, lọc role/status) |
| `PATCH` | `/api/admin/users/{id}/status` | Chỉ ADMIN | Khóa hoặc mở khóa tài khoản (`ACTIVE` / `BLOCKED`) |
| `GET` | `/api/admin/dashboard/summary` | Chỉ ADMIN | Thống kê tổng số: Users, Courses, Enrollments, Reviews |

> [!WARNING]
> * Tuyệt đối không trả về mật khẩu mã hóa (`password`) trong bất kỳ API Admin User nào.
> * Không cho phép chỉnh sửa role của Admin qua API status.

---

## 4. GIAO DIỆN FRONTEND (REACT)

Dùng chung hệ thống Design System đã có (tại `/ui-kit`) và `AuthContext`:

### 4.1. Dành cho Học viên
1. **Khóa học của tôi (`MyCoursesPage.jsx`):**
   * Hiển thị dạng thẻ khóa học dùng `<CourseCard />`, chân thẻ gắn thanh tiến độ `<ProgressBar value={course.progress} />`.
   * Nút "Tiếp tục học" dẫn thẳng vào bài học đang học dở.
2. **Giao diện phòng học (`LearningPage.jsx`):**
   * Bên trái: Trình phát video bài học (`video_url`) và nội dung bài học.
   * Bên phải: Danh sách các bài học với icon tích xanh nếu đã hoàn thành (`completed`).
   * Nút bấm "Hoàn thành bài học" (khi bấm gọi API và cập nhật tích xanh ngay trên UI).
3. **Phần Đánh giá Khóa học:**
   * Hiển thị điểm trung bình và danh sách nhận xét bằng `<StarRating />`.
   * Form viết đánh giá (chỉ hiện khi người dùng đã đăng ký khóa học).

### 4.2. Dành cho Quản trị viên (Admin)
1. **Admin Dashboard (`AdminDashboardPage.jsx`):**
   * 4 thẻ thống kê số liệu thật từ API: Tổng Người dùng, Tổng Khóa học, Tổng Lượt đăng ký, Tổng Đánh giá.
2. **Quản lý Người dùng (`AdminUserPage.jsx`):**
   * Danh sách người dùng, lọc theo trạng thái.
   * Nút chặn (`BLOCKED`) hoặc mở lại (`ACTIVE`) kèm modal xác nhận.
3. **Quản lý Đăng ký (`AdminEnrollmentPage.jsx`):**
   * Danh sách các lượt đăng ký, tìm kiếm theo email người học hoặc tên khóa học.
4. **Quản lý Đánh giá (`AdminReviewPage.jsx`):**
   * Xem và ẩn các đánh giá vi phạm quy chuẩn.

---

## 5. CHECKLIST KIỂM THỬ BẮT BUỘC

- [ ] **Enrollment:**
  - [ ] Đăng ký thành công khóa học hợp lệ.
  - [ ] Đăng ký trùng lặp bị từ chối với thông báo rõ ràng.
  - [ ] Không thể đăng ký khóa học đang ở trạng thái `DRAFT` hoặc `INACTIVE`.
- [ ] **Learning & Progress:**
  - [ ] Người chưa đăng ký gọi API lấy video bài giảng bị từ chối `403 Forbidden`.
  - [ ] Người đã đăng ký xem được video bài giảng.
  - [ ] Đánh dấu hoàn thành cập nhật đúng tiến độ % (0%, 50%, 100%).
  - [ ] Không thể đánh dấu bài học thuộc khóa học khác.
- [ ] **Review:**
  - [ ] Chỉ người đã đăng ký mới viết được review.
  - [ ] Rating < 1 hoặc > 5 bị từ chối validate.
  - [ ] Không thể sửa hoặc xóa review của người khác.
- [ ] **Admin:**
  - [ ] Tài khoản role `USER` gọi API `/api/admin/**` đều bị `403 Forbidden`.
  - [ ] Khóa tài khoản (`BLOCKED`) làm cho người đó không đăng nhập được nữa.
  - [ ] Dashboard trả về số liệu thực tế từ database.

---

## 6. QUY TRÌNH GIT VÀ NỘP BÀI

1. Checkout branch `main` mới nhất:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Tạo branch của TV3:
   ```bash
   git checkout -b feature/learning-admin
   ```
3. Sau khi TV2 đã merge Entity `Course` và `Lesson` vào `main`, TV3 pull `main` vào branch của mình và bắt đầu tạo các Entity `Enrollment`, `LessonProgress`, `Review`.
4. Viết Service, Controller và kiểm thử từng API bằng Postman/Test.
5. Ghép vào giao diện React.
6. Tạo Pull Request trên GitHub, tag TV1 và TV2 vào review.
