import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { enrollmentApi } from '../../api/enrollmentApi';
import { reviewApi } from '../../api/reviewApi';
import { shopApi } from '../../api/shopApi';
import { useAuth } from '../../auth/useAuth';
import { formatDate, formatPrice } from '../../utils/format';
import { Icon } from '../ui';

const ADMIN_NAV = [
  {
    to: '/admin',
    label: 'Tổng quan',
    icon: 'home',
    end: true,
  },
  {
    to: '/admin/courses',
    label: 'Khóa học',
    icon: 'package',
    children: [
      { to: '/admin/courses', label: 'Tất cả khóa học', end: true },
      { to: '/admin/courses/new', label: 'Thêm khóa học mới' },
      { to: '/admin/categories', label: 'Danh mục khóa học' },
      { to: '/admin/lessons', label: 'Quản lý bài học' },
    ],
  },
  {
    to: '/admin/enrollments',
    label: 'Đăng ký học',
    icon: 'award',
  },
  {
    to: '/admin/reviews',
    label: 'Đánh giá',
    icon: 'star',
  },
  {
    to: '/admin/vouchers',
    label: 'Mã giảm giá',
    icon: 'ticket',
  },
  {
    to: '/admin/banners',
    label: 'Quản lý Banner',
    icon: 'layers',
  },
  {
    to: '/admin/users',
    label: 'Người dùng',
    icon: 'users',
  },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );
  const [openSubmenus, setOpenSubmenus] = useState({ '/admin/courses': true });

  function closeSidebarOnMobile() {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setCollapsed(true);
    }
  }
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifStorageKey = `admin_read_notif_ids_${user?.id || 'default'}`;
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`admin_read_notif_ids_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [quickSearch, setQuickSearch] = useState('');
  const notifRef = useRef(null);

  const fetchAdminNotifications = useCallback(async () => {
    const [reviewsRes, enrollmentsRes, ordersRes] = await Promise.all([
      reviewApi.getAdminReviews({ status: 'PENDING', page: 0, size: 5 }).catch(() => ({ content: [] })),
      enrollmentApi.getAllEnrollments({ page: 0, size: 5 }).catch(() => ({ content: [] })),
      shopApi.getAdminOrders().catch(() => []),
    ]);

    const pendingReviews = (reviewsRes?.content ?? []).map((r) => ({
      id: `rev-${r.id}`,
      type: 'review',
      title: `Đánh giá chờ duyệt (${r.rating}★)`,
      desc: `${r.fullName || `Học viên #${r.userId}`} — ${r.courseTitle || `Khóa học #${r.courseId}`}`,
      time: r.createdAt,
      to: '/admin/reviews',
    }));

    const latestOrders = (Array.isArray(ordersRes) ? ordersRes.slice(0, 5) : []).map((o) => ({
      id: `ord-${o.id}-${o.status}`,
      type: 'order',
      title:
        o.status === 'COMPLETED'
          ? `Thanh toán thành công #${o.orderCode}`
          : `Đơn hàng chờ thanh toán #${o.orderCode}`,
      desc: `${o.userFullName || o.userEmail || `HV #${o.userId}`} · ${formatPrice(o.finalAmount || 0)}`,
      time: o.createdAt,
      to: '/admin/enrollments',
    }));

    const latestEnrollments = (enrollmentsRes?.content ?? []).map((e) => ({
      id: `enr-${e.id}`,
      type: 'enrollment',
      title: `Ghi danh khóa học mới #${e.id}`,
      desc: `${e.title || `Khóa học #${e.courseId}`} · Học viên #${e.userId}`,
      time: e.enrolledAt,
      to: '/admin/enrollments',
    }));

    const merged = [...latestOrders, ...pendingReviews, ...latestEnrollments].sort((a, b) => {
      const ta = a.time ? new Date(a.time).getTime() : 0;
      const tb = b.time ? new Date(b.time).getTime() : 0;
      return tb - ta;
    });

    setNotifications(merged.slice(0, 10));
  }, []);

  useEffect(() => {
    const initTimer = setTimeout(fetchAdminNotifications, 0);
    const timer = setInterval(fetchAdminNotifications, 20000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(timer);
    };
  }, [pathname, fetchAdminNotifications]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [notifOpen]);

  function markAsRead(id) {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(notifStorageKey, JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  }

  function markAllAsRead() {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(notifStorageKey, JSON.stringify(allIds));
    } catch {
      // ignore storage error
    }
  }

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function handleQuickSearch(e) {
    e.preventDefault();
    const q = quickSearch.trim();
    if (!q) return;
    navigate(`/admin/courses?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className={`admin-portal-shell${collapsed ? ' is-collapsed' : ''}`}>
      {/* Left Standalone Sidebar */}
      <aside className="admin-portal-sidebar" aria-label="Menu Quản trị hệ thống">
        <div className="admin-portal-top-accent" />

        <div className="admin-portal-sidebar-header">
          <Link to="/" className="admin-portal-brand" title="Về trang chủ EduHub">
            <div className="admin-portal-brand-logo">
              <Icon name="layers" size={20} />
            </div>
            {!collapsed && (
              <div className="admin-portal-brand-text">
                <span className="admin-portal-brand-title">Quản trị hệ thống</span>
                <span className="admin-portal-brand-sub">EDUHUB ACADEMY</span>
              </div>
            )}
          </Link>
        </div>

        <div className="admin-portal-sidebar-content">
          {!collapsed && <div className="admin-portal-group-label">Danh mục chính</div>}

          <nav className="admin-portal-nav">
            {ADMIN_NAV.map((item) => {
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              const isParentActive = hasChildren
                ? item.children.some((sub) => pathname === sub.to || pathname.startsWith(`${sub.to}/`))
                : item.end
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);

              const isSubmenuOpen = Boolean(openSubmenus[item.to]) || isParentActive;

              return (
                <div key={item.to} className="admin-portal-nav-group">
                  {hasChildren && !collapsed ? (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSubmenus((prev) => ({
                          ...prev,
                          [item.to]: !isSubmenuOpen,
                        }))
                      }
                      className={`admin-portal-nav-btn is-toggle${isParentActive ? ' is-active' : ''}`}
                    >
                      <span className={`admin-portal-nav-icon${isParentActive ? ' is-active' : ''}`}>
                        <Icon name={item.icon} size={16} />
                      </span>
                      <span className="admin-portal-nav-label">{item.label}</span>
                      <Icon
                        name="chevronDown"
                        size={15}
                        className={`admin-portal-nav-chevron${isSubmenuOpen ? ' is-open' : ''}`}
                      />
                    </button>
                  ) : (
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={closeSidebarOnMobile}
                      className={`admin-portal-nav-btn${isParentActive ? ' is-active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`admin-portal-nav-icon${isParentActive ? ' is-active' : ''}`}>
                        <Icon name={item.icon} size={16} />
                      </span>
                      {!collapsed && <span className="admin-portal-nav-label">{item.label}</span>}
                    </NavLink>
                  )}

                  {!collapsed && hasChildren && isSubmenuOpen && (
                    <div className="admin-portal-subnav">
                      {item.children.map((sub) => {
                        const isSubActive = sub.end
                          ? pathname === sub.to
                          : pathname === sub.to || pathname.startsWith(`${sub.to}/`);
                        return (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            end={sub.end}
                            onClick={closeSidebarOnMobile}
                            className={`admin-portal-subnav-link${isSubActive ? ' is-active' : ''}`}
                          >
                            {isSubActive && <span className="admin-portal-subnav-dot" />}
                            <span>{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="admin-portal-sidebar-footer">
          <div className="admin-portal-user-wrap">
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="admin-portal-user-btn"
              title={user?.fullName || 'Admin'}
            >
              <div className="admin-portal-user-avatar">
                <img src={user?.avatar || '/default-avatar.png'} alt="" />
              </div>
              {!collapsed && (
                <>
                  <span className="admin-portal-user-name">{user?.fullName || 'Quản trị viên'}</span>
                  <Icon name="chevronDown" size={15} className="admin-portal-user-caret" />
                </>
              )}
            </button>

            {userMenuOpen && (
              <div className="admin-portal-user-dropdown">
                <Link to="/profile" className="admin-portal-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <Icon name="user" size={15} />
                  <span>Tài khoản cá nhân</span>
                </Link>
                <Link to="/" className="admin-portal-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <Icon name="home" size={15} />
                  <span>Về trang học viên</span>
                </Link>
                <button type="button" onClick={handleLogout} className="admin-portal-dropdown-item is-danger">
                  <Icon name="logout" size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {!collapsed && (
        <div
          className="admin-portal-mobile-backdrop"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Right Main Area */}
      <div className="admin-portal-inset">
        <header className="admin-portal-header">
          <div className="admin-portal-top-accent" />

          <div className="admin-portal-header-inner">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="admin-portal-trigger"
              aria-label="Thu gọn / Mở rộng thanh bên"
            >
              <Icon name="menu" size={18} />
            </button>

            <div className="admin-portal-header-divider" />

            <form onSubmit={handleQuickSearch} className="admin-portal-search-form">
              <Icon name="search" size={16} className="admin-portal-search-icon" />
              <input
                type="search"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Tìm kiếm nhanh khóa học, danh mục..."
                className="admin-portal-search-input"
              />
            </form>

            <div className="admin-portal-header-actions">
              <div className="admin-portal-notif-wrap" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !notifOpen;
                    setNotifOpen(nextOpen);
                    if (nextOpen) fetchAdminNotifications();
                  }}
                  className="admin-portal-notif-btn"
                  aria-label="Thông báo quản trị"
                  title="Thông báo hệ thống"
                >
                  <Icon name="bell" size={18} />
                  {unreadCount > 0 && (
                    <span className="admin-portal-notif-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="admin-portal-notif-dropdown">
                    <div className="admin-portal-notif-head">
                      <div>
                        <h4>Thông báo hệ thống</h4>
                        <p>{unreadCount} hoạt động chưa đọc</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="admin-portal-notif-markall"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>

                    <div className="admin-portal-notif-list">
                      {notifications.length === 0 ? (
                        <div className="admin-portal-notif-empty">
                          <Icon name="bell" size={24} />
                          <p>Chưa có thông báo mới</p>
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const isUnread = !readIds.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                markAsRead(item.id);
                                setNotifOpen(false);
                                navigate(item.to);
                              }}
                              className={`admin-portal-notif-item${isUnread ? ' is-unread' : ''}`}
                            >
                              <span
                                className={`admin-portal-notif-icon ${
                                  item.type === 'review' ? 'is-amber' : 'is-blue'
                                }`}
                              >
                                <Icon
                                  name={
                                    item.type === 'review'
                                      ? 'star'
                                      : item.type === 'order'
                                        ? 'wallet'
                                        : 'award'
                                  }
                                  size={15}
                                />
                              </span>
                              <span className="admin-portal-notif-body">
                                <span className="admin-portal-notif-title">{item.title}</span>
                                <span className="admin-portal-notif-desc">{item.desc}</span>
                                <span className="admin-portal-notif-time">
                                  {formatDate(item.time)}
                                </span>
                              </span>
                              {isUnread && <span className="admin-portal-notif-dot" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/" className="admin-portal-action-link">
                <Icon name="globe" size={16} />
                <span>Xem trang chủ</span>
              </Link>
              <Link to="/admin/courses/new" className="admin-portal-action-primary">
                <span>+ Khóa học mới</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="admin-portal-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
