# TÀI LIỆU ĐẶC TẢ KỊCH BẢN KIỂM THỬ (TEST CASE SPECIFICATION)

> **Dự án:** Hệ thống Học trực tuyến & Thương mại Khóa học **EduHub**  
> **Kiến trúc:** Spring Boot 4 (Java 17) • React 19 (Vite 8) • MySQL 8.0 • Docker & Nginx  
> **Phạm vi kiểm thử:** Toàn bộ 10 phân hệ nghiệp vụ (Xác thực, Người dùng, Danh mục, Khóa học, Bài giảng & Học thử, Ghi danh & Tiến độ Video, Đánh giá, Giỏ hàng & Yêu thích, Thanh toán VietQR/SePay & Lịch sử đơn, Bảo mật & Hiệu năng).

---

## 1. Tổng quan Ma trận Kiểm thử (Test Coverage Matrix)

| STT | Phân hệ nghiệp vụ | Mã nhóm | Số lượng Test Case | Kiểm thử Tự động (Automated) | Kiểm thử Giao diện (E2E/UI) | Kết quả |
| :-: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | Xác thực & Phân quyền (Auth & RBAC) | `TC-AUTH` | 8 | `AuthControllerTest` | Login / Register / Guard | **PASS** |
| 2 | Hồ sơ & Quản lý Người dùng (Users) | `TC-USER` | 7 | `UserControllerTest`, `AdminUserControllerTest` | Profile / Change Password / Admin | **PASS** |
| 3 | Quản lý Danh mục (Categories) | `TC-CAT` | 6 | `CategoryControllerTest` | Carousel Trái/Phải & Admin | **PASS** |
| 4 | Khóa học & Tìm kiếm / Bộ lọc (Courses) | `TC-CRS` | 8 | `CourseControllerTest` | CustomSelect & Catalog | **PASS** |
| 5 | Bài giảng & Xem thử miễn phí (Lessons) | `TC-LES` | 6 | `LessonControllerTest`, `EnrollmentLearningReviewControllerTest` | Smart Video Modal & Admin | **PASS** |
| 6 | Ghi danh, Học tập & Lưu giây Video | `TC-LRN` | 7 | `EnrollmentLearningReviewControllerTest`, `ShopAndPaymentControllerTest` | Learning Player & Resume | **PASS** |
| 7 | Đánh giá & Kiểm duyệt (Reviews) | `TC-REV` | 5 | `EnrollmentLearningReviewControllerTest` | StarRating & Admin Review | **PASS** |
| 8 | Giỏ hàng (Guest/User), Yêu thích, Voucher & Banner | `TC-SHOP` | 8 | `ShopAndPaymentControllerTest`, `shopStore.test.js` | Guest Cart Merge & Wallet | **PASS** |
| 9 | Thanh toán VietQR, SePay Webhook & Lịch sử đơn | `TC-PAY` | 6 | `ShopAndPaymentControllerTest` | Checkout / SePay QR / Orders | **PASS** |
| 10 | Bảo mật, Chống vét cạn & Sức khỏe hệ thống | `TC-SEC` | 5 | `ShopAndPaymentControllerTest` | SQLi / RateLimit / Healthcheck | **PASS** |
| **Tổng** | **10 Phân hệ** | — | **66 TC** | **JUnit 5 + Node Test Runner** | **React 19 Responsive UI** | **66/66 PASS** |

---

## 2. Chi tiết Kịch bản Kiểm thử theo Phân hệ

