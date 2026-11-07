import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ACCOUNT_NAV } from '../config/site';
import { Card, Icon, PageHeader } from './ui';

export default function AccountLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="account-page">
      <div className="container">
        <PageHeader
          eyebrow="Tài khoản"
          title="Cài đặt tài khoản"
          subtitle="Quản lý thông tin cá nhân, khóa học đã đăng ký và bảo mật đăng nhập của bạn."
        />

        <div className="account-grid">
          <Card className="side-nav-card">
            <nav className="side-nav" aria-label="Cài đặt tài khoản">
              {ACCOUNT_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className="side-nav-link">
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </NavLink>
              ))}
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className="side-nav-link">
                  <Icon name="sliders" size={18} />
                  Quản trị hệ thống
                </NavLink>
              )}
              <button
                type="button"
                onClick={logout}
                className="side-nav-link"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 0,
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                }}
              >
                <Icon name="logOut" size={18} />
                Đăng xuất
              </button>
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
