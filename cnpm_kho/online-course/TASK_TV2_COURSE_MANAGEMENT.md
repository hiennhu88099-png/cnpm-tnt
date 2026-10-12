# ĐẶC TẢ YÊU CẦU & KẾ HOẠCH TRIỂN KHAI CHO TV2 — COURSE MANAGEMENT FULLSTACK

> **Dự án:** Hệ thống Quản lý và Bán Khóa học Online (`online-course`)  
> **Người nhận:** Thành viên 2 (TV2)  
> **Phạm vi phụ trách:** Quản lý Danh mục (`categories`), Khóa học (`courses`) & Bài học (`lessons`)  
> **Git Branch:** `feature/course`

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
  * TV1 đã hoàn tất nền tảng: User, Register, Login, JWT, Spring Security, Profile, Change Password.
  * TV2 **không** tự tạo lại `User`, `Role`, `SecurityConfig` hay hệ thống lưu JWT riêng.
  * Chỉ tập trung vào 3 bảng: `categories`, `courses`, `lessons` và luồng nghiệp vụ liên quan.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

TV2 đối chiếu đúng 3 bảng sau. Không tự ý thêm bớt cột làm lệch ERD chung:

### 2.1. Bảng `categories`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã danh mục |
| `name` | VARCHAR(150) | NOT NULL, UNIQUE | Tên danh mục (không được trùng) |
| `description` | TEXT | NULL | Mô tả chi tiết danh mục |
| `image` | VARCHAR(500) | NULL | URL ảnh đại diện danh mục |
| `status` | ENUM('ACTIVE', 'INACTIVE') | NOT NULL, DEFAULT 'ACTIVE' | Trạng thái hoạt động |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày tạo |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Ngày cập nhật |

**Quy tắc nghiệp vụ:**
* Xem danh mục đang `ACTIVE` dành cho học viên; Admin xem được tất cả.
* Không cho phép tạo danh mục có tên trùng.
* **Không xóa cứng (hard delete)** danh mục khi đang có khóa học tham chiếu; chuyển trạng thái sang `INACTIVE` (soft delete / ngưng sử dụng).

---

### 2.2. Bảng `courses`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã khóa học |
| `category_id` | BIGINT | NOT NULL, FK -> `categories(id)` | Danh mục trực thuộc |
| `title` | VARCHAR(200) | NOT NULL | Tên khóa học |
| `description` | TEXT | NULL | Mô tả khóa học |
| `thumbnail` | VARCHAR(500) | NULL | Ảnh thumbnail |
| `price` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Học phí (>= 0) |
| `instructor_name`| VARCHAR(150) | NULL | Tên giảng viên |
| `level` | ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') | NOT NULL | Cấp độ học viên |
| `duration` | INT | NULL | Tổng thời lượng (tính bằng phút) |
| `status` | ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') | NOT NULL, DEFAULT 'DRAFT' | Trạng thái khóa học |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày tạo |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Ngày cập nhật |

**Quy tắc nghiệp vụ:**
* Giá không được âm (`price >= 0`).
* Kiểm tra `category_id` phải tồn tại trong DB khi tạo hoặc cập nhật.
* Danh sách khóa học công khai cho học viên: **chỉ hiển thị khóa học có `status = 'PUBLISHED'` và thuộc danh mục đang `ACTIVE`**.
* Không xóa cứng khóa học nếu đã có người đăng ký (`enrollments`) hoặc đánh giá (`reviews`). Dùng trạng thái `INACTIVE` để ẩn.

---

### 2.3. Bảng `lessons`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã bài học |
| `course_id` | BIGINT | NOT NULL, FK -> `courses(id)` | Khóa học trực thuộc |
| `title` | VARCHAR(200) | NOT NULL | Tiêu đề bài học |
| `description` | TEXT | NULL | Mô tả nội dung bài học |
| `video_url` | VARCHAR(500) | NULL | Đường dẫn video bài giảng |
| `duration` | INT | NULL | Thời lượng video (phút) |
| `lesson_order` | INT | NOT NULL | Thứ tự bài học trong khóa (1, 2, 3,...) |
| `status` | ENUM('ACTIVE', 'INACTIVE') | NOT NULL, DEFAULT 'ACTIVE' | Trạng thái bài học |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Ngày tạo |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Ngày cập nhật |

