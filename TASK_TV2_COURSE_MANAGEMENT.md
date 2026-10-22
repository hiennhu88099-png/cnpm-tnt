# TASK TV2 — COURSE MANAGEMENT FULLSTACK

> **Dự án:** Hệ thống Quản lý và Bán Khóa học Online (`online-course`)  
> **Người nhận:** Thành viên 2 (TV2)  
> **Phạm vi phụ trách:** Quản lý Danh mục (`categories`), Khóa học (`courses`) & Bài học (`lessons`)  
> **Git Branch:** `feature/course`  
> **Người giao việc / Nhóm trưởng:** TV1

---

## A. BỐI CẢNH DỰ ÁN

* **Project:** Website quản lý / bán khóa học online.
* **Công nghệ sử dụng:**
  * **Frontend:** React 19 + Vite + Axios + React Router
  * **Backend:** Java 21, Spring Boot 4.x
  * **Database:** MySQL 8.0 chạy bằng Docker Compose
  * **IDE:** IntelliJ IDEA
  * **Build Tool:** Maven
  * **API:** RESTful API chuẩn JSON
  * **Quản lý mã nguồn:** Git & GitHub
* **Package Backend dùng chung:** `com.onlinecourse.backend`
* **Database dùng chung:** `online_course_db`
* **Phân định trách nhiệm:**
  * TV1 đã xây dựng và kiểm thử hoàn chỉnh nền tảng: Database chung, User, Authentication (Register, Login, BCrypt), JWT Stateless Token, Spring Security, phân quyền `USER`/`ADMIN`, Profile, Đổi mật khẩu, và bộ giao diện mẫu Design System (`/ui-kit`).
  * TV2 chịu trách nhiệm toàn bộ luồng nghiệp vụ **Course Management** từ Database, Spring Boot cho tới React.
  * TV2 **không** tự tạo lại `User`, `Role`, `SecurityConfig`, `JwtService` hay hệ thống lưu JWT riêng.

---

## B. PHẠM VI PHỤ TRÁCH

Ba bảng dữ liệu chính:
1. `categories` (Danh mục khóa học)
2. `courses` (Khóa học)
3. `lessons` (Bài học)

Phụ trách toàn bộ:
* Entity / Repository / Service / Controller
* CRUD nghiệp vụ
* Validation dữ liệu đầu vào (`@Valid`, Bean Validation)
* Search (từ khóa), Filter (danh mục), Pagination (phân trang JPA)
* Giao diện Frontend React (Danh sách khóa học, Chi tiết khóa học, Trang chủ)
* Giao diện Quản trị Admin: Category / Course / Lesson Management
* Kiểm thử bắt buộc (API bằng Postman/Test và giao diện React)

> [!WARNING]
> Không triển khai Enrollment, Lesson Progress, Review, Login/JWT hoặc tự tạo một SecurityConfig riêng. Những phần này thuộc trách nhiệm của TV1 và TV3.

---

## C. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Trước khi tạo Entity, đối chiếu đúng cấu trúc database dưới đây. Nếu có khác biệt, phải báo TV1 để thống nhất, không tự ý sửa schema làm lệch ERD chung:

```
categories  1 ───── N courses 1 ───── N lessons
```

### 1. Bảng `categories`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã danh mục |
| `name` | VARCHAR(150) | NOT NULL, UNIQUE | Tên danh mục (không trùng lặp) |
| `description` | TEXT | NULL | Mô tả chi tiết danh mục |
| `image` | VARCHAR(500) | NULL | URL ảnh/icon đại diện danh mục |
| `status` | ENUM('ACTIVE', 'INACTIVE') | NOT NULL, DEFAULT 'ACTIVE' | Trạng thái hoạt động |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Thời gian cập nhật |

