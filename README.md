# Hệ thống Quản lý và Bán Khóa học Trực tuyến (Online Course System)

Dự án môn học Công nghệ phần mềm — Nền tảng học trực tuyến Fullstack với Java Spring Boot, MySQL và React.

---

## 1. Thành viên & Phân chia trách nhiệm

| Thành viên | Phụ trách | Các bảng phụ trách | Nhánh Git |
| :--- | :--- | :--- | :--- |
| **TV1 (Leader)** | Core Architecture, Database, Authentication & Security | `users` | `feature/auth-core` |
| **TV2** | Course Management (Danh mục, Khóa học, Bài học) | `categories`, `courses`, `lessons` | `feature/course` |
| **TV3** | Learning System, Progress, Reviews & Admin System | `enrollments`, `lesson_progress`, `reviews` | `feature/learning-admin` |

---

## 2. Tài liệu hướng dẫn & Đặc tả chi tiết

* 📘 [Tài liệu Bàn giao Nền tảng & Hướng dẫn Kỹ thuật (HANDOVER_GUIDE.md)](HANDOVER_GUIDE.md)
* 📋 [Đặc tả Task TV2 — Course Management Fullstack (TASK_TV2_COURSE_MANAGEMENT.md)](TASK_TV2_COURSE_MANAGEMENT.md)
* 📋 [Đặc tả Task TV3 — Learning System + Reviews + Admin (TASK_TV3_LEARNING_SYSTEM.md)](TASK_TV3_LEARNING_SYSTEM.md)

---

## 3. Hướng dẫn khởi động dự án

### 3.1. Khởi động MySQL Database (Docker)
```bash
docker compose up -d
```
* **MySQL:** `localhost:3306` (Database: `online_course_db`, User: `root`, Password: `course123`)
* **Adminer Web UI:** `http://localhost:8082`

### 3.2. Khởi động Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
* Backend lắng nghe tại: `http://localhost:8080`

### 3.3. Khởi động Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
* Frontend chạy tại: `http://localhost:5173`
* Xem bộ UI Kit & Design System tại: `http://localhost:5173/ui-kit`
