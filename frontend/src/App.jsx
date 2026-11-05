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
import MyCoursesPage from './pages/MyCoursesPage';
import LearningPage from './pages/LearningPage';
import CheckoutPage from './pages/CheckoutPage';
import SePayPaymentPage from './pages/SePayPaymentPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCategoryPage from './pages/AdminCategoryPage';
import AdminCoursePage from './pages/AdminCoursePage';
import AdminCourseFormPage from './pages/AdminCourseFormPage';
import AdminLessonPage from './pages/AdminLessonPage';
import AdminUserPage from './pages/AdminUserPage';
import AdminEnrollmentPage from './pages/AdminEnrollmentPage';
import AdminReviewPage from './pages/AdminReviewPage';
import AdminVoucherPage from './pages/AdminVoucherPage';
import AdminBannerPage from './pages/AdminBannerPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public: ai cũng xem được */}
        <Route path="/" element={<HomePage />} />
        <Route path="/ui-kit" element={<UiKitPage />} />
        <Route path="/courses" element={<CourseListPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />

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
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/learning/:courseId" element={<LearningPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/sepay" element={<SePayPaymentPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Trang Quản trị viên độc lập (Role ADMIN) - Chuẩn Nested Routes */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="categories" element={<AdminCategoryPage />} />
          <Route path="courses" element={<AdminCoursePage />} />
          <Route path="courses/new" element={<AdminCourseFormPage />} />
          <Route path="courses/:id/edit" element={<AdminCourseFormPage />} />
          <Route path="lessons" element={<AdminLessonPage />} />
          <Route path="users" element={<AdminUserPage />} />
          <Route path="enrollments" element={<AdminEnrollmentPage />} />
          <Route path="reviews" element={<AdminReviewPage />} />
          <Route path="vouchers" element={<AdminVoucherPage />} />
          <Route path="banners" element={<AdminBannerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