**Quy tắc nghiệp vụ:**
* Thứ tự bài học (`lesson_order`) phải > 0.
* Mỗi khóa học không được có 2 bài học trùng thứ tự `lesson_order` (nên tạo UNIQUE composite index trên `course_id, lesson_order`).
* **Bảo mật video:** API công khai xem danh sách bài học của khóa học chỉ trả về `id`, `title`, `description`, `duration`, `lesson_order`. **Tuyệt đối không để lộ `video_url`** qua API công khai (nội dung video bài học chỉ dành cho học viên đã đăng ký học, do TV3 quản lý).
* Không xóa cứng bài học nếu đã có dữ liệu tiến độ (`lesson_progress`).

---

## 3. DANH SÁCH REST API CẦN XÂY DỰNG

### 3.1. Category API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | Lấy danh sách danh mục đang `ACTIVE` |
| `GET` | `/api/categories/{id}` | Public | Lấy thông tin chi tiết một danh mục |
| `POST` | `/api/categories` | Chỉ ADMIN | Tạo danh mục mới |
| `PUT` | `/api/categories/{id}` | Chỉ ADMIN | Cập nhật thông tin danh mục |
| `DELETE` | `/api/categories/{id}` | Chỉ ADMIN | Ngừng sử dụng danh mục (kiểm tra an toàn) |

### 3.2. Course API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | Public | Danh sách khóa học (kèm Search, Filter, Pagination) |
| `GET` | `/api/courses/{id}` | Public | Chi tiết khóa học (bao gồm danh sách bài học tóm tắt) |
| `POST` | `/api/courses` | Chỉ ADMIN | Tạo khóa học mới |
| `PUT` | `/api/courses/{id}` | Chỉ ADMIN | Cập nhật thông tin khóa học |
| `DELETE` | `/api/courses/{id}` | Chỉ ADMIN | Ngừng xuất bản / ẩn khóa học |

**Yêu cầu Search, Filter & Pagination cho `/api/courses`:**
* Query Params:
  * `keyword`: tìm kiếm tương đối trong `title` (hoặc `description`)
  * `categoryId`: lọc theo danh mục
  * `page`: chỉ số trang (mặc định = 0)
  * `size`: số bản ghi mỗi trang (mặc định = 10 hoặc 12, giới hạn tối đa 50)
  * `sort`: sắp xếp (ví dụ: `createdAt,desc` hoặc `price,asc`)
* Ví dụ: `/api/courses?keyword=java&categoryId=1&page=0&size=10`
* Bắt buộc dùng Spring Data JPA `Pageable` và `Page<CourseResponse>`.

### 3.3. Lesson API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses/{courseId}/lessons` | Public | Danh sách bài học theo khóa học (ẩn `video_url`) |
| `POST` | `/api/courses/{courseId}/lessons` | Chỉ ADMIN | Thêm bài học mới vào khóa học |
| `PUT` | `/api/lessons/{id}` | Chỉ ADMIN | Sửa thông tin bài học |
| `DELETE` | `/api/lessons/{id}` | Chỉ ADMIN | Ẩn/xóa an toàn bài học |

---

## 4. CẤU TRÚC CODE BACKEND (JAVA SPRING BOOT)

Tuân thủ kiến trúc phân tầng chuẩn đã có trong dự án:

```
com.onlinecourse.backend/
├── entity/
│   ├── Category.java
│   ├── Course.java
│   └── Lesson.java
├── repository/
│   ├── CategoryRepository.java
│   ├── CourseRepository.java
│   └── LessonRepository.java
├── dto/
│   ├── request/
│   │   ├── CategoryRequest.java
│   │   ├── CourseCreateRequest.java
│   │   ├── CourseUpdateRequest.java
│   │   └── LessonRequest.java
│   └── response/
│       ├── CategoryResponse.java
│       ├── CourseSummaryResponse.java
│       ├── CourseDetailResponse.java
│       ├── LessonSummaryResponse.java
│       └── PageResponse.java (hoặc dùng Spring Page)
├── service/
│   ├── CategoryService.java
│   ├── CourseService.java
│   └── LessonService.java
└── controller/
    ├── CategoryController.java
    ├── CourseController.java
    └── LessonController.java
```

> [!TIP]
> * Luôn dùng `@Valid` trên Request DTO để kích hoạt Bean Validation (`@NotBlank`, `@NotNull`, `@Min`,...).
> * Không trả Entity trực tiếp ra Controller; luôn map sang Response DTO.
> * Các API dành cho Admin cần thêm `@PreAuthorize("hasRole('ADMIN')")` hoặc đặt URL dạng `/api/admin/...`.

