import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ACCOUNT_NAV, MAIN_NAV, ROLE_LABELS } from '../config/site';
import { Avatar, Badge, Button, Icon } from './ui';
import Brand from './Brand';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);

  // Đóng dropdown khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const closeMenus = () => {
    setMenuOpen(false);
    setMobileNavOpen(false);
  };

  const handleLogout = () => {
    closeMenus();
    logout();
    navigate('/');
  };

  const navLinks = MAIN_NAV.filter((link) => !link.auth || isAuthenticated);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Brand onClick={closeMenus} />

        <nav className={`main-nav${mobileNavOpen ? ' is-open' : ''}`} aria-label="Menu chính">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="main-nav-link" onClick={closeMenus}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <div className="user-menu" ref={menuRef}>
              <button
                type="button"
                className="user-menu-trigger"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <Avatar src={user.avatar} name={user.fullName} size={32} />
                <span className="user-menu-name">{user.fullName}</span>
                <Icon name="chevronDown" size={16} />
              </button>

              {menuOpen && (
                <div className="dropdown" role="menu">
                  <div className="dropdown-header">
                    <Avatar src={user.avatar} name={user.fullName} size={40} />
                    <div className="dropdown-header-text">
                      <div className="dropdown-header-name">{user.fullName}</div>
                      <div className="dropdown-header-email">{user.email}</div>
                      <Badge variant="primary">{ROLE_LABELS[user.role] || user.role}</Badge>
                    </div>
                  </div>
                  {ACCOUNT_NAV.map((item) => (
                    <Link key={item.to} to={item.to} className="dropdown-item" role="menuitem" onClick={closeMenus}>
                      <Icon name={item.icon} size={16} />
                      {item.label}
                    </Link>
                  ))}
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className="dropdown-item" role="menuitem" onClick={closeMenus}>
                      <Icon name="chart" size={16} />
                      Trang quản trị
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button type="button" className="dropdown-item is-danger" role="menuitem" onClick={handleLogout}>
                    <Icon name="logout" size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="header-actions header-guest-actions">
              <Button variant="ghost" to="/login" onClick={closeMenus}>Đăng nhập</Button>
              <Button to="/register" onClick={closeMenus}>Đăng ký</Button>
            </div>
          )}

          <button
            type="button"
            className="menu-toggle"
            aria-label={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Icon name={mobileNavOpen ? 'x' : 'menu'} size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