**Quy tắc nghiệp vụ:**
* Xem danh mục đang hoạt động (`ACTIVE`) dành cho học viên; Admin xem được tất cả.
* Không cho phép tạo danh mục có tên trùng lặp (trả về lỗi 400).
* **Không xóa vật lý (hard delete)** danh mục đang được khóa học tham chiếu. Khi muốn xóa, chuyển trạng thái sang `INACTIVE` (soft delete / ngưng sử dụng).

---

### 2. Bảng `courses`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã khóa học |
| `category_id` | BIGINT | NOT NULL, FK -> `categories(id)` | Danh mục trực thuộc |
| `title` | VARCHAR(200) | NOT NULL | Tiêu đề khóa học |
| `description` | TEXT | NULL | Mô tả chi tiết nội dung |
| `thumbnail` | VARCHAR(500) | NULL | Link ảnh thumbnail |
| `price` | DECIMAL(12,2) | NOT NULL, DEFAULT 0 | Giá bán thực tế (>= 0) |
| `original_price`| DECIMAL(12,2) | NULL | Giá gốc gạch ngang (dùng hiển thị khuyến mãi trên `CourseCard`) |
| `instructor_name`| VARCHAR(150)| NULL | Tên giảng viên (nhập text) |
| `level` | ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') | NOT NULL | Cấp độ học viên |
| `duration` | INT | NULL | Tổng thời lượng (phút) |
| `status` | ENUM('DRAFT', 'PUBLISHED', 'INACTIVE') | NOT NULL, DEFAULT 'DRAFT' | Trạng thái khóa học |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Thời gian cập nhật |

**Quy tắc nghiệp vụ:**
* Tạo, xem, cập nhật khóa học.
* Bắt buộc kiểm tra `category_id` tồn tại trong database khi tạo hoặc cập nhật khóa học.
* Giá không được âm (`price >= 0`). Tiêu đề bắt buộc (`@NotBlank`).
* **Hiển thị công khai:** Danh sách công khai cho học viên **chỉ trả khóa học có `status = 'PUBLISHED'` và thuộc danh mục đang `ACTIVE`**. Các khóa học `DRAFT` hoặc `INACTIVE` chỉ Admin mới thấy.
* Không xóa vật lý khóa học đang có `enrollments` hoặc `reviews` tham chiếu. Dùng trạng thái `INACTIVE` để ẩn/ngừng xuất bản.
* *Lưu ý về Role Giảng viên:* Hệ thống chỉ có Role `USER` và `ADMIN`. `instructor_name` là chuỗi text do Admin nhập khi tạo khóa học, không cần quan hệ bảng `users`.

---

### 3. Bảng `lessons`
| Tên cột | Kiểu dữ liệu | Ràng buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, AUTO_INCREMENT | Mã bài học |
| `course_id` | BIGINT | NOT NULL, FK -> `courses(id)` | Khóa học trực thuộc |
| `title` | VARCHAR(200) | NOT NULL | Tiêu đề bài học |
| `description` | TEXT | NULL | Mô tả nội dung bài học |
| `video_url` | VARCHAR(500) | NULL | Đường dẫn video bài giảng |
| `duration` | INT | NULL | Thời lượng video (phút) |
| `lesson_order` | INT | NOT NULL | Số thứ tự bài học trong khóa |
| `status` | ENUM('ACTIVE', 'INACTIVE') | NOT NULL, DEFAULT 'ACTIVE' | Trạng thái bài học |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Thời gian tạo |
| `updated_at` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Thời gian cập nhật |

**Quy tắc nghiệp vụ:**
* Tạo bài học thuộc một khóa học hợp lệ. Kiểm tra `course_id` phải tồn tại.
* Thứ tự bài học (`lesson_order`) phải > 0.
* Mỗi khóa học không được có 2 bài học cùng số thứ tự `lesson_order` (tạo UNIQUE composite constraint trên `(course_id, lesson_order)`).
* Danh sách bài học sắp xếp tăng dần theo `lesson_order`.
* **Bảo mật video bài học:** API công khai xem danh sách bài học của khóa học (`GET /api/courses/{courseId}/lessons`) chỉ trả về `id`, `title`, `description`, `duration`, `lesson_order`. **Tuyệt đối không để lộ `video_url`** qua API công khai. URL video chỉ dành riêng cho học viên đã đăng ký (do TV3 quản lý qua `/api/learning/...`).
* Không xóa vật lý bài học đã có dữ liệu tiến độ (`lesson_progress`) tham chiếu.

