import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ACCOUNT_NAV, MAIN_NAV, ROLE_LABELS } from '../config/site';
import { Avatar, Badge, Icon } from './ui';
import Brand from './Brand';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const urlQuery = location.pathname === '/courses' ? (searchParams.get('q') ?? '') : '';
  const [searchText, setSearchText] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const menuRef = useRef(null);

  // Đồng bộ ô tìm kiếm trên Header khi URL thay đổi
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setSearchText(urlQuery);
  }

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

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    const q = searchText.trim();
    closeMenus();
    navigate(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses');
  };

  const navLinks = MAIN_NAV.filter((link) => !link.auth || isAuthenticated);

  return (
    <header className="site-header">
      <div className="site-header-surface">
        {/* Tầng 1: Thanh điều hướng phụ (Topbar) */}
        <div className="site-header-topbar">
          <div className="container site-header-topbar-inner">
            <nav className="topbar-nav" aria-label="Menu chính">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className="topbar-nav-link"
                  onClick={closeMenus}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="topbar-right">
              <span className="topbar-divider" aria-hidden="true" />
              {user?.role === 'ADMIN' ? (
                <Link to="/admin" className="topbar-nav-link" onClick={closeMenus}>
                  Kênh Quản Trị
                </Link>
              ) : (
                <Link to="/courses" className="topbar-nav-link" onClick={closeMenus}>
                  Cổng Học Tập
                </Link>
              )}
              <div className="topbar-lang-badge" title="Ngôn ngữ: Tiếng Việt">
                <Icon name="globe" size={14} />
                <span>VI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tầng 2: Logo + Thanh tìm kiếm trung tâm + Cụm nút tiện ích */}
        <div className="container site-header-main">
          <Brand onClick={closeMenus} />

          <form className="header-search-form" onSubmit={handleHeaderSearch} role="search">
            <div className="header-search-box">
              <span className="header-search-leading-icon" aria-hidden="true">
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                className="header-search-input"
                placeholder="Tìm kiếm khóa học, kỹ năng..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                aria-label="Tìm kiếm khóa học"
              />
              {searchText && (
                <button
                  type="button"
                  className="header-search-clear"
                  onClick={() => setSearchText('')}
                  aria-label="Xóa từ khóa"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
              <button type="submit" className="header-search-btn">
                <span className="header-search-btn-label">Tìm kiếm</span>
              </button>
            </div>
          </form>

          <div className="header-actions">
            <Link
              to="/courses"
              className="header-course-widget"
              title="Danh mục khóa học"
              onClick={closeMenus}
            >
              <span className="header-course-widget-icon">
                <Icon name="book" size={20} />
              </span>
              <span className="header-course-widget-text">
                <span className="header-course-widget-sub">Khám phá</span>
                <span className="header-course-widget-title">Khóa học</span>
              </span>
            </Link>

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
              <Link to="/login" className="header-login-link" onClick={closeMenus}>
                <span className="header-login-avatar">
                  <Icon name="user" size={18} />
                </span>
                <span className="header-login-label">Đăng nhập</span>
              </Link>
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

        {/* Menu xổ xuống trên Mobile */}
        <nav className={`main-nav${mobileNavOpen ? ' is-open' : ''}`} aria-label="Menu di động">
          <form className="mobile-search-form" onSubmit={handleHeaderSearch}>
            <input
              type="text"
              className="input"
              placeholder="Tìm kiếm khóa học..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </form>
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="main-nav-link" onClick={closeMenus}>
              {link.label}
            </NavLink>
          ))}
          {!isAuthenticated && (
            <Link to="/register" className="main-nav-link" onClick={closeMenus}>
              Đăng ký tài khoản
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
