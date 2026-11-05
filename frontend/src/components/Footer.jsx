import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { SITE } from '../config/site';
import Brand from './Brand';
import { Icon } from './ui';

const CURRENT_YEAR = new Date().getFullYear();

const FALLBACK_CATEGORY_LINKS = [
  { label: 'Lập trình Web & Fullstack', to: '/courses?q=Web' },
  { label: 'Trí tuệ nhân tạo & Dữ liệu', to: '/courses?q=Python' },
  { label: 'Thiết kế UI/UX chuyên nghiệp', to: '/courses?q=UI' },
];

export default function Footer() {
  const { pathname } = useLocation();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let ignore = false;
    courseApi
      .getCategories()
      .then((list) => {
        if (!ignore && Array.isArray(list)) {
          setCategories(list);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="site-footer" className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          {/* Cột 1: Thương hiệu & Liên hệ */}
          <div className="site-footer-brand-col">
            <Brand />
            <p className="site-footer-about">{SITE.description}</p>
            <div className="site-footer-contact">
              <span>
                <Icon name="mail" size={14} /> support@eduhub.edu.vn
              </span>
              <span>
                <Icon name="clock" size={14} /> Hỗ trợ trực tuyến 24/7
              </span>
            </div>
          </div>

          {/* Cột 2: Khám phá theo danh mục (đồng bộ động từ Quản trị Danh mục) */}
          <div>
            <h3 className="site-footer-title">Danh mục khóa học</h3>
            <ul className="site-footer-links">
              <li>
                <Link to="/courses" onClick={scrollToTop}>
                  Tất cả khóa học
                </Link>
              </li>
              {categories.length > 0
                ? categories.slice(0, 5).map((cat) => (
                    <li key={cat.id}>
                      <Link to={`/courses?categoryId=${cat.id}`} onClick={scrollToTop}>
                        {cat.name}
                      </Link>
                    </li>
                  ))
                : FALLBACK_CATEGORY_LINKS.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} onClick={scrollToTop}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
              <li>
                <Link to="/courses?sort=price,asc" onClick={scrollToTop}>
                  Khóa học học phí ưu đãi
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Tài khoản & Học tập */}
          <div>
            <h3 className="site-footer-title">Học tập</h3>
            <ul className="site-footer-links">
              <li>
                <Link to="/my-courses" onClick={scrollToTop}>
                  Khóa học của tôi
                </Link>
              </li>
              <li>
                <Link to="/wishlist" onClick={scrollToTop}>
                  Danh sách yêu thích
                </Link>
              </li>
              <li>
                <Link to="/cart" onClick={scrollToTop}>
                  Giỏ hàng khóa học
                </Link>
              </li>
              <li>
                <Link to="/profile" onClick={scrollToTop}>
                  Hồ sơ cá nhân
                </Link>
              </li>
              <li>
                <Link to="/change-password" onClick={scrollToTop}>
                  Bảo mật tài khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hỗ trợ & Chính sách */}
          <div>
            <h3 className="site-footer-title">Hỗ trợ &amp; Pháp lý</h3>
            <ul className="site-footer-links">
              <li>
                <Link to="/courses" onClick={scrollToTop}>
                  Hướng dẫn đăng ký học
                </Link>
              </li>
              <li>
                <Link to="/cart" onClick={scrollToTop}>
                  Hướng dẫn thanh toán
                </Link>
              </li>
              <li>
                <Link to="/courses" onClick={scrollToTop}>
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/courses" onClick={scrollToTop}>
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            &copy; {CURRENT_YEAR} {SITE.name}. Bảo lưu mọi quyền. Đồ án môn Công nghệ phần mềm.
          </p>
          <div className="site-footer-badges" aria-label="Phương thức thanh toán hỗ trợ">
            <span className="site-footer-badge">VietQR</span>
            <span className="site-footer-badge">Chuyển khoản 24/7</span>
            <span className="site-footer-badge">MB Bank</span>
            <span className="site-footer-badge">Bảo mật SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