### Phân hệ 1: Xác thực & Phân quyền (`TC-AUTH`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-AUTH-01` | Đăng ký tài khoản học viên thành công | Email chưa tồn tại trong DB | 1. Mở `/register` hoặc gọi `POST /api/auth/register`<br>2. Nhập họ tên, email, mật khẩu hợp lệ<br>3. Bấm Đăng ký | `fullName`: `"Nguyễn Văn A"`<br>`email`: `"nguyenvana@eduhub.vn"`<br>`password`: `"123456"` | HTTP `201 Created`, mật khẩu được băm BCrypt trong bảng `users`, gán `role = USER`, `status = ACTIVE`. | Auto + UI | **PASS** |
| `TC-AUTH-02` | Đăng ký trùng địa chỉ Email | Email `hocvien@eduhub.vn` đã tồn tại | Gửi `POST /api/auth/register` với email đã có | `email`: `"hocvien@eduhub.vn"`<br>`password`: `"123456"` | HTTP `400 Bad Request` (hoặc `409`), thông báo lỗi email đã được sử dụng. | Auto + UI | **PASS** |
| `TC-AUTH-03` | Kiểm tra ràng buộc dữ liệu đầu vào khi đăng ký | Không có | Gửi `POST /api/auth/register` với email sai định dạng, mật khẩu `< 6` ký tự | `email`: `"sai-email"`<br>`password`: `"123"` | HTTP `400 Bad Request`, trả về chi tiết `fieldErrors` cho từng trường không hợp lệ. | Auto + UI | **PASS** |
| `TC-AUTH-04` | Đăng nhập thành công và nhận JWT | Tài khoản `hocvien@eduhub.vn` đang `ACTIVE` | 1. Mở `/login` hoặc gọi `POST /api/auth/login`<br>2. Nhập email & mật khẩu đúng | `email`: `"hocvien@eduhub.vn"`<br>`password`: `"123456"` | HTTP `200 OK`, trả về `accessToken` chuẩn HMAC-SHA256 kèm thông tin `user`. | Auto + UI | **PASS** |
| `TC-AUTH-05` | Đăng nhập sai mật khẩu | Tài khoản tồn tại | Nhập đúng email nhưng sai mật khẩu | `email`: `"hocvien@eduhub.vn"`<br>`password`: `"sai_mat_khau"` | HTTP `401 Unauthorized`, thông báo email hoặc mật khẩu không chính xác. | Auto + UI | **PASS** |
| `TC-AUTH-06` | Chặn đăng nhập khi tài khoản bị khóa (`BLOCKED`) | Tài khoản bị Admin đổi trạng thái sang `BLOCKED` | Gọi `POST /api/auth/login` bằng tài khoản bị khóa | `email`: `"blocked@eduhub.vn"`<br>`password`: `"123456"` | HTTP `403 Forbidden` / `401`, từ chối cấp token cho tài khoản đã bị khóa. | Auto | **PASS** |
| `TC-AUTH-07` | Chặn học viên (`ROLE_USER`) truy cập API Quản trị | Đăng nhập bằng tài khoản `USER` | Gọi `GET /api/admin/dashboard` hoặc mở `/admin` | Header `Authorization: Bearer <user_jwt>` | API trả về HTTP `403 Forbidden`; trên giao diện `AdminRoute` tự động chuyển hướng về `/`. | Auto + UI | **PASS** |
| `TC-AUTH-08` | Đăng xuất xóa sạch dữ liệu phiên cá nhân | Đang đăng nhập có dữ liệu Giỏ hàng, Yêu thích, Ví Voucher | Bấm nút **Đăng xuất** trên menu tài khoản | Thao tác click `logout()` | Xóa JWT, gọi `clearUserShopSession()` làm sạch `wishlist`, `cart`, `savedVouchers` khỏi trình duyệt. | Auto + UI | **PASS** |

---