---

## 5. GIAO DIỆN FRONTEND (REACT)

Tận dụng bộ Design System có sẵn tại [HANDOVER_GUIDE.md](HANDOVER_GUIDE.md) và trang `/ui-kit`:

### 5.1. Dành cho Học viên (Public)
1. **Trang Chủ (`HomePage.jsx`):** Hiển thị danh mục nổi bật và các khóa học mới nhất lấy từ API.
2. **Trang Danh Sách Khóa Học (`CourseListPage.jsx`):**
   * Thanh tìm kiếm từ khóa (Search).
   * Bộ lọc theo danh mục (Category filter).
   * Danh sách khóa học dạng lưới (`course-grid`), dùng `<CourseCard />`.
   * Phân trang (Pagination).
   * Trạng thái Loading (`<PageLoading />`), Empty (`<EmptyState />`), Lỗi (`<Alert />`).
3. **Trang Chi Tiết Khóa Học (`CourseDetailPage.jsx`):**
   * Header: Tiêu đề, Giảng viên, Đánh giá, Giá bán, Nút Đăng ký (kết nối với TV3).
   * Tab Giới thiệu và Tab Chương trình học (Danh sách bài học sắp xếp theo `lesson_order`).

### 5.2. Dành cho Quản trị viên (Admin)
1. **Quản lý Danh mục (`AdminCategoryPage.jsx`):**
   * Bảng danh sách danh mục.
   * Modal/Form thêm mới danh mục, sửa danh mục.
2. **Quản lý Khóa học (`AdminCoursePage.jsx`):**
   * Bảng danh sách khóa học (phân trang, lọc theo danh mục/trạng thái).
   * Form tạo mới khóa học: chọn Category, nhập tiêu đề, giá, mô tả, cấp độ,...
   * Form cập nhật khóa học.
3. **Quản lý Bài học (`AdminLessonPage.jsx`):**
   * Danh sách bài học theo từng khóa học.
   * Thêm/sửa bài học, nhập URL video, thời lượng, số thứ tự.

---

## 6. CHECKLIST KIỂM THỬ BẮT BUỘC

Trước khi gửi Pull Request, TV2 phải tự kiểm thử đạt các tiêu chí sau:

- [ ] **Category:**
  - [ ] Thêm danh mục thành công khi đúng dữ liệu.
  - [ ] Bị từ chối (400) khi tên danh mục bị trùng hoặc để trống.
  - [ ] Học viên thường gọi API thêm/sửa danh mục bị từ chối `403 Forbidden`.
- [ ] **Course:**
  - [ ] Tạo khóa học thành công với category hợp lệ.
  - [ ] Báo lỗi 404/400 nếu truyền `categoryId` không tồn tại.
  - [ ] Báo lỗi validation nếu `price < 0` hoặc tiêu đề trống.
  - [ ] Tìm kiếm (`keyword`) kết hợp bộ lọc (`categoryId`) và phân trang (`page`, `size`) chạy đúng.
  - [ ] Khóa học `DRAFT` không bao giờ xuất hiện ở trang danh sách công khai của học viên.
- [ ] **Lesson:**
  - [ ] Thêm bài học thành công vào khóa học.
  - [ ] Báo lỗi nếu trùng `lesson_order` trong cùng một khóa học.
  - [ ] API danh sách bài học công khai không để lộ `video_url`.
- [ ] **Frontend:**
  - [ ] Toàn bộ dữ liệu hiển thị từ API Backend (không hardcode).
  - [ ] Giao diện có đủ loading spinner, xử lý lỗi thân thiện.
  - [ ] Responsive trên mobile và desktop.

---

## 7. QUY TRÌNH GIT VÀ NỘP BÀI

1. Checkout branch `main` mới nhất:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Tạo branch tính năng của TV2:
   ```bash
   git checkout -b feature/course
   ```
3. **Mốc 1 (Cực kỳ quan trọng):** Tạo Entity (`Category`, `Course`, `Lesson`) và Repository trước, tạo Pull Request đầu tiên để merge sớm vào `main`. Nhờ đó TV3 có thể dùng chung Entity `Course` và `Lesson` mà không phải chờ TV2 làm xong toàn bộ Frontend.
4. **Mốc 2:** Hoàn thiện Service, Controller, REST API và kiểm thử Postman.
5. **Mốc 3:** Ghép API vào giao diện React.
6. Tạo Pull Request trên GitHub, tag TV1 vào review.
