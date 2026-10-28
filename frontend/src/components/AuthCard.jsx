import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SITE } from '../config/site';
import { Icon } from './ui';

const BENEFITS = [
  { icon: 'book', text: 'Truy cập khóa học mọi lúc, mọi nơi' },
  { icon: 'chart', text: 'Theo dõi tiến độ học từng bài' },
  { icon: 'award', text: 'Đánh giá và chia sẻ cảm nhận sau khóa học' },
];

function HeroVisualPanel({ align = 'left', badgeText = 'Trang chủ', topLine, accentWord, bottomLine, description }) {
  const isRight = align === 'right';
  return (
    <div className="auth-visual-col">
      <div className={`auth-visual-card ${isRight ? 'is-right' : 'is-left'}`}>
        <div className={`auth-visual-glow ${isRight ? 'is-right' : 'is-left'}`} aria-hidden="true" />
        <div className={`auth-visual-glow-secondary ${isRight ? 'is-right' : 'is-left'}`} aria-hidden="true" />

        <div className={`auth-visual-top ${isRight ? 'is-right' : ''}`}>
          <Link to="/" className="auth-home-pill">
            <span className="auth-home-pill-arrow" aria-hidden="true">
              <Icon name="arrowRight" size={15} />
            </span>
            <span>{badgeText}</span>
          </Link>
        </div>

        <div className={`auth-visual-bottom ${isRight ? 'is-right' : ''}`}>
          <h2 className="auth-hero-heading">
            {topLine} <br />
            <span className="auth-hero-accent">{accentWord}</span> {bottomLine}
          </h2>
          <p className="auth-hero-desc">{description}</p>

          <ul className={`auth-benefits ${isRight ? 'is-right' : ''}`}>
            {BENEFITS.map((item) => (
              <li key={item.text}>
                <span className="auth-benefits-icon">
                  <Icon name={item.icon} size={15} />
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Khung 2 cột 3D Flip cho trang Đăng nhập (mặt trước) / Đăng ký (mặt sau đảo chiều)
export default function AuthCard({ variant = 'login', title, subtitle, footer, children }) {
  const location = useLocation();
  const isRegister = variant === 'register' || location.pathname === '/register';

  // Khởi tạo góc xoay ngược để tạo hiệu ứng lật 3D mượt mà khi chuyển giữa Login <-> Register
  const [flipped, setFlipped] = useState(!isRegister);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setFlipped(isRegister);
    });
    return () => cancelAnimationFrame(rafId);
  }, [isRegister]);

  return (
    <div className="auth-page">
      <div
        className={`auth-flip-stage ${flipped ? 'is-flipped' : ''}`}
      >
        {/* Mặt trước (0deg): Giao diện Đăng nhập (Poster bên trái - Form bên phải) */}
        <div
          className={`auth-face auth-face-front ${!isRegister ? 'is-active' : 'is-inactive'}`}
          aria-hidden={isRegister}
        >
          <HeroVisualPanel
            align="left"
            topLine={SITE.name.toUpperCase()}
            accentWord="&"
            bottomLine="ACADEMY."
            description="Trải nghiệm học tập trực tuyến hiện đại. Đăng nhập để tiếp tục lộ trình chinh phục kỹ năng mới."
          />

          <div className="auth-form-panel">
            <div className="auth-mobile-home">
              <Link to="/" className="auth-mobile-home-link">
                <span className="auth-home-pill-arrow" aria-hidden="true">
                  <Icon name="arrowRight" size={14} />
                </span>
                <span>Trang chủ</span>
              </Link>
            </div>
            <div className="auth-form-header">
              <h1 className="auth-title">{!isRegister ? title : 'Chào Mừng Trở Lại'}</h1>
              <p className="auth-subtitle">
                {!isRegister ? subtitle : 'Vui lòng nhập thông tin để đăng nhập.'}
              </p>
            </div>
            {!isRegister && children}
            {!isRegister && footer && <div className="auth-footer">{footer}</div>}
          </div>
        </div>

        {/* Mặt sau (180deg): Giao diện Đăng ký (Form bên trái - Poster bên phải flex-row-reverse) */}
        <div
          className={`auth-face auth-face-back ${isRegister ? 'is-active' : 'is-inactive'}`}
          aria-hidden={!isRegister}
        >
          <HeroVisualPanel
            align="right"
            topLine="JOIN"
            accentWord="THE"
            bottomLine="CLUB."
            description={`Khám phá hàng trăm khóa học thực chiến cùng cộng đồng học viên tại ${SITE.name}.`}
          />

          <div className="auth-form-panel">
            <div className="auth-mobile-home">
              <Link to="/" className="auth-mobile-home-link">
                <span className="auth-home-pill-arrow" aria-hidden="true">
                  <Icon name="arrowRight" size={14} />
                </span>
                <span>Trang chủ</span>
              </Link>
            </div>
            <div className="auth-form-header">
              <h1 className="auth-title">{isRegister ? title : 'Tạo Tài Khoản'}</h1>
              <p className="auth-subtitle">
                {isRegister ? subtitle : 'Tham gia cộng đồng học tập chất lượng cao.'}
              </p>
            </div>
            {isRegister && children}
            {isRegister && footer && <div className="auth-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
