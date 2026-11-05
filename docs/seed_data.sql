SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;

-- Tắt kiểm tra khóa ngoại để xóa và nạp lại dữ liệu an toàn
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE reviews;
TRUNCATE TABLE lesson_progress;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE lessons;
TRUNCATE TABLE courses;
TRUNCATE TABLE categories;

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
