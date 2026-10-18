import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AccountLayout from './components/AccountLayout';
import { AdminRoute, GuestRoute, ProtectedRoute } from './auth/RouteGuards';
import AdminLayout from './components/course/AdminLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import UiKitPage from './pages/UiKitPage';
import NotFoundPage from './pages/NotFoundPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import AdminCategoryPage from './pages/AdminCategoryPage';
import AdminCoursePage from './pages/AdminCoursePage';
import AdminCourseFormPage from './pages/AdminCourseFormPage';
import AdminLessonPage from './pages/AdminLessonPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public: ai cũng xem được */}
        <Route path="/" element={<HomePage />} />
        <Route path="/ui-kit" element={<UiKitPage />} />
        <Route path="/courses" element={<CourseListPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />

        {/* Chỉ dành cho khách (đã đăng nhập sẽ bị chuyển về /profile) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Cần đăng nhập (chưa đăng nhập sẽ bị chuyển về /login) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AccountLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>
          {/* TV3: <Route path="/my-courses" element={<MyCoursesPage />} /> */}
          {/* TV3: <Route path="/learning/:courseId" element={<LearningPage />} /> */}
        </Route>

        {/* Dành riêng cho Quản trị viên (Role ADMIN) */}
        <Route element={<AdminRoute />}>
          {/* TV3: <Route path="/admin" element={<AdminDashboardPage />} /> */}
          {/* TV3: <Route path="/admin/users" element={<AdminUserPage />} /> */}
          {/* TV3: <Route path="/admin/enrollments" element={<AdminEnrollmentPage />} /> */}
          {/* TV3: <Route path="/admin/reviews" element={<AdminReviewPage />} /> */}

          {/* TV2 - Quản trị nội dung */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
            <Route path="/admin/courses" element={<AdminCoursePage />} />
            <Route path="/admin/courses/new" element={<AdminCourseFormPage />} />
            <Route path="/admin/courses/:id/edit" element={<AdminCourseFormPage />} />
            <Route path="/admin/courses/:courseId/lessons" element={<AdminLessonPage />} />
            <Route path="/admin/categories" element={<AdminCategoryPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