---

## D. DANH SÁCH REST API CẦN XÂY DỰNG

TV1 đã mở sẵn quyền trong `SecurityConfig.java`:
* Public: `GET /api/courses/**`, `GET /api/categories/**`
* Đã bật `@EnableMethodSecurity`: TV2 có thể dùng `@PreAuthorize("hasRole('ADMIN')")` trên các Controller/Method của Admin.

### 1. Category API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | Lấy danh sách danh mục đang `ACTIVE` |
| `GET` | `/api/categories/{id}` | Public | Xem thông tin chi tiết một danh mục |
| `POST` | `/api/categories` | `@PreAuthorize("hasRole('ADMIN')")` | Tạo danh mục mới |
| `PUT` | `/api/categories/{id}` | `@PreAuthorize("hasRole('ADMIN')")` | Sửa thông tin danh mục |
| `DELETE` | `/api/categories/{id}` | `@PreAuthorize("hasRole('ADMIN')")` | Ngừng sử dụng danh mục (kiểm tra khóa học tham chiếu) |

### 2. Course API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | Public | Danh sách khóa học (hỗ trợ search, filter, pagination) |
| `GET` | `/api/courses/{id}` | Public | Chi tiết khóa học (kèm danh sách bài học tóm tắt) |
| `POST` | `/api/courses` | `@PreAuthorize("hasRole('ADMIN')")` | Tạo khóa học mới |
| `PUT` | `/api/courses/{id}` | `@PreAuthorize("hasRole('ADMIN')")` | Cập nhật thông tin khóa học |
| `DELETE` | `/api/courses/{id}` | `@PreAuthorize("hasRole('ADMIN')")` | Ngừng xuất bản/ẩn khóa học theo quy tắc an toàn |

**Quy chuẩn Search, Filter & Pagination cho `/api/courses`:**
* **Search:** `GET /api/courses?keyword=java` (tìm theo `title` hoặc `description`)
* **Filter:** `GET /api/courses?categoryId=1`
* **Pagination:** `GET /api/courses?page=0&size=10`
* **Kết hợp:** `GET /api/courses?keyword=java&categoryId=1&page=0&size=10&sort=createdAt,desc`
* **Yêu cầu kỹ thuật:**
  * `page` mặc định = 0.
  * `size` mặc định = 10 hoặc 12, giới hạn tối đa 50.
  * Search, Filter và Pagination phải hoạt động đồng thời.
  * Bắt buộc dùng Spring Data JPA `Pageable` và query phù hợp (`Specification` hoặc Spring Data derived query), **không** tải toàn bộ dữ liệu lên RAM rồi mới phân trang bằng Java stream.
  * Chỉ trả các khóa học `PUBLISHED` và danh mục `ACTIVE`.

### 3. Lesson API
| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses/{courseId}/lessons` | Public | Xem danh sách bài học theo khóa học (ẩn `video_url`) |
| `POST` | `/api/courses/{courseId}/lessons` | `@PreAuthorize("hasRole('ADMIN')")` | Tạo bài học mới cho khóa học |
| `PUT` | `/api/lessons/{id}` | `@PreAuthorize("hasRole('ADMIN')")` | Cập nhật bài học |
| `DELETE` | `/api/lessons/{id}` | `@PreAuthorize("hasRole('ADMIN')")` | Ngừng sử dụng/ẩn bài học |

---

## E. CẤU TRÚC BACKEND (JAVA SPRING BOOT)

Tuân thủ kiến trúc phân tầng chuẩn trong package `com.onlinecourse.backend`:

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
│       ├── CourseSummaryResponse.java  (id, title, instructorName, categoryName, thumbnail, price, originalPrice, averageRating, reviewCount, lessonCount, level)
│       ├── CourseDetailResponse.java   (đầy đủ thông tin khóa học + danh sách bài học tóm tắt)
│       └── LessonSummaryResponse.java  (id, title, description, duration, lessonOrder - KHÔNG có videoUrl)
├── service/
│   ├── CategoryService.java
│   ├── CourseService.java
│   └── LessonService.java
└── controller/
    ├── CategoryController.java
    ├── CourseController.java
    └── LessonController.java
```

