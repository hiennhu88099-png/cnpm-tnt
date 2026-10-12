import { SITE } from '../config/site';
import { Icon } from './ui';

const BENEFITS = [
  { icon: 'book', text: 'Truy cập khóa học mọi lúc, mọi nơi' },
  { icon: 'chart', text: 'Theo dõi tiến độ học từng bài' },
  { icon: 'award', text: 'Đánh giá và chia sẻ cảm nhận sau khóa học' },
];

// Khung 2 cột cho trang Đăng nhập / Đăng ký: cột trái giới thiệu, cột phải là form (children)
export default function AuthCard({ title, subtitle, footer, children }) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div>
            <h2 className="auth-aside-title">Học tập không giới hạn cùng {SITE.name}</h2>
            <p className="auth-aside-text">{SITE.description}</p>
          </div>
          <ul className="auth-benefits">
            {BENEFITS.map((item) => (
              <li key={item.text}>
                <span className="auth-benefits-icon"><Icon name={item.icon} size={16} /></span>
                {item.text}
              </li>
            ))}
          </ul>
        </aside>

        <div className="auth-form-panel">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
          {footer && <p className="auth-footer">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
