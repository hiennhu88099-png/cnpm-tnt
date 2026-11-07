import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { SITE } from '../config/site';
import Brand from './Brand';
import { Button, Icon } from './ui';

const CURRENT_YEAR = new Date().getFullYear();

const FOOTER_POLICIES = {
  enrollGuide: {
    title: 'Hướng dẫn đăng ký & học tập',
    sections: [
      {
        heading: '1. Tìm kiếm và chọn khóa học',
        body: 'Truy cập mục Khóa học hoặc thanh tìm kiếm để lọc khóa học theo danh mục, trình độ (Cơ bản, Trung cấp, Nâng cao) và xem trước bài học mở thử miễn phí.',
      },
      {
        heading: '2. Thêm vào giỏ hàng hoặc đăng ký ngay',
        body: 'Bạn có thể thêm nhiều khóa học vào Giỏ hàng để thanh toán gộp một lần và áp dụng mã giảm giá (Voucher) từ Ví ưu đãi trên trang chủ.',
      },
      {
        heading: '3. Học tập và lưu tiến độ tự động',
        body: 'Sau khi thanh toán thành công, khóa học được kích hoạt tức thì tại mục "Khóa học của tôi". Hệ thống tự động lưu vị trí giây video đang xem và phần trăm hoàn thành bài giảng.',
      },
    ],
  },
  paymentGuide: {
    title: 'Hướng dẫn thanh toán qua VietQR & SePay',
    sections: [
      {
        heading: '1. Quét mã VietQR tự động',
        body: 'Tại trang thanh toán, hệ thống khởi tạo mã QR chuẩn Napas 247 đi kèm sẵn số tiền và nội dung chuyển khoản định danh đơn hàng (ví dụ: EDUHUB123456).',
      },
      {
        heading: '2. Xác nhận giao dịch tức thì qua Webhook',
        body: 'Mở ứng dụng ngân hàng bất kỳ và quét mã QR. Ngay khi giao dịch hoàn tất, cổng SePay Webhook sẽ tự động đối soát và mở quyền truy cập khóa học trong vòng vài giây.',
      },
      {
        heading: '3. Tra cứu lịch sử giao dịch',
        body: 'Mọi hóa đơn mua khóa học, mức giảm giá Voucher và trạng thái thanh toán đều được lưu trữ minh bạch tại mục Tài khoản → Lịch sử giao dịch (/orders).',
      },
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật thông tin',
    sections: [
      {
        heading: '1. Dữ liệu thu thập',
        body: 'EduHub chỉ thu thập các thông tin cần thiết để cung cấp dịch vụ học tập: Họ tên, địa chỉ Email xác thực tài khoản, lịch sử đơn hàng và tiến độ hoàn thành bài giảng.',
      },
      {
        heading: '2. Bảo mật mật khẩu & phiên đăng nhập',
        body: 'Mật khẩu người dùng được mã hóa một chiều bằng thuật toán BCrypt. Phiên làm việc được bảo vệ qua chữ ký số JWT (HMAC-SHA256) và cơ chế giới hạn tần suất chống tấn công dò mật khẩu.',
      },
      {
        heading: '3. Cam kết quyền riêng tư',
        body: 'Chúng tôi không chia sẻ, bán hoặc trao đổi dữ liệu cá nhân của học viên cho bất kỳ bên thứ ba nào ngoài mục đích đối soát thanh toán hợp pháp.',
      },
    ],
  },
  terms: {
    title: 'Điều khoản sử dụng dịch vụ',
    sections: [
      {
        heading: '1. Quyền truy cập khóa học',
        body: 'Tài khoản đã mua hoặc đăng ký khóa học được cấp quyền truy cập trọn đời vào toàn bộ video bài giảng và tài liệu đi kèm của khóa học đó trên nền tảng EduHub.',
      },
      {
        heading: '2. Bản quyền nội dung',
        body: 'Toàn bộ video bài giảng, tài liệu và mã nguồn mẫu thuộc bản quyền của EduHub và giảng viên. Học viên không được phép sao chép, phát tán hoặc kinh doanh lại dưới mọi hình thức.',
      },
      {
        heading: '3. Quy tắc đánh giá & cộng đồng',
        body: 'Học viên đã đăng ký khóa học có quyền gửi đánh giá sao và nhận xét thực tế. Các đánh giá vi phạm tiêu chuẩn cộng đồng hoặc spam sẽ được quản trị viên kiểm duyệt.',
      },
    ],
  },
};

export default function Footer() {
  const { pathname } = useLocation();
  const [categories, setCategories] = useState([]);
  const [activePolicyKey, setActivePolicyKey] = useState(null);

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

  const activePolicy = activePolicyKey ? FOOTER_POLICIES[activePolicyKey] : null;

  return (
    <footer id="site-footer" className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          {/* Cột 1: Thương hiệu & Liên hệ */}
          <div className="site-footer-brand-col">
            <Brand />
            <p className="site-footer-about">{SITE.description}</p>
            <div className="site-footer-contact">
              <a href={`mailto:${SITE.supportEmail}`} className="site-footer-contact-link">
                <Icon name="mail" size={14} /> {SITE.supportEmail}
              </a>
              <a
                href={`tel:${String(SITE.supportPhone).replace(/\s+/g, '')}`}
                className="site-footer-contact-link"
              >
                <Icon name="phone" size={14} /> Hotline: {SITE.supportPhone}
              </a>
              <span>
                <Icon name="clock" size={14} /> {SITE.supportHours}
              </span>
            </div>
          </div>

          {/* Cột 2: Khám phá theo danh mục (đồng bộ trực tiếp từ Database) */}
          <div>
            <h3 className="site-footer-title">Danh mục khóa học</h3>
            <ul className="site-footer-links">
              <li>
                <Link to="/courses" onClick={scrollToTop}>
                  Tất cả khóa học
                </Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/courses?categoryId=${cat.id}`} onClick={scrollToTop}>
                    {cat.name}
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
            <h3 className="site-footer-title">Học tập &amp; Tài khoản</h3>
            <ul className="site-footer-links">
              <li>
                <Link to="/my-courses" onClick={scrollToTop}>
                  Khóa học của tôi
                </Link>
              </li>
              <li>
                <Link to="/cart" onClick={scrollToTop}>
                  Giỏ hàng khóa học
                </Link>
              </li>
              <li>
                <Link to="/wishlist" onClick={scrollToTop}>
                  Danh sách yêu thích
                </Link>
              </li>
              <li>
                <Link to="/orders" onClick={scrollToTop}>
                  Lịch sử giao dịch
                </Link>
              </li>
              <li>
                <Link to="/profile" onClick={scrollToTop}>
                  Hồ sơ &amp; Bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hỗ trợ & Chính sách */}
          <div>
            <h3 className="site-footer-title">Hỗ trợ &amp; Pháp lý</h3>
            <ul className="site-footer-links">
              <li>
                <button
                  type="button"
                  className="site-footer-link-btn"
                  onClick={() => setActivePolicyKey('enrollGuide')}
                >
                  Hướng dẫn đăng ký học
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-footer-link-btn"
                  onClick={() => setActivePolicyKey('paymentGuide')}
                >
                  Hướng dẫn thanh toán QR
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-footer-link-btn"
                  onClick={() => setActivePolicyKey('privacy')}
                >
                  Chính sách bảo mật
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="site-footer-link-btn"
                  onClick={() => setActivePolicyKey('terms')}
                >
                  Điều khoản sử dụng
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p className="site-footer-copy">
            &copy; {CURRENT_YEAR} {SITE.name}. Bảo lưu mọi quyền.
          </p>
          <div className="site-footer-badges" aria-label="Phương thức thanh toán và bảo mật">
            <span className="site-footer-badge">VietQR Napas 247</span>
            <span className="site-footer-badge">SePay Auto-Webhook</span>
            <span className="site-footer-badge">Chuyển khoản 24/7</span>
            <span className="site-footer-badge">Bảo mật JWT &amp; SSL</span>
          </div>
        </div>
      </div>

      {activePolicy && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-policy-title"
          onClick={() => setActivePolicyKey(null)}
        >
          <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-body stack" style={{ gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h3 id="footer-policy-title" style={{ margin: 0, fontSize: 'var(--text-xl)' }}>
                  {activePolicy.title}
                </h3>
                <button
                  type="button"
                  className="voucher-modal-close"
                  onClick={() => setActivePolicyKey(null)}
                  aria-label="Đóng"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
              <div className="stack" style={{ gap: 'var(--space-3)' }}>
                {activePolicy.sections.map((sec) => (
                  <div key={sec.heading}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                      {sec.heading}
                    </div>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.65 }}>
                      {sec.body}
                    </p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
                <Button onClick={() => setActivePolicyKey(null)}>Đã hiểu</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