* **DTO Response:** `CourseSummaryResponse` khớp với các prop của `<CourseCard />` trên Frontend. Lưu ý: trường `averageRating` và `reviewCount` thuộc nghiệp vụ Review của TV3, trước mắt TV2 có thể trả về mặc định `averageRating = 0` và `reviewCount = 0` (hoặc `null`).
* **Validation:** Luôn đặt `@Valid` trên tham số Request body của Controller và dùng `@NotBlank`, `@NotNull`, `@Min(0)` trong DTO.

---

## F. GIAO DIỆN FRONTEND (REACT)

Sử dụng bộ Design System có sẵn tại [HANDOVER_GUIDE.md](HANDOVER_GUIDE.md), trang `/ui-kit`, và các hàm API có sẵn trong `frontend/src/api/courseApi.js`:

### 1. Trang người dùng (Học viên & Khách)
1. **Trang Chủ (`HomePage.jsx`):**
   * Thay thế dữ liệu mẫu `mockData.js` bằng gọi API thật qua `courseApi.getCategories()` và `courseApi.getAllCourses({ size: 6 })`.
2. **Trang Danh Sách Khóa Học (`CourseListPage.jsx`):**
   * Đường dẫn: `/courses`
   * Thanh tìm kiếm từ khóa (Search).
   * Bộ lọc theo danh mục (Category filter).
   * Lưới khóa học (`course-grid`) sử dụng `<CourseCard course={course} to={`/courses/${course.id}`} />`.
   * Phân trang (Pagination) mượt mà.
   * Xử lý đủ 3 trạng thái: Đang tải (`<PageLoading />`), Lỗi (`<Alert variant="danger" />`), và Không tìm thấy kết quả (`<EmptyState />`).
3. **Trang Chi Tiết Khóa Học (`CourseDetailPage.jsx`):**
   * Đường dẫn: `/courses/:id`
   * Hiển thị: Tiêu đề, Danh mục, Giảng viên, Giá, Cấp độ, Thời lượng.
   * Danh sách chương trình học (các bài học tóm tắt sắp xếp theo `lesson_order`).
   * Nút Đăng ký khóa học (sẵn sàng liên kết với API Enrollment của TV3).

### 2. Trang Quản trị (Admin)
Được bọc trong `<AdminRoute>` (chỉ tài khoản có `role === 'ADMIN'` mới vào được):
1. **Quản lý Danh mục (`AdminCategoryPage.jsx` - `/admin/categories`):**
   * Bảng danh sách danh mục (ID, Tên, Trạng thái, Ngày tạo, Thao tác).
   * Modal / Form thêm mới và chỉnh sửa danh mục.
2. **Quản lý Khóa học (`AdminCoursePage.jsx` - `/admin/courses`):**
   * Bảng danh sách khóa học (lọc theo danh mục/trạng thái, phân trang).
   * Form tạo mới / sửa khóa học (chọn Category qua dropdown, nhập Title, Price, Original Price, Instructor Name, Level, Status).
3. **Quản lý Bài học (`AdminLessonPage.jsx` - `/admin/lessons`):**
   * Danh sách bài học theo từng khóa học.
   * Form thêm/sửa bài học: Tiêu đề, mô tả, video URL, thời lượng, số thứ tự.

---

## G. CHECKLIST KIỂM THỬ BẮT BUỘC

