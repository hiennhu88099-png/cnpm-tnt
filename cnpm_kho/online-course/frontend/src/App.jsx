import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AccountLayout from './components/AccountLayout';
import { GuestRoute, ProtectedRoute } from './auth/RouteGuards';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import UiKitPage from './pages/UiKitPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public: ai cũng xem được */}
        <Route path="/" element={<HomePage />} />
        <Route path="/ui-kit" element={<UiKitPage />} />
        {/* TV2: <Route path="/courses" element={<CourseListPage />} />, <Route path="/courses/:id" ... /> */}

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
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
