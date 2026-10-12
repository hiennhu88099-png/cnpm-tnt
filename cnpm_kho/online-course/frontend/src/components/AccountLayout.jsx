import { NavLink, Outlet } from 'react-router-dom';
import { ACCOUNT_NAV } from '../config/site';
import { Card, Icon, PageHeader } from './ui';

// Khung chung cho các trang trong mục "Tài khoản": tiêu đề + menu trái + nội dung (Outlet).
// Thêm trang con: khai báo route bên trong <Route element={<AccountLayout />}> ở App.jsx
// và thêm một mục vào ACCOUNT_NAV trong config/site.js.
export default function AccountLayout() {
  return (
    <div className="account-page">
      <div className="container">
        <PageHeader eyebrow="Tài khoản" title="Cài đặt tài khoản" subtitle="Quản lý thông tin cá nhân và bảo mật đăng nhập của bạn." />

        <div className="account-grid">
          <Card className="side-nav-card">
            <nav className="side-nav" aria-label="Cài đặt tài khoản">
              {ACCOUNT_NAV.map((item) => (
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