### Phân hệ 2: Hồ sơ cá nhân & Quản trị Người dùng (`TC-USER`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-USER-01` | Xem thông tin cá nhân hiện tại (`GET /api/users/me`) | Đã đăng nhập | Mở trang `/profile` | Bearer Token hợp lệ | HTTP `200 OK`, hiển thị đúng Họ tên, Email, Số điện thoại, Ảnh đại diện, Vai trò. | Auto + UI | **PASS** |
| `TC-USER-02` | Cập nhật hồ sơ cá nhân (`PUT /api/users/me`) | Đã đăng nhập | Sửa Họ tên, Số điện thoại, Tiểu sử tại `/profile` rồi bấm Lưu | `fullName`: `"Nguyễn Văn Học Viên Mới"`<br>`phone`: `"0912345678"` | HTTP `200 OK`, lưu thay đổi vào DB và cập nhật tên trên thanh Header ngay lập tức. | Auto + UI | **PASS** |
| `TC-USER-03` | Đổi mật khẩu thành công (`PUT /api/users/me/password`) | Đã đăng nhập | Mở `/change-password`, nhập mật khẩu hiện tại và mật khẩu mới | `currentPassword`: `"123456"`<br>`newPassword`: `"654321"` | HTTP `200 OK`, đăng nhập lại bằng mật khẩu mới `"654321"` thành công. | Auto + UI | **PASS** |
| `TC-USER-04` | Đổi mật khẩu thất bại khi nhập sai mật khẩu cũ | Đã đăng nhập | Nhập sai `currentPassword` | `currentPassword`: `"000000"`<br>`newPassword`: `"654321"` | HTTP `400 Bad Request`, báo lỗi mật khẩu hiện tại không đúng. | Auto + UI | **PASS** |
| `TC-USER-05` | Admin xem danh sách và lọc người dùng | Đăng nhập `ADMIN` | Mở `/admin/users`, lọc theo Vai trò (`USER`/`ADMIN`) và Trạng thái (`ACTIVE`/`BLOCKED`) | `role=USER`, `status=ACTIVE` | HTTP `200 OK`, hiển thị bảng phân trang kèm bộ lọc `CustomSelect` mượt mà. | Auto + UI | **PASS** |
| `TC-USER-06` | Admin khóa / mở khóa tài khoản học viên | Đăng nhập `ADMIN` | Tại `/admin/users`, đổi trạng thái học viên sang `BLOCKED` | `status`: `"BLOCKED"` | HTTP `200 OK`, trạng thái tài khoản chuyển sang `Đã khóa`. | Auto + UI | **PASS** |
| `TC-USER-07` | Chặn Admin tự khóa hoặc tự hạ quyền chính mình | Đăng nhập `ADMIN` | Mở form sửa tài khoản của chính Admin đang đăng nhập | `userId === currentUser.id` | Các ô chọn Vai trò & Trạng thái bị vô hiệu hóa (`disabled`), Backend từ chối nếu cố gọi API. | Auto + UI | **PASS** |

---

### Phân hệ 3: Quản lý Danh mục & Carousel Trang chủ (`TC-CAT`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-CAT-01` | Xem danh sách danh mục công khai (`GET /api/categories`) | Có danh mục `ACTIVE` trong DB | Mở Trang chủ `/` hoặc `/courses` | Không cần đăng nhập | HTTP `200 OK`, chỉ trả về các danh mục có `status = ACTIVE`. | Auto + UI | **PASS** |
| `TC-CAT-02` | Điều hướng Trái / Phải (`‹` / `›`) trên Carousel Danh mục | Có `> 6` danh mục `ACTIVE` trong DB | Tại mục *"Khám phá theo danh mục"* trên trang chủ, bấm nút `›` (Phải) và `‹` (Trái) | Click nút `.category-carousel-btn` | Danh mục hiển thị gọn trên 1 hàng 6 thẻ, trượt mượt sang các danh mục tiếp theo; tự mờ nút khi ở đầu/cuối. | UI | **PASS** |
| `TC-CAT-03` | Admin thêm mới danh mục (`POST /api/admin/categories`) | Đăng nhập `ADMIN` | Mở `/admin/categories`, nhập tên và mô tả danh mục mới | `name`: `"Điện toán đám mây"`<br>`status`: `"ACTIVE"` | HTTP `201 Created`, danh mục mới xuất hiện ngay trên trang chủ và Footer. | Auto + UI | **PASS** |
| `TC-CAT-04` | Chặn tạo danh mục trùng tên | Đã có danh mục `"Lập trình Web"` | Admin tạo danh mục mới trùng tên `"Lập trình Web"` | `name`: `"Lập trình Web"` | HTTP `400 Bad Request` / `409 Conflict`, báo lỗi tên danh mục đã tồn tại. | Auto + UI | **PASS** |
| `TC-CAT-05` | Admin cập nhật danh mục (`PUT /api/admin/categories/{id}`) | Đăng nhập `ADMIN` | Sửa tên/trạng thái danh mục tại `/admin/categories` | `name`: `"Lập trình Web Fullstack"` | HTTP `200 OK`, cập nhật thành công. | Auto + UI | **PASS** |
| `TC-CAT-06` | Chặn xóa danh mục đang chứa khóa học | Danh mục đã gắn với ít nhất 1 khóa học | Admin bấm Xóa danh mục đó | `DELETE /api/admin/categories/{id}` | HTTP `400 Bad Request` / `409`, báo không thể xóa danh mục đang có khóa học. | Auto + UI | **PASS** |

