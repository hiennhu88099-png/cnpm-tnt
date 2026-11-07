SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;

-- Tắt kiểm tra khóa ngoại để xóa và nạp lại dữ liệu an toàn
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE cart_items;
TRUNCATE TABLE wishlist_items;
TRUNCATE TABLE course_orders;
TRUNCATE TABLE reviews;
TRUNCATE TABLE lesson_progress;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE lessons;
TRUNCATE TABLE courses;
TRUNCATE TABLE categories;
TRUNCATE TABLE vouchers;
TRUNCATE TABLE banners;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 1. DANH MỤC KHÓA HỌC (CATEGORIES)
-- ==============================================================================
INSERT INTO categories (id, name, description, image, status, created_at, updated_at) VALUES 
(1, 'Lập trình Web', 'Các khóa học về Frontend, Backend và Fullstack hiện đại với Spring Boot, React, Node.js', 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800', 'ACTIVE', NOW(), NOW()),
(2, 'Trí tuệ nhân tạo', 'Học máy (Machine Learning), Deep Learning, NLP và Generative AI thực chiến', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 'ACTIVE', NOW(), NOW()),
(3, 'Thiết kế UI/UX', 'Thiết kế giao diện, trải nghiệm người dùng, Design System và Prototype với Figma', 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=800', 'ACTIVE', NOW(), NOW()),
(4, 'Khoa học dữ liệu', 'Phân tích dữ liệu lớn, trực quan hóa số liệu và thống kê dự đoán kinh doanh', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 'ACTIVE', NOW(), NOW()),
(5, 'Kinh doanh & Khởi nghiệp', 'Kỹ năng quản trị sản phẩm công nghệ, tiếp thị số và xây dựng mô hình khởi nghiệp', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', 'ACTIVE', NOW(), NOW()),
(6, 'Ngoại ngữ chuyên ngành', 'Tiếng Anh chuyên ngành Công nghệ thông tin, kỹ năng phỏng vấn và làm việc quốc tế', 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800', 'ACTIVE', NOW(), NOW());

-- ==============================================================================
-- 2. KHÓA HỌC (COURSES)
-- ==============================================================================
INSERT INTO courses (id, category_id, title, description, thumbnail, price, original_price, instructor_name, level, duration, status, created_at, updated_at) VALUES 
(1, 1, 'Lập trình Fullstack với Spring Boot và React 19', 
 'Khóa học thực chiến từ số 0 đến xây dựng hệ thống web hoàn chỉnh với Java Spring Boot 4, Spring Security, JWT stateless và React 19 mới nhất.', 
 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', 499000, 899000, 'Nguyễn Minh Khoa', 'BEGINNER', 145, 'PUBLISHED', NOW(), NOW()),

(2, 1, 'React 19 Thực Chiến: Làm Chủ Hooks & Server Components', 
 'Khám phá các tính năng mới nhất của React 19: Action, useActionState, Optimistic Updates, Server Actions và tối ưu hóa hiệu năng chuyên sâu.', 
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', 399000, 699000, 'Trần Thu Hà', 'INTERMEDIATE', 130, 'PUBLISHED', NOW(), NOW()),

(3, 2, 'Nhập Môn Machine Learning & Deep Learning với Python', 
 'Khám phá thế giới trí tuệ nhân tạo từ cơ bản. Thực hành huấn luyện các mô hình dự đoán, phân loại dữ liệu thực tế và triển khai API AI. Khóa học hoàn toàn miễn phí cho người mới bắt đầu.', 
 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 0, NULL, 'Lê Quang Huy', 'BEGINNER', 145, 'PUBLISHED', NOW(), NOW()),

(4, 3, 'Thiết Kế UI/UX Chuyên Nghiệp với Figma 2026', 
 'Hướng dẫn tạo Design System chuẩn doanh nghiệp, Auto Layout 5.0, tương tác Prototype sinh động và quy trình bàn giao thiết kế chuẩn xác cho Developer.', 
 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=800', 299000, 599000, 'Phạm Ngọc Anh', 'BEGINNER', 125, 'PUBLISHED', NOW(), NOW()),

(5, 4, 'Phân Tích Dữ Liệu Kinh Doanh với SQL và Python', 
 'Học cách truy vấn dữ liệu phức tạp với Window Functions, làm sạch dữ liệu lớn bằng Pandas và trực quan hóa Dashboard trực quan sinh động.', 
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 350000, 550000, 'Hoàng Văn Thái', 'INTERMEDIATE', 150, 'PUBLISHED', NOW(), NOW()),

(6, 1, 'Xây Dựng RESTful API Chuẩn Quốc Tế với Spring Boot', 
 'Nắm vững kiến trúc đa tầng Layered Architecture, xử lý ngoại lệ tập trung, phân quyền Role-based với JWT và viết Unit / Integration Tests với JUnit 5 & MockMvc.', 
 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800', 450000, 750000, 'Đỗ Mạnh Cường', 'ADVANCED', 145, 'PUBLISHED', NOW(), NOW()),

(7, 6, 'Tiếng Anh Chuyên Ngành CNTT cho Lập Trình Viên', 
 'Nâng cao vốn từ vựng kỹ thuật, cách viết commit message, tài liệu API, pull request và kỹ năng giao tiếp trong buổi Daily Standup hay phỏng vấn tiếng Anh.', 
 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800', 199000, 399000, 'Vũ Hoàng Yến', 'BEGINNER', 110, 'PUBLISHED', NOW(), NOW()),

(8, 5, 'Quản Trị Sản Phẩm Công Nghệ (Product Management)', 
 'Từ ý tưởng đến sản phẩm MVP: cách lập Product Roadmap, nghiên cứu User Persona, định giá và tối ưu các chỉ số chuyển đổi của sản phẩm số.', 
 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800', 590000, 990000, 'Bùi Tiến Dũng', 'INTERMEDIATE', 130, 'PUBLISHED', NOW(), NOW());

-- ==============================================================================
-- 3. BÀI HỌC (LESSONS) CHO TỪNG KHÓA HỌC (VIDEO MP4 CHUẨN HTML5, PHÁT NGAY 100%)
-- ==============================================================================

-- ---------------- Khóa học 1: Fullstack Spring Boot và React 19 ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(1, 1, 'Bài 1: Giới thiệu tổng quan kiến trúc Fullstack', 
 'Tìm hiểu mô hình Client - Server, cấu trúc tổng thể của Spring Boot 4 + React 19 và luồng xác thực JWT stateless.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 15, 1, 'ACTIVE', NOW(), NOW()),

(2, 1, 'Bài 2: Thiết kế Database & Entities với JPA Hibernate', 
 'Thiết kế các bảng categories, courses, lessons, users và thiết lập quan hệ One-to-Many, Many-to-One đúng chuẩn.', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 25, 2, 'ACTIVE', NOW(), NOW()),

(3, 1, 'Bài 3: Xây dựng RESTful API và Phân quyền Spring Security', 
 'Viết các API CRUD, cấu hình Stateless Security Filter Chain, mã hóa mật khẩu BCrypt và phân quyền ROLE_USER / ROLE_ADMIN.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 30, 3, 'ACTIVE', NOW(), NOW()),

(4, 1, 'Bài 4: Xây dựng giao diện danh sách và chi tiết khóa học React', 
 'Sử dụng Vite + React Router, kết nối Axios gọi API backend, hiển thị danh mục, phân trang và tìm kiếm theo từ khóa.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 35, 4, 'ACTIVE', NOW(), NOW()),

(5, 1, 'Bài 5: Tích hợp Đăng ký khóa học và Quản lý phòng học', 
 'Xây dựng tính năng đăng ký khóa học, theo dõi tiến độ hoàn thành bài học và gửi đánh giá nhận xét sau khi học.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 40, 5, 'ACTIVE', NOW(), NOW());

-- ---------------- Khóa học 2: React 19 Thực Chiến ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(6, 2, 'Bài 1: Những thay đổi cốt lõi trong React 19', 
 'Tìm hiểu cơ chế Render mới, React Compiler tự động tối ưu re-render và các hook thay thế.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 20, 1, 'ACTIVE', NOW(), NOW()),

(7, 2, 'Bài 2: Quản lý Form Action với useActionState', 
 'Cách xử lý submit form bất đồng bộ, hiển thị trạng thái pending và xử lý lỗi phía server một cách nhẹ nhàng.', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 30, 2, 'ACTIVE', NOW(), NOW()),

(8, 2, 'Bài 3: Cập nhật giao diện mượt mà với useOptimistic', 
 'Áp dụng Optimistic UI updates giúp phản hồi tương tác người dùng ngay lập tức trước khi request server hoàn tất.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 35, 3, 'ACTIVE', NOW(), NOW()),

(9, 2, 'Bài 4: Xây dựng Dashboard Quản trị hoàn chỉnh', 
 'Kết hợp toàn bộ kiến thức để làm một trang Admin Dashboard thống kê số liệu trực quan và tương tác tức thời.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 45, 4, 'ACTIVE', NOW(), NOW());

-- ---------------- Khóa học 3: Nhập Môn Machine Learning (Miễn phí) ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(10, 3, 'Bài 1: Tổng quan về Trí tuệ nhân tạo & Machine Learning', 
 'Phân biệt Học có giám sát (Supervised), Học không giám sát (Unsupervised) và ứng dụng thực tiễn của AI hiện nay.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 15, 1, 'ACTIVE', NOW(), NOW()),

(11, 3, 'Bài 2: Xử lý dữ liệu bảng với Pandas và NumPy', 
 'Làm sạch dữ liệu, xử lý giá trị khuyết thiếu (missing values), chuẩn hóa dữ liệu số và mã hóa biến phân loại.', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 25, 2, 'ACTIVE', NOW(), NOW()),

(12, 3, 'Bài 3: Huấn luyện mô hình hồi quy Linear Regression', 
 'Tìm hiểu hàm mất mát (Loss Function), thuật toán Gradient Descent và cách dự đoán giá nhà đất thực tế.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 30, 3, 'ACTIVE', NOW(), NOW()),

(13, 3, 'Bài 4: Phân loại dữ liệu với Random Forest', 
 'Xây dựng mô hình cây quyết định (Decision Tree) và rừng ngẫu nhiên (Random Forest) để phân loại spam email.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', 35, 4, 'ACTIVE', NOW(), NOW()),

(14, 3, 'Bài 5: Đánh giá mô hình & Đóng gói mô hình thành API', 
 'Sử dụng Accuracy, Precision, Recall, F1-Score để đánh giá mô hình và lưu trữ model với Joblib để phục vụ API.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 40, 5, 'ACTIVE', NOW(), NOW());

-- ---------------- Khóa học 4: Thiết Kế UI/UX với Figma 2026 ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(15, 4, 'Bài 1: Nguyên lý thiết kế thị giác & Hệ thống lưới (Grid)', 
 'Hiểu về quy tắc 8pt grid system, độ tương phản màu sắc, phân cấp thông tin thị giác trong thiết kế phần mềm.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 20, 1, 'ACTIVE', NOW(), NOW()),

(16, 4, 'Bài 2: Làm chủ Auto Layout & Variables trong Figma', 
 'Tạo layout co giãn thông minh cho Mobile và Desktop, thiết lập Color Variables và Typography token đồng bộ.', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 30, 2, 'ACTIVE', NOW(), NOW()),

(17, 4, 'Bài 3: Thiết kế Component Library và Design System', 
 'Tạo các component tái sử dụng như Button, Input Field, Modal, Navbar với đầy đủ trạng thái hover, active, disabled.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 40, 3, 'ACTIVE', NOW(), NOW()),

(18, 4, 'Bài 4: Tạo Prototype tương tác và Bàn giao thiết kế', 
 'Liên kết các màn hình, tạo hiệu ứng chuyển cảnh Smart Animate và chia sẻ link Spec chi tiết cho lập trình viên.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 35, 4, 'ACTIVE', NOW(), NOW());

-- ---------------- Khóa học 5: Phân Tích Dữ Liệu SQL & Python ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(19, 5, 'Bài 1: Truy vấn SQL nâng cao cho phân tích kinh doanh', 
 'Thành thạo JOIN nhiều bảng, GROUP BY kết hợp HAVING, Common Table Expressions (WITH CTE) để trích xuất số liệu.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 30, 1, 'ACTIVE', NOW(), NOW()),

(20, 5, 'Bài 2: Phân tích số liệu chuỗi thời gian với Window Functions', 
 'Sử dụng ROW_NUMBER(), RANK(), LEAD(), LAG() để tính tăng trưởng doanh thu theo tháng (Month-over-Month).', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 35, 2, 'ACTIVE', NOW(), NOW()),

(21, 5, 'Bài 3: Trực quan hóa dữ liệu kinh doanh với Seaborn & Matplotlib', 
 'Vẽ biểu đồ phân phối, biểu đồ nhiệt (Heatmap correlation) và biểu đồ xu hướng để tìm kiếm insight kinh doanh.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 40, 3, 'ACTIVE', NOW(), NOW()),

(22, 5, 'Bài 4: Phân khúc khách hàng RFM (Recency, Frequency, Monetary)', 
 'Áp dụng mô hình RFM bằng Python để phân loại khách hàng VIP, khách hàng tiềm năng và khách hàng có nguy cơ rời bỏ.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 45, 4, 'ACTIVE', NOW(), NOW());

-- ---------------- Khóa học 6: RESTful API Chuẩn Quốc Tế với Spring Boot ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(23, 6, 'Bài 1: Kiến trúc Clean Architecture trong Spring Boot', 
 'Phân tách Controller, Service, Repository, DTO và Entity đảm bảo tính độc lập và khả năng bảo trì cao.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 25, 1, 'ACTIVE', NOW(), NOW()),

(24, 6, 'Bài 2: Xử lý ngoại lệ tập trung với @ControllerAdvice', 
 'Bắt lỗi Validation 400, NotFound 404, Conflict 409 và trả về định dạng JSON lỗi đồng nhất theo chuẩn RESTful.', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 35, 2, 'ACTIVE', NOW(), NOW()),

(25, 6, 'Bài 3: Tối ưu hiệu năng truy vấn và tránh lỗi N+1 Hibernate', 
 'Sử dụng @EntityGraph, JOIN FETCH và Spring Data JPA Specification để lọc dữ liệu động đa tiêu chí.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 40, 3, 'ACTIVE', NOW(), NOW()),

(26, 6, 'Bài 4: Viết Integration Test với MockMvc & Testcontainers', 
 'Xây dựng bộ kiểm thử tự động cho toàn bộ luồng Auth, Course, Enrollment đảm bảo API hoạt động ổn định.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 45, 4, 'ACTIVE', NOW(), NOW());

-- ---------------- Khóa học 7: Tiếng Anh Chuyên Ngành CNTT ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(27, 7, 'Bài 1: Bộ thuật ngữ cốt lõi trong Phát triển Phần mềm', 
 'Học phát âm và ngữ cảnh sử dụng các thuật ngữ như Deprecate, Synchronous, Asynchronous, Refactor, Deploy.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 20, 1, 'ACTIVE', NOW(), NOW()),

(28, 7, 'Bài 2: Đọc hiểu tài liệu chính thức (Official Documentation)', 
 'Phương pháp đọc nhanh và nắm bắt nội dung tài liệu kỹ thuật từ Spring, React, MDN Web Docs và Stack Overflow.', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 30, 2, 'ACTIVE', NOW(), NOW()),

(29, 7, 'Bài 3: Viết Commit message, PR Description & Trao đổi trên GitHub', 
 'Quy tắc viết Git commit theo chuẩn Conventional Commits và cách phản hồi bình luận review code lịch sự, chuyên nghiệp.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 25, 3, 'ACTIVE', NOW(), NOW()),

(30, 7, 'Bài 4: Giao tiếp trong Daily Scrum & Trả lời phỏng vấn IT', 
 'Cấu trúc câu trả lời: What did you do yesterday? What will you do today? Any blockers? và kỹ năng trả lời phỏng vấn.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', 35, 4, 'ACTIVE', NOW(), NOW());

-- ---------------- Khóa học 8: Quản Trị Sản Phẩm Công Nghệ (PM) ----------------
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES 
(31, 8, 'Bài 1: Khám phá vai trò Product Manager trong doanh nghiệp số', 
 'Phân biệt Product Manager, Project Manager, Product Owner và tam giác giao thoa giữa Kinh doanh, Thiết kế và Công nghệ.', 
 'https://vjs.zencdn.net/v/oceans.mp4', 25, 1, 'ACTIVE', NOW(), NOW()),

(32, 8, 'Bài 2: Nghiên cứu thị trường & Xây dựng User Persona', 
 'Các phương pháp phỏng vấn người dùng, khảo sát định lượng và vẽ sơ đồ hành trình khách hàng (Customer Journey Map).', 
 'https://www.w3schools.com/html/mov_bbb.mp4', 30, 2, 'ACTIVE', NOW(), NOW()),

(33, 8, 'Bài 3: Ưu tiên tính năng sản phẩm với RICE Framework', 
 'Chấm điểm tính năng dựa trên Reach, Impact, Confidence, Effort để quyết định tính năng nào nên được đưa vào sprint tiếp theo.', 
 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 35, 3, 'ACTIVE', NOW(), NOW()),

(34, 8, 'Bài 4: Đo lường và Tối ưu sản phẩm với các chỉ số Product Analytics', 
 'Theo dõi MAU/DAU, Retention Rate, Churn Rate và xây dựng phễu chuyển đổi (Conversion Funnel) để cải tiến sản phẩm.', 
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 40, 4, 'ACTIVE', NOW(), NOW());

-- ==============================================================================
-- 4. MÃ GIẢM GIÁ (VOUCHERS)
-- ==============================================================================
INSERT INTO vouchers (id, code, type, value, max_discount, min_order_amount, description, end_date, active, created_at) VALUES
(1, 'NEWSTUDENT', 'percent', 20, 100000, 0, 'Ưu đãi 20% (tối đa 100K) dành cho học viên đăng ký khóa học mới', '2026-12-31', 1, NOW()),
(2, 'EDUHUB50', 'fixed', 50000, 50000, 150000, 'Giảm trực tiếp 50.000đ cho đơn đăng ký khóa học từ 150.000đ', '2026-12-31', 1, NOW()),
(3, 'FULLSTACK100', 'fixed', 100000, 100000, 400000, 'Giảm 100.000đ cho các khóa học chuyên sâu từ 400.000đ', '2026-12-31', 1, NOW()),
(4, 'COMBO150K', 'fixed', 150000, 150000, 600000, 'Giảm 150.000đ khi mua combo nhiều khóa học từ 600.000đ', '2026-12-31', 1, NOW());

-- ==============================================================================
-- 5. BANNER TRÌNH CHIẾU & KHUYẾN MÃI (BANNERS)
-- ==============================================================================
INSERT INTO banners (id, title, image_url, link, type, position, active, created_at) VALUES
(1, 'Siêu Hội Học Tập EduHub 2026 - Ưu đãi đến 50%', '/banners/hero-main-1.svg', '/courses', 'HomeMain', 1, 1, NOW()),
(2, 'Combo Lập Trình & AI - Tiết kiệm đến 150.000đ', '/banners/promo-left.svg', '/courses', 'Promo', 2, 1, NOW()),
(3, 'Kho Khóa Học Miễn Phí 0đ - Học thử không giới hạn', '/banners/side-right-1.svg', '/courses', 'Side', 3, 1, NOW()),
(4, 'Ưu đãi 50% Khóa học Fullstack & AI', '/banners/float-left.svg', '/courses', 'FloatLeft', 4, 1, NOW()),
(5, 'Nhập mã EDUHUB50 giảm ngay 50.000đ', '/banners/float-right.svg', '/cart', 'FloatRight', 5, 1, NOW());

-- ==============================================================================
-- 6. TÀI KHOẢN NGƯỜI DÙNG MẪU (USERS - Mật khẩu: 123456)
-- ==============================================================================
INSERT IGNORE INTO users (full_name, email, password, phone, role, status, token_version, created_at, updated_at) VALUES
('Quản Trị Viên EduHub', 'admin@eduhub.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0901234567', 'ADMIN', 'ACTIVE', 0, NOW(), NOW()),
('Nguyễn Minh Học Viên', 'hocvien@eduhub.vn', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '0987654321', 'USER', 'ACTIVE', 0, NOW(), NOW());

-- Lấy ID của học viên mẫu để gắn dữ liệu Ghi danh, Tiến độ, Đánh giá, Đơn hàng, Yêu thích & Giỏ hàng
SET @student_id = (SELECT id FROM users WHERE email = 'hocvien@eduhub.vn' LIMIT 1);

-- ==============================================================================
-- 7. GHI DANH & TIẾN ĐỘ BÀI HỌC (ENROLLMENTS & LESSON_PROGRESS)
-- ==============================================================================
INSERT INTO enrollments (id, user_id, course_id, enrolled_at, status) VALUES
(1, @student_id, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 'COMPLETED'),
(2, @student_id, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'ACTIVE');

-- Khóa học 1: Hoàn thành 100% (5/5 bài học)
INSERT INTO lesson_progress (enrollment_id, lesson_id, completed, last_watched_second, completed_at) VALUES
(1, 1, 1, 180, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 2, 1, 210, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 3, 1, 240, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 4, 1, 200, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 5, 1, 300, DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Khóa học 2: Bài 1 đã xong, Bài 2 đang xem dở tại giây thứ 95 (01:35)
(2, 6, 1, 240, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 7, 0, 95, NULL);

-- ==============================================================================
-- 8. ĐÁNH GIÁ KHÓA HỌC (REVIEWS - Có cả APPROVED và PENDING chờ duyệt)
-- ==============================================================================
INSERT INTO reviews (user_id, course_id, rating, comment, status, created_at) VALUES
(@student_id, 1, 5, 'Nội dung khóa học rất thực tế, bài giảng rõ ràng từ cơ bản đến nâng cao. Rất đáng tiền!', 'APPROVED', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@student_id, 2, 5, 'Trình phát video thông minh tự lưu lại đúng giây đang xem dở, trải nghiệm học tập rất mượt!', 'PENDING', NOW());

-- ==============================================================================
-- 9. ĐƠN HÀNG & LỊCH SỬ GIAO DỊCH (COURSE_ORDERS - Có đủ COMPLETED, PENDING & CANCELLED)
-- ==============================================================================
INSERT INTO course_orders (order_code, user_id, course_ids_csv, course_titles, subtotal_amount, discount_amount, final_amount, voucher_code, payment_method, status, created_at) VALUES
('ORD20268801', @student_id, '1,2', 'Lập trình Fullstack với Spring Boot và React 19 + React 19 Thực Chiến: Làm Chủ Hooks & Server Components', 898000, 50000, 848000, 'EDUHUB50', 'SEPAY', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('ORD20268802', @student_id, '4', 'Thiết Kế UI/UX Chuyên Nghiệp với Figma 2026', 299000, 0, 299000, NULL, 'SEPAY', 'PENDING', NOW()),
('ORD20268803', @student_id, '5', 'Docker & Kubernetes Production: Triển Khai Hệ Thống Cloud-Native', 499000, 0, 499000, NULL, 'SEPAY', 'CANCELLED', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- ==============================================================================
-- 10. KHÓA HỌC YÊU THÍCH & GIỎ HÀNG (WISHLIST_ITEMS & CART_ITEMS)
-- ==============================================================================
INSERT INTO wishlist_items (user_id, course_id, created_at) VALUES
(@student_id, 4, NOW()),
(@student_id, 5, NOW());

INSERT INTO cart_items (user_id, course_id, created_at) VALUES
(@student_id, 4, NOW()),
(@student_id, 6, NOW());

