import { NavLink, Outlet } from 'react-router-dom';
import { Card, Icon } from '../ui';

const ADMIN_NAV = [
  { to: '/admin', label: 'Tổng quan', icon: 'chart', end: true },
  { to: '/admin/courses', label: 'Khóa học', icon: 'book' },
  { to: '/admin/lessons', label: 'Bài học', icon: 'play' },
  { to: '/admin/categories', label: 'Danh mục', icon: 'layers' },
  { to: '/admin/users', label: 'Người dùng', icon: 'users' },
  { to: '/admin/enrollments', label: 'Đăng ký', icon: 'checkCircle' },
  { to: '/admin/reviews', label: 'Đánh giá', icon: 'star' },
];

export default function AdminLayout() {
  return (
    <div className="account-page">
      <div className="container">
        <div className="account-grid">
          <Card className="side-nav-card">
            <nav className="side-nav" aria-label="Quản trị hệ thống">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="side-nav-link">
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </Card>

          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