---

### Phân hệ 4: Quản lý Khóa học, Tìm kiếm & Bộ lọc CustomSelect (`TC-CRS`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-CRS-01` | Xem danh sách khóa học công khai (`GET /api/courses`) | Có khóa học `PUBLISHED` | Mở trang `/courses` | `page=0, size=12` | HTTP `200 OK`, chỉ trả về khóa học `PUBLISHED` kèm `averageRating` và `reviewCount` thật từ bảng `reviews`. | Auto + UI | **PASS** |
| `TC-CRS-02` | Tìm kiếm khóa học theo từ khóa (`keyword`) | Có khóa học chứa từ `"Spring Boot"` | Nhập `"Spring Boot"` vào thanh tìm kiếm Header hoặc trang `/courses` | `q=Spring Boot` | HTTP `200 OK`, hiển thị danh sách các khóa học khớp tiêu đề/mô tả. | Auto + UI | **PASS** |
| `TC-CRS-03` | Lọc theo Danh mục & Sắp xếp bằng `CustomSelect` | Trang `/courses` đang mở | Bấm vào cửa sổ thả xuống **Danh mục** và **Sắp xếp** (`Giá thấp → cao`), sau đó cuộn trang | `categoryId=1`, `sort=price,asc` | Menu `CustomSelect` mở mượt, hiển thị dấu `✓` ở mục đang chọn, tự đóng khi cuộn qua gầm Header (`z-index` chuẩn). | Auto + UI | **PASS** |
| `TC-CRS-04` | Xem chi tiết khóa học (`GET /api/courses/{id}`) | Khóa học `PUBLISHED` | Bấm vào 1 thẻ khóa học bất kỳ | `courseId = 1` | HTTP `200 OK`, hiển thị thông tin khóa học, giá bán, giá gốc, danh sách bài giảng và đánh giá. | Auto + UI | **PASS** |
| `TC-CRS-05` | Ẩn khóa học Bản nháp (`DRAFT`) khỏi khách vãng lai | Khóa học có `status = DRAFT` | Khách gọi `GET /api/courses/{id}` của khóa `DRAFT` | `courseId` của khóa nháp | HTTP `404 Not Found`, học viên không thể xem khóa học chưa xuất bản. | Auto | **PASS** |
| `TC-CRS-06` | Admin tạo mới khóa học (`POST /api/admin/courses`) | Đăng nhập `ADMIN` | Mở `/admin/courses/new`, điền thông tin khóa học và bấm Lưu | `title`, `categoryId`, `price=499000`, `level=BEGINNER`, `status=PUBLISHED` | HTTP `201 Created`, tạo khóa học thành công và chuyển sang trang thêm bài học. | Auto + UI | **PASS** |
| `TC-CRS-07` | Admin chỉnh sửa thông tin khóa học | Đăng nhập `ADMIN` | Mở `/admin/courses/{id}/edit`, cập nhật học phí và trạng thái | `price=399000`, `status=PUBLISHED` | HTTP `200 OK`, thông tin mới hiển thị ngay ngoài trang `/courses`. | Auto + UI | **PASS** |
| `TC-CRS-08` | Kiểm tra ràng buộc giá học phí âm | Đăng nhập `ADMIN` | Nhập `price = -50000` khi tạo/sửa khóa học | `price: -50000` | HTTP `400 Bad Request`, từ chối lưu học phí âm. | Auto | **PASS** |

---