Trước khi tạo Pull Request, TV2 phải tự kiểm thử đạt tất cả các tiêu chí sau:

- [ ] **Category:**
  - [ ] Thêm danh mục thành công khi đúng dữ liệu.
  - [ ] Báo lỗi 400 khi tên danh mục bị trùng hoặc để trống.
  - [ ] Sửa danh mục thành công.
  - [ ] Không thể xóa cứng danh mục đang có khóa học tham chiếu.
  - [ ] Tài khoản USER gọi API tạo/sửa/xóa danh mục bị từ chối `403 Forbidden`.
- [ ] **Course:**
  - [ ] Tạo khóa học thành công với category hợp lệ.
  - [ ] Báo lỗi 400/404 nếu truyền `categoryId` không tồn tại.
  - [ ] Báo lỗi validation nếu `price < 0` hoặc tiêu đề trống.
  - [ ] Tìm kiếm (`keyword`) kết hợp bộ lọc (`categoryId`) và phân trang (`page`, `size`) chạy đồng thời chính xác.
  - [ ] Khóa học `DRAFT` và `INACTIVE` không bao giờ xuất hiện trong danh sách công khai của học viên.
  - [ ] Tài khoản USER gọi API tạo/sửa/xóa khóa học bị từ chối `403 Forbidden`.
  - [ ] Không làm mất dữ liệu khóa học đang có liên kết Enrollment/Review.
- [ ] **Lesson:**
  - [ ] Thêm bài học thành công cho khóa học hợp lệ.
  - [ ] Báo lỗi nếu trùng `lesson_order` trong cùng một khóa học.
  - [ ] Danh sách bài học sắp xếp đúng `lesson_order`.
  - [ ] API công khai xem danh sách bài học **tuyệt đối không để lộ `video_url`**.
  - [ ] Tài khoản USER gọi API sửa/xóa bài học bị từ chối `403 Forbidden`.
- [ ] **Frontend:**
  - [ ] Dữ liệu hiển thị từ API Backend qua Axios (không dùng mock data cứng).
  - [ ] Form nhập liệu hiển thị lỗi validate rõ ràng.
  - [ ] Search / Filter / Pagination trên UI hoạt động đồng bộ.
  - [ ] Giao diện responsive trên mobile và desktop.

---

## H. QUY TRÌNH GIT VÀ BÀN GIAO

* **Branch làm việc:** `feature/course` (tuyệt đối **không push thẳng vào `main`**).
* **Quy trình:**
  1. Pull phiên bản `main` mới nhất sau khi TV1 bàn giao:
     ```bash
     git checkout main
     git pull origin main
     ```
  2. Tạo branch tính năng của TV2:
     ```bash
     git checkout -b feature/course
     ```
  3. **Mốc 1 (CỰC KỲ QUAN TRỌNG):** Tạo Entity (`Category`, `Course`, `Lesson`) và Repository trước, tạo Pull Request đầu tiên để merge sớm vào `main`. Nhờ đó TV3 có thể dùng chung Entity `Course` và `Lesson` mà không phải chờ TV2 làm xong toàn bộ Frontend.
  4. **Mốc 2:** Hoàn thiện Service, Controller, REST API và kiểm thử bằng Postman.
  5. **Mốc 3:** Ghép API vào giao diện React.
  6. Commit rõ ràng theo từng tính năng, push branch lên GitHub và tạo Pull Request tag TV1 vào review.
* **Sản phẩm bàn giao:**
  * Mã nguồn Backend và Frontend của module.
  * Danh sách API và kết quả kiểm thử Postman.
  * Hướng dẫn chạy và kiểm thử.
  * TV2 phải giải thích được trọn vẹn luồng dữ liệu từ:
    $$\text{MySQL} \longrightarrow \text{Entity} \longrightarrow \text{Repository} \longrightarrow \text{Service} \longrightarrow \text{Controller} \longrightarrow \text{Axios} \longrightarrow \text{React}$$
