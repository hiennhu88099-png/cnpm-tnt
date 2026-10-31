SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;

-- Xóa dữ liệu cũ bị lỗi font
DELETE FROM lessons;
DELETE FROM courses;
DELETE FROM categories;

-- 1. Bảng categories
INSERT INTO categories (id, name, description, status, created_at, updated_at) VALUES 
(1, 'Lập trình Web', 'Các khóa học về Frontend, Backend và Fullstack hiện đại', 'ACTIVE', NOW(), NOW()),
(2, 'Trí tuệ nhân tạo', 'Học máy (Machine Learning), Deep Learning và Generative AI', 'ACTIVE', NOW(), NOW()),
(3, 'Thiết kế UI/UX', 'Thiết kế giao diện và tối ưu trải nghiệm người dùng với Figma', 'ACTIVE', NOW(), NOW()),
(4, 'Khoa học dữ liệu', 'Phân tích dữ liệu, thống kê và trực quan hóa dữ liệu', 'ACTIVE', NOW(), NOW()),
(5, 'Kinh doanh & Khởi nghiệp', 'Kỹ năng quản trị, tiếp thị số và xây dựng sản phẩm', 'ACTIVE', NOW(), NOW()),
(6, 'Ngoại ngữ chuyên ngành', 'Tiếng Anh chuyên ngành Công nghệ thông tin', 'ACTIVE', NOW(), NOW());

-- 2. Bảng courses
INSERT INTO courses (id, category_id, title, description, thumbnail, price, original_price, instructor_name, level, duration, status, created_at, updated_at) VALUES 
(1, 1, 'Lập trình Fullstack với Spring Boot và React 19', 'Khóa học thực chiến từ số 0 đến xây dựng hệ thống web hoàn chỉnh với Java Spring Boot 4, Spring Security, JWT và React 19.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', 499000, 899000, 'Nguyễn Minh Khoa', 'BEGINNER', 1200, 'PUBLISHED', NOW(), NOW()),
(2, 1, 'React 19 thực chiến: Làm chủ Hooks và Server Components', 'Khám phá các tính năng mới nhất của React 19: Action, useActionState, Optimistic Updates và Server Components.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', 399000, 699000, 'Trần Thu Hà', 'INTERMEDIATE', 900, 'PUBLISHED', NOW(), NOW()),
(3, 2, 'Nhập môn Machine Learning & Deep Learning với Python', 'Khám phá thế giới trí tuệ nhân tạo từ cơ bản. Thực hành huấn luyện mô hình dự đoán và phân loại dữ liệu thực tế.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 0, NULL, 'Lê Quang Huy', 'BEGINNER', 600, 'PUBLISHED', NOW(), NOW()),
(4, 3, 'Thiết kế UI/UX chuyên nghiệp với Figma 2026', 'Hướng dẫn tạo Design System chuẩn doanh nghiệp, tương tác Prototype sinh động và quy trình bàn giao thiết kế.', 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=800', 299000, 599000, 'Phạm Ngọc Anh', 'BEGINNER', 750, 'PUBLISHED', NOW(), NOW()),
(5, 4, 'Phân tích dữ liệu kinh doanh với SQL và Python', 'Học cách truy vấn dữ liệu phức tạp, làm sạch dữ liệu lớn và vẽ biểu đồ trực quan hóa dữ liệu kinh doanh.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 350000, 550000, 'Hoàng Văn Thái', 'INTERMEDIATE', 800, 'PUBLISHED', NOW(), NOW()),
(6, 1, 'Xây dựng RESTful API chuẩn quốc tế với Spring Boot', 'Nắm vững kiến trúc đa tầng, xử lý ngoại lệ tập trung, phân quyền với JWT và viết unit/integration tests với JUnit 5.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800', 450000, 750000, 'Đỗ Mạnh Cường', 'ADVANCED', 1100, 'PUBLISHED', NOW(), NOW());

-- 3. Bảng lessons cho Khóa học 1
INSERT INTO lessons (id, course_id, title, description, video_url, duration, lesson_order, status, created_at, updated_at) VALUES
(1, 1, 'Bài 1: Giới thiệu tổng quan kiến trúc Fullstack', 'Tìm hiểu cấu trúc Spring Boot 4 + React 19 và luồng xác thực JWT stateless.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 15, 1, 'ACTIVE', NOW(), NOW()),
(2, 1, 'Bài 2: Thiết kế Database & Entities với JPA Hibernate', 'Tạo Category, Course, Lesson và thiết lập quan hệ One-to-Many, Many-to-One.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 25, 2, 'ACTIVE', NOW(), NOW()),
(3, 1, 'Bài 3: Xây dựng RESTful API và Bảo mật với Spring Security', 'Viết các API CRUD, cấu hình filter chain, RBAC phân quyền USER/ADMIN.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 30, 3, 'ACTIVE', NOW(), NOW()),
(4, 1, 'Bài 4: Xây dựng giao diện danh sách và chi tiết khóa học React', 'Kết nối Axios gọi API backend, hiển thị danh mục, phân trang và tìm kiếm.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 35, 4, 'ACTIVE', NOW(), NOW());