### Phân hệ 5: Quản lý Bài giảng & Học thử Miễn phí (`TC-LES`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-LES-01` | Xem thử miễn phí Bài giảng số 1 (`previewVideoUrl`) | Khóa học có `>= 2` bài giảng `ACTIVE` | Chưa mua khóa học, mở `/courses/{id}` và bấm **"Xem thử"** ở Bài học số 1 | `lessonOrder = 1` | API trả về `previewVideoUrl` cho đúng bài `lessonOrder == 1`; bài thứ 2 trở đi có `previewVideoUrl = null` (bị khóa). | Auto + UI | **PASS** |
| `TC-LES-02` | Phát video đa luồng trong Modal Xem thử | Mở Modal Xem thử tại `/courses/{id}` | BấmXem thử bài 1 (link MP4, YouTube hoặc Vimeo) | URL MP4 / YouTube | Smart Video Player tự nhận diện định dạng và phát video mượt mà ngay trong Modal. | UI | **PASS** |
| `TC-LES-03` | Admin thêm bài học vào khóa học | Đăng nhập `ADMIN` | Mở `/admin/lessons?courseId=1`, nhập tiêu đề, link video, thời lượng, thứ tự | `title`: `"Bài 1"`, `lessonOrder`: `1`, `duration`: `15` | HTTP `201 Created`, bài học được thêm vào khóa học. | Auto + UI | **PASS** |
| `TC-LES-04` | Chặn trùng thứ tự bài học (`lessonOrder`) trong cùng khóa | Khóa học đã có bài `lessonOrder = 1` | Admin thêm bài mới cũng có `lessonOrder = 1` trong cùng khóa đó | `lessonOrder: 1` | HTTP `400 Bad Request` / `409 Conflict`, báo lỗi thứ tự bài học đã tồn tại. | Auto + UI | **PASS** |
| `TC-LES-05` | Admin cập nhật nội dung và link video bài học | Đăng nhập `ADMIN` | Chọn bài học tại `/admin/lessons`, sửa `videoUrl` và `duration` | `PUT /api/admin/lessons/{id}` | HTTP `200 OK`, cập nhật thành công. | Auto + UI | **PASS** |
| `TC-LES-06` | Admin xóa bài học | Đăng nhập `ADMIN` | Bấm Xóa bài học tại `/admin/lessons` | `DELETE /api/admin/lessons/{id}` | HTTP `204 No Content`, bài học bị xóa khỏi danh sách. | Auto + UI | **PASS** |

---

### Phân hệ 6: Ghi danh, Phòng học Video & Lưu vị trí Giây đang xem (`TC-LRN`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-LRN-01` | Đăng ký trực tiếp khóa học Miễn phí (`price = 0`) | Đã đăng nhập học viên | Mở khóa học Miễn phí, bấm **"Đăng ký học miễn phí"** | `POST /api/enrollments` `{ "courseId": 1 }` | HTTP `201 Created`, tạo bản ghi `Enrollment` trạng thái `ACTIVE`, chuyển vào phòng học. | Auto + UI | **PASS** |
| `TC-LRN-02` | Chặn đăng ký trùng khóa học đã sở hữu | Học viên đã đăng ký khóa học đó | Gọi lại `POST /api/enrollments` cho cùng `courseId` | `{ "courseId": 1 }` | HTTP `400 Bad Request`, thông báo học viên đã đăng ký khóa học này rồi. | Auto | **PASS** |
| `TC-LRN-03` | Chặn người chưa mua truy cập phòng học `/learning/{courseId}` | Học viên chưa đăng ký khóa học `#5` | Truy cập `/learning/5` hoặc gọi `GET /api/learning/courses/5/lessons` | `courseId = 5` | HTTP `403 Forbidden` / `400`, chặn xem nội dung bài giảng trả phí khi chưa ghi danh. | Auto + UI | **PASS** |
| `TC-LRN-04` | Lưu vị trí giây đang xem video xuống Database (`lastWatchedSecond`) | Đã ghi danh khóa học | Xem video tại `/learning/{courseId}` đến giây thứ `142` (`PUT /api/lessons/{id}/watch-position`) | `{ "lastWatchedSecond": 142 }` | HTTP `200 OK`, cột `last_watched_second` trong bảng `lesson_progress` lưu giá trị `142`. | Auto + UI | **PASS** |
| `TC-LRN-05` | Tự động tua tiếp video (Resume Playback) khi mở lại bài học | Bài học đã có `lastWatchedSecond = 142` trong DB | Tải lại trang `/learning/{courseId}` trên bất kỳ trình duyệt/thiết bị nào | `GET /api/learning/courses/{id}/lessons` | API trả về `lastWatchedSecond: 142`, trình phát video tự động tua đến `02:22` và hiện thông báo đã khôi phục vị trí xem. | Auto + UI | **PASS** |
| `TC-LRN-06` | Đánh dấu hoàn thành bài giảng & Tính phần trăm tiến độ | Khóa học có 2 bài giảng `ACTIVE` | Hoàn thành bài 1 (`POST /api/lessons/{id1}/complete`) | `lessonId = id1` | HTTP `200 OK`, `completedLessons = 1`, `totalLessons = 2`, `progressPercent = 50.0%`. | Auto + UI | **PASS** |
| `TC-LRN-07` | Tự động chuyển trạng thái khóa học sang `COMPLETED` khi đạt `100%` | Đã hoàn thành `1/2` bài giảng | Hoàn thành nốt bài giảng thứ 2 | `lessonId = id2` | `progressPercent = 100.0%`, trạng thái `Enrollment` trong `/my-courses` tự động chuyển thành `COMPLETED` (*"Đã hoàn thành"*). | Auto + UI | **PASS** |

