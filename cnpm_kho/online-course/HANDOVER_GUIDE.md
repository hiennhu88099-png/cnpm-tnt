# TÀI LIỆU BÀN GIAO NỀN TẢNG VÀ QUY CHUẨN PHÁT TRIỂN DỰ ÁN

> **Dự án:** Hệ thống Quản lý và Bán Khóa học Online (`online-course`)  
> **Người biên soạn:** Thành viên 1 (Team Leader) – Phụ trách Nền tảng, Database & Authentication/Security  
> **Đối tượng sử dụng:** Toàn bộ thành viên nhóm (TV1, TV2, TV3)

---

## 1. PHÂN CHIA CÔNG VIỆC CHÍNH THỨC CHO NHÓM 3 NGƯỜI

Mỗi thành viên đều đảm nhiệm trọn vẹn cả **Java Spring Boot**, **MySQL** và **React** theo mô hình Fullstack để nắm chắc luồng dữ liệu toàn hệ thống:

| Thành viên | Trách nhiệm Module | Các bảng phụ trách | Bàn giao khi hoàn thành |
| :--- | :--- | :--- | :--- |
| **TV1 (Leader)** | **Core System & Authentication** *(Làm trước)* | `users` *(ĐÃ HOÀN TẤT)* | Database chung, Docker MySQL, Spring Boot Architecture, Security, BCrypt, JWT, Register/Login, User Profile, Đổi mật khẩu, Design System React (`/ui-kit`). |
| **TV2** | **Course Management** *(Quản lý nội dung)* | `categories`, `courses`, `lessons` | Khách/học viên duyệt, tìm kiếm, lọc danh mục, xem chi tiết khóa học và bài học; Admin quản lý danh mục, khóa học và bài học. |
| **TV3** | **Learning System & Business Logic** *(Học tập & Quản trị)* | `enrollments`, `lesson_progress`, `reviews` | Học viên đăng ký khóa học, học bài trực tuyến (video player), tích điểm tiến độ %, viết đánh giá; Admin quản lý người dùng, duyệt đánh giá và Dashboard thống kê. |

---

## 2. THỨ TỰ VÀ QUY TRÌNH TRIỂN KHAI CỦA CẢ NHÓM

```
BẠN — TV1
Docker + MySQL + User + Register/Login
                 ↓
JWT + Spring Security + Role
                 ↓
Profile + Change Password + API conventions
                 ↓
Kiểm thử + merge nền tảng vào main
                 │
          ┌──────┴──────┐
          ▼             ▼
        TV2             TV3
   Course Management  Learning System
          │             │
          ▼             ▼
   React Course UI    React Learning UI
   Admin Course UI    Admin Dashboard
          │             │
          └──────┬──────┘
                 ▼
        TÍCH HỢP TOÀN HỆ THỐNG
                 ↓
         TEST + SỬA LỖI + DEMO
```

### Quy trình nhánh GitHub (Git Workflow)
Sử dụng 3 branch tính năng chính:
```
main
 ├── feature/auth-core       ← TV1
 ├── feature/course          ← TV2
 └── feature/learning-admin  ← TV3
```

1. **Giai đoạn 1:** TV1 hoàn thành nền tảng trên `feature/auth-core`, kiểm thử xong merge vào `main`.
2. **Giai đoạn 2 (Mốc phối hợp then chốt):**
   * TV2 checkout `feature/course` từ `main`. TV2 tạo các Entity `Category`, `Course`, `Lesson` và Repository đầu tiên, tạo Pull Request sớm để merge vào `main`.
   * Nhờ đó, TV3 có thể pull `main` về `feature/learning-admin` và sử dụng trực tiếp các Entity `Course`, `Lesson` làm khóa ngoại mà không phải tự tạo Entity giả.
3. **Giai đoạn 3:** TV2 và TV3 tiếp tục phát triển song song các chức năng nghiệp vụ, Controller và Giao diện React.
4. **Giai đoạn 4:** Tạo Pull Request, review chéo và merge vào `main`.

### Bảng phân công Review chéo
| Người review | Module được review | Nội dung review bắt buộc |
| :--- | :--- | :--- |
| **TV1** | Course Management của TV2 | Chạy API Postman, kiểm tra phân trang JPA, bảo mật ẩn video URL, test React UI. |
| **TV2** | Learning System của TV3 | Kiểm tra chống trùng Enrollment, tính % tiến độ, kiểm duyệt review, test React UI. |
| **TV3** | Authentication/Security của TV1 | Kiểm tra đăng ký, đăng nhập JWT, token invalidation khi đổi pass hoặc bị khóa status. |

---

## 3. THIẾT KẾ DATABASE CHUNG (7 BẢNG)

Tuyệt đối tuân thủ đúng 7 bảng và mối quan hệ sau:

```
categories  1 ───── N courses 1 ───── N lessons

users       1 ───── N enrollments 1 ───── N lesson_progress
courses     1 ───── N enrollments
lessons     1 ─────────────────────────── N lesson_progress

users       1 ───── N reviews
courses     1 ───── N reviews
```

