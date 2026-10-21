import { NavLink, Outlet } from 'react-router-dom';
import { Card, Icon } from '../ui';

const ADMIN_NAV = [
  { to: '/admin/courses', label: 'Khóa học', icon: 'book' },
  { to: '/admin/lessons', label: 'Bài học', icon: 'play' },
  { to: '/admin/categories', label: 'Danh mục', icon: 'layers' },
];

// Khung chung cho các trang quản trị của TV2: menu trái + nội dung (Outlet).
// Dùng lại style của AccountLayout (account-page, account-grid, side-nav) cho đồng bộ.
export default function AdminLayout() {
  return (
    <div className="account-page">
      <div className="container">
        <div className="account-grid">
          <Card className="side-nav-card">
            <nav className="side-nav" aria-label="Quản trị nội dung">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className="side-nav-link">
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