---

### Phân hệ 7: Đánh giá Khóa học & Kiểm duyệt (`TC-REV`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-REV-01` | Học viên đã ghi danh gửi đánh giá sao & nhận xét | Học viên đã đăng ký khóa học | Tại `/courses/{id}`, chọn số sao bằng `CustomSelect`, nhập nhận xét và bấm Gửi | `rating: 5`, `comment: "Khóa học rất thực tế!"` | HTTP `201 Created`, lưu đánh giá vào bảng `reviews`. | Auto + UI | **PASS** |
| `TC-REV-02` | Chặn người chưa mua khóa học gửi đánh giá | Tài khoản chưa ghi danh khóa học | Gọi `POST /api/reviews` cho khóa học chưa mua | `courseId`, `rating: 5` | HTTP `400 Bad Request` / `403`, chỉ học viên đã đăng ký mới được đánh giá. | Auto | **PASS** |
| `TC-REV-03` | Học viên chỉnh sửa hoặc xóa đánh giá của mình | Đã gửi đánh giá trước đó | Bấm Sửa hoặc Xóa đánh giá tại `/courses/{id}` | `PUT /api/reviews/{id}` hoặc `DELETE` | Cập nhật hoặc xóa thành công khỏi khóa học. | Auto + UI | **PASS** |
| `TC-REV-04` | Admin kiểm duyệt (Duyệt / Ẩn) đánh giá | Đăng nhập `ADMIN` | Mở `/admin/reviews`, bấm **Duyệt** (`APPROVED`) hoặc **Ẩn** (`HIDDEN`) | `PATCH /api/admin/reviews/{id}/status` | HTTP `200 OK`, chỉ các đánh giá `APPROVED` mới hiển thị công khai trên trang khóa học. | Auto + UI | **PASS** |
| `TC-REV-05` | Tự động tính điểm sao trung bình (`averageRating`) trên thẻ khóa học | Có đánh giá `APPROVED` trong DB | Gọi `GET /api/courses` hoặc xem thẻ khóa học ngoài trang chủ | Khóa học có đánh giá 5 sao | `CourseSummaryResponse` trả về đúng `averageRating = 5.0` và `reviewCount = 1` từ Database (không dùng số giả). | Auto + UI | **PASS** |

---