* **Quy tắc an toàn dữ liệu:**
  * Không sử dụng `ddl-auto=create` hoặc `create-drop` trong quá trình code (hệ thống đang dùng `update`).
  * Không xóa volume Docker MySQL để giải quyết lỗi mapping; hãy sửa code JPA.
  * Bảng `lesson_progress` bắt buộc kiểm tra 2 điều kiện: bài học thuộc đúng khóa học của enrollment, và enrollment thuộc về user đang đăng nhập.

---

## 4. HƯỚNG DẪN KỸ THUẬT QUAN TRỌNG TỪ TV1

### 4.1. Cấu hình Bảo mật đã thiết lập sẵn trong `SecurityConfig.java`
TV1 đã cấu hình sẵn trong `SecurityConfig.java`:
1. **API Công khai (Public):**
   * `/api/auth/**` (Đăng ký, Đăng nhập)
   * `GET /api/courses/**` (Xem danh sách khóa học, chi tiết khóa học, xem tóm tắt bài học, xem đánh giá)
   * `GET /api/categories/**` (Xem danh mục đang hoạt động)
2. **Method Security:** Đã bật `@EnableMethodSecurity`.
   * Các method dành riêng cho Quản trị viên chỉ cần gắn:
     ```java
     @PreAuthorize("hasRole('ADMIN')")
     ```
3. **API Admin chung:** Mọi request bắt đầu bằng `/api/admin/**` tự động yêu cầu role `ADMIN`.

### 4.2. Cách lấy thông tin Người dùng hiện tại trong Controller
Khi client gửi request kèm Bearer JWT Token, bạn có thể lấy `userId` trực tiếp trong Controller:

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    @PostMapping
    public ResponseEntity<EnrollmentResponse> enroll(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody EnrollRequest request) {

        // Lấy ID người dùng an toàn từ Subject của JWT:
        Long currentUserId = Long.valueOf(jwt.getSubject());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enrollCourse(currentUserId, request));
    }
}
```

### 4.3. Cơ chế Khóa tài khoản (`BLOCKED`)
TV1 đã cài đặt sẵn `ActiveUserTokenValidator`. Khi tài khoản bị đổi trạng thái sang `BLOCKED`:
* Không thể đăng nhập vào hệ thống (báo lỗi `Account is blocked`).
* Mọi token JWT hiện có của tài khoản đó sẽ lập tức bị vô hiệu hóa ở request tiếp theo.

### 4.4. Cách kết nối API Backend vào Giao diện Frontend (React)
Toàn bộ API đã được khai báo mẫu trong `frontend/src/api/courseApi.js`:
* `courseApi`: Dành cho TV2 (danh mục, khóa học, bài học).
* `enrollmentApi`: Dành cho TV3 (đăng ký, học bài, tiến độ, đánh giá).
* `adminApi`: Dành cho TV3 (quản lý user, duyệt review, thống kê dashboard).

Các Route Guards đã có sẵn trong `frontend/src/auth/RouteGuards.jsx`:
* `<GuestRoute>`: Dành cho trang Login / Register.
* `<ProtectedRoute>`: Dành cho trang cần đăng nhập (`/profile`, `/change-password`, `/my-courses`, `/learning/:courseId`).
* `<AdminRoute>`: Dành riêng cho tài khoản có `role === 'ADMIN'` (các trang `/admin/*`).

Xem toàn bộ giao diện mẫu, nút bấm, thẻ khóa học, thanh tiến độ, icon tại: `http://localhost:5173/ui-kit`.

---

## 5. TIÊU CHÍ HOÀN THÀNH TASK (DEFINITION OF DONE)

* **TV1 hoàn thành khi:**
  * Docker MySQL hoạt động ổn định.
  * Register mã hóa mật khẩu bằng BCrypt.
  * Login cấp JWT Token hợp lệ.
  * Profile và Đổi mật khẩu hoạt động tốt (đổi mật khẩu làm vô hiệu hóa token cũ).
  * Tài liệu bàn giao và task chi tiết rõ ràng.
* **TV2 hoàn thành khi:**
  * Thêm, sửa, xem danh mục / khóa học / bài học thành công.
  * Search, Filter và Pagination trên `/api/courses` chạy đồng thời và chính xác bằng Spring Data JPA.
  * Học viên thường không gọi được các API Admin (bị từ chối `403 Forbidden`).
  * API công khai xem bài học không để lộ `video_url`.
  * Frontend React hiển thị dữ liệu thật từ Backend qua Axios.
* **TV3 hoàn thành khi:**
  * Không cho phép đăng ký trùng cùng 1 khóa học.
  * Người chưa đăng ký không xem được video bài giảng (`/api/learning/...` trả `403`).
  * Đánh dấu hoàn thành bài học tính đúng % tiến độ (0%, 50%, 100%).
  * Chỉ người đã học mới được đánh giá khóa học; mỗi người chỉ đánh giá 1 lần.
  * Các trang quản trị Admin và API `/api/admin/**` chỉ dành riêng cho role `ADMIN`.

---

## 6. KHỞI ĐỘNG DỰ ÁN TRÊN MÁY LOCAL

```bash
# 1. Khởi động MySQL Docker
cd online-course
docker compose up -d

# 2. Khởi động Backend (Spring Boot)
cd backend
./mvnw spring-boot:run
# Backend chạy tại http://localhost:8080

# 3. Khởi động Frontend (React Vite)
cd ../frontend
npm install
npm run dev
# Frontend chạy tại http://localhost:5173
```
