-- Dữ liệu mẫu khởi tạo cho hệ thống Online Course
-- Chạy vào MySQL: docker exec -i online-course-mysql mysql -uroot -pcourse123 online_course_db < docs/seed_data.sql

INSERT INTO categories (id, name, description, status, created_at, updated_at) VALUES 
(1, 'Lập trình Web', 'Các khóa học về Frontend, Backend và Fullstack', 'ACTIVE', NOW(), NOW()),
(2, 'Trí tuệ nhân tạo', 'Học máy, Deep Learning và Generative AI', 'ACTIVE', NOW(), NOW()),
(3, 'Thiết kế UI/UX', 'Thiết kế giao diện và trải nghiệm người dùng', 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO courses (id, category_id, title, description, thumbnail, price, original_price, instructor_name, level, duration, status, created_at, updated_at) VALUES 
(1, 1, 'Lập trình Fullstack với Spring Boot và React 19', 'Khóa học thực chiến từ cơ bản đến nâng cao xây dựng ứng dụng web hiện đại.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', 499000, 899000, 'Nguyễn Minh Khoa', 'BEGINNER', 1200, 'PUBLISHED', NOW(), NOW()),
(2, 1, 'React 19 thực chiến: Làm chủ Hooks và Server Components', 'Xây dựng giao diện web đỉnh cao với React 19, tối ưu hiệu năng và SEO.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', 399000, 699000, 'Trần Thu Hà', 'INTERMEDIATE', 900, 'PUBLISHED', NOW(), NOW()),
(3, 2, 'Nhập môn Machine Learning & Deep Learning với Python', 'Khám phá thế giới AI từ số 0, thực hành qua các bài toán phân loại và dự đoán.', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', 0, NULL, 'Lê Quang Huy', 'BEGINNER', 600, 'PUBLISHED', NOW(), NOW()),
(4, 3, 'Thiết kế UI/UX chuyên nghiệp với Figma 2026', 'Tạo Design System, Prototype và kiểm thử giao diện người dùng đẹp mắt.', 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=800', 299000, 599000, 'Phạm Ngọc Anh', 'BEGINNER', 750, 'PUBLISHED', NOW(), NOW())
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO lessons (id, course_id, title, content, video_url, duration, order_index, status, created_at, updated_at) VALUES
(1, 1, 'Bài 1: Giới thiệu tổng quan kiến trúc dự án', 'Tìm hiểu cấu trúc Spring Boot 4 + React 19 và luồng xử lý JWT.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 15, 1, 'ACTIVE', NOW(), NOW()),
(2, 1, 'Bài 2: Thiết kế Database & Entities với JPA', 'Tạo Category, Course, Lesson và thiết lập quan hệ 1-N.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 25, 2, 'ACTIVE', NOW(), NOW()),
(3, 1, 'Bài 3: Xây dựng REST API & Phân quyền Spring Security', 'Viết các API CRUD và bảo mật với Token JWT.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 30, 3, 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE title=VALUES(title);