### Phân hệ 8: Giỏ hàng (Guest Cart & Merge), Yêu thích, Voucher & Banner (`TC-SHOP`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-SHOP-01` | Khách vãng lai (chưa đăng nhập) thêm khóa học vào Giỏ hàng tạm (`Guest Cart`) | Chưa đăng nhập | Bấm **"Thêm giỏ"** trên `CourseCard` hoặc trang chi tiết rồi mở `/cart` | Khóa học có phí (`price > 0`) | Thêm vào `Guest Cart` thành công, hiển thị badge số lượng trên Navbar và xem được danh sách trong `/cart`. | Auto + UI | **PASS** |
| `TC-SHOP-02` | Tự động gộp Giỏ hàng tạm (`Guest Cart`) vào Database khi Đăng nhập | Khách đã thêm 2 khóa học vào giỏ lúc chưa đăng nhập | Bấm **"Tiến hành thanh toán"** → Đăng nhập tài khoản học viên | Thông tin đăng nhập hợp lệ | `syncShopFromBackend()` tự động đẩy 2 khóa học từ `Guest Cart` lên bảng `cart_items` trong MySQL và chuyển thẳng tới trang `/checkout`. | Auto + UI | **PASS** |
| `TC-SHOP-03` | Chặn khách chưa đăng nhập bấm Yêu thích (`♥`) hoặc Lưu mã giảm giá | Chưa đăng nhập | Bấm icon trái tim `♥` hoặc nút **"Lưu Mã"** trên trang chủ | Click khi `!isAuthenticated` | Tự động chuyển hướng sang trang `/login` (sau khi đăng nhập trả về đúng trang đang xem). | UI | **PASS** |
| `TC-SHOP-04` | Học viên thêm / bỏ khóa học Yêu thích (`Wishlist`) | Đã đăng nhập | Bấm nút `♥` trên thẻ khóa học và mở `/wishlist` | `POST /api/wishlists/{courseId}/toggle` | HTTP `200 OK`, lưu vào bảng `wishlist_items` trong DB và hiển thị trong trang `/wishlist`. | Auto + UI | **PASS** |
| `TC-SHOP-05` | Tính toán giảm giá Voucher theo `%` (có trần `maxDiscount`) và số tiền cố định | Có Voucher `NEWSTUDENT` (20%, tối đa 100K) và `EDUHUB50` (50K) | Áp dụng mã giảm giá tại trang `/checkout` | Đơn `800.000đ` áp mã `NEWSTUDENT` | Giảm đúng `100.000đ` (không vượt trần `maxDiscount`), thành tiền còn `700.000đ`. | Auto + UI | **PASS** |
| `TC-SHOP-06` | Admin thêm / sửa / bật tắt Voucher (`CRUD`) | Đăng nhập `ADMIN` | Mở `/admin/vouchers`, tạo mã `EDUHUB99` | `code: "EDUHUB99"`, `value: 25`, `type: "percent"` | HTTP `201 Created`, hiển thị ngay tại mục *Mã Giảm Giá Chớp Nhoáng* ngoài trang chủ. | Auto + UI | **PASS** |
| `TC-SHOP-07` | Admin thêm / sửa / ẩn hiện Banner quảng cáo (`CRUD`) | Đăng nhập `ADMIN` | Mở `/admin/banners`, tạo Banner mới, sửa inline và gạt công tắc ẩn/hiện | `type: "HomeMain"`, `active: true -> false` | Khi `active = true` thì `GET /api/banners` trả về banner; khi tắt `active = false` thì ẩn khỏi trang chủ ngay lập tức. | Auto + UI | **PASS** |
| `TC-SHOP-08` | Xóa nhiều khóa học đã mua khỏi giỏ hàng sau khi thanh toán | Giỏ hàng có 3 khóa, thanh toán 2 khóa | Hoàn tất thanh toán đơn hàng | `removeMultipleFromCart([301, 303])` | Chỉ xóa đúng 2 khóa đã mua khỏi giỏ, giữ nguyên khóa còn lại. | Auto | **PASS** |

---

### Phân hệ 9: Thanh toán VietQR, SePay Auto-Webhook & Lịch sử giao dịch (`TC-PAY`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-PAY-01` | Lấy cấu hình ngân hàng VietQR (`GET /api/payment/config`) | Không có | Mở trang thanh toán QR `/payment/sepay` | Không cần token | HTTP `200 OK`, trả về `bankCode`, `bankName`, `accountNumber`, `accountHolder`, `transferPrefix`. | Auto + UI | **PASS** |
| `TC-PAY-02` | Tạo đơn hàng chờ thanh toán (`POST /api/orders/pending`) | Đã đăng nhập | Từ `/checkout`, bấm thanh toán VietQR | `orderCode: "ORD998877"`, `finalAmount: 300000` | HTTP `201 Created`, lưu đơn hàng vào bảng `course_orders` với trạng thái `PENDING`. | Auto + UI | **PASS** |
| `TC-PAY-03` | Xác nhận tự động qua SePay Webhook (`POST /api/webhooks/sepay`) | Có đơn hàng `ORD998877` đang `PENDING` với số tiền `300.000đ` | SePay gửi Webhook giao dịch tiền vào (`transferType = "in"`) chứa mã `ORD998877` | `transferAmount: 300000`, `content: "Chuyen khoan EDUHUB ORD998877"` | HTTP `200 OK`, đơn hàng chuyển sang `COMPLETED`, tự động tạo `Enrollment` kích hoạt khóa học và xóa khóa đó khỏi giỏ hàng. | Auto + UI | **PASS** |
| `TC-PAY-04` | Từ chối mở khóa học khi số tiền chuyển khoản trong Webhook thấp hơn giá đơn | Đơn `ORD998877` cần `300.000đ` | Gửi Webhook với `transferAmount: 50000` (`< 300000`) | `transferAmount: 50000` | Đơn hàng giữ nguyên trạng thái `PENDING`, không kích hoạt khóa học khi chuyển thiếu tiền. | Auto | **PASS** |
| `TC-PAY-05` | Học viên tra cứu Lịch sử giao dịch (`/orders` — `GET /api/orders/my`) | Học viên đã có đơn `COMPLETED` hoặc `PENDING` | Mở `/orders`, lọc theo tab *Tất cả / Đã hoàn tất / Chờ thanh toán* | Bearer Token học viên | Hiển thị thống kê tổng chi tiêu, danh sách hóa đơn; đơn `COMPLETED` có nút **Vào học ngay**, đơn `PENDING` có nút **Tiếp tục thanh toán QR**. | Auto + UI | **PASS** |
| `TC-PAY-06` | Chuông thông báo Thời gian thực của Admin (`AdminLayout`) | Có đơn hàng mới, lượt ghi danh mới hoặc đánh giá `PENDING` | Đăng nhập `ADMIN`, bấm vào biểu tượng Chuông thông báo ở góc phải | Polling 20s từ 3 nguồn API thật | Hiển thị tổng số thông báo chưa đọc, sắp xếp mới nhất lên đầu, lưu trạng thái đã đọc riêng theo từng tài khoản Admin. | UI | **PASS** |

