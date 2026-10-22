import { Link } from 'react-router-dom';
import { SITE } from '../config/site';
import Brand from './Brand';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div>
            <Brand />
            <p className="site-footer-about">{SITE.description}</p>
          </div>

          <div>
            <h4 className="site-footer-title">Khám phá</h4>
            <ul className="site-footer-links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/ui-kit">Bộ giao diện mẫu</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="site-footer-title">Tài khoản</h4>
            <ul className="site-footer-links">
              <li><Link to="/login">Đăng nhập</Link></li>
              <li><Link to="/register">Đăng ký</Link></li>
              <li><Link to="/profile">Hồ sơ cá nhân</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="site-footer-title">Hỗ trợ</h4>
            <ul className="site-footer-links">
              <li><Link to="/change-password">Bảo mật tài khoản</Link></li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          © {CURRENT_YEAR} {SITE.name}. Đồ án môn Công nghệ phần mềm.
        </div>
      </div>
    </footer>
  );
}