---

### Phân hệ 10: Bảo mật, Chống vét cạn & Sức khỏe Hệ thống (`TC-SEC`)

| Mã TC | Tên kịch bản kiểm thử | Tiền điều kiện | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Loại | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `TC-SEC-01` | Chống tấn công SQL Injection trên thanh tìm kiếm khóa học | Có khóa học trong DB | Gửi payload SQLi vào tham số `keyword` của `GET /api/courses` | `keyword = "' OR '1'='1' --"` | HTTP `200 OK` với `content = []` (0 kết quả), câu lệnh PreparedStatement của Spring Data JPA vô hiệu hóa hoàn toàn SQLi. | Auto | **PASS** |
| `TC-SEC-02` | Chống tấn công SQL Injection trên biểu mẫu Đăng nhập | Không có | Gửi payload SQLi vào trường `email` của `POST /api/auth/login` | `email = "admin@example.com' OR '1'='1"` | HTTP `400 Bad Request` / `401 Unauthorized`, từ chối truy cập. | Auto | **PASS** |
| `TC-SEC-03` | Chống tấn công Brute-force mật khẩu bằng `RateLimitFilter` | Cùng 1 địa chỉ IP gửi liên tiếp vào `/api/auth/login` | Gửi vượt quá 20 request đăng nhập sai trong vòng 1 phút từ cùng IP | 21 requests liên tiếp với header `X-Forwarded-For: 203.0.113.99` | 20 request đầu trả về `401`; từ request thứ 21 bị chặn ngay lập tức với HTTP `429 Too Many Requests`. | Auto | **PASS** |
| `TC-SEC-04` | Kiểm tra Healthcheck Production (`GET /api/health`) | Hệ thống và MySQL đang chạy | Gọi `GET /api/health` (dùng cho Docker Compose & Uptime Monitor) | Không cần đăng nhập | HTTP `200 OK`, trả về `{"status": "UP", "database": "UP", "timestamp": "..."}`. | Auto | **PASS** |
| `TC-SEC-05` | Kiểm tra Bảo mật HTTP Headers & Gzip trên Nginx Production | Xem cấu hình `frontend/nginx.conf` | Kiểm tra các header phản hồi từ Nginx container | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` | Đầy đủ security headers chống Clickjacking/MIME-sniffing, ẩn phiên bản `server_tokens off`, nén `gzip on`. | Auto / Config | **PASS** |

---

## 3. Hướng dẫn chạy Kiểm thử Tự động (Automated Test Execution)

### 3.1. Chạy toàn bộ JUnit 5 Integration Tests ở Backend
```bash
./backend/mvnw -f backend/pom.xml test
```

### 3.2. Chạy toàn bộ Unit Tests ở Frontend
```bash
npm --prefix frontend test
```

