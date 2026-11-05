import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import {
  Alert,
  BannerSkeleton,
  Button,
  CategoryGridSkeleton,
  CourseCard,
  CourseGridSkeleton,
  EmptyState,
  Icon,
  VoucherStripSkeleton,
} from '../components/ui';
import { SITE } from '../config/site';
import { useShopStore } from '../utils/shopStore';
import { formatPrice } from '../utils/format';

// Biểu tượng xoay vòng cho các ô danh mục (API danh mục không có icon riêng)
const CATEGORY_ICONS = ['code', 'globe', 'chart', 'cpu', 'briefcase', 'pen'];
const FEATURED_COUNT = 6;

const CATEGORY_COLORS = [
  { background: '#eff6ff', color: '#2563eb' },
];

const QUICK_SERVICES = [
  { icon: 'code', label: 'Lập trình Web', color: '#2563eb', bg: '#eff6ff', to: '/courses?q=Web' },
  { icon: 'cpu', label: 'AI & Dữ liệu', color: '#2563eb', bg: '#eff6ff', to: '/courses?q=AI' },
  { icon: 'pen', label: 'Thiết kế UI/UX', color: '#2563eb', bg: '#eff6ff', to: '/courses?q=UI' },
  { icon: 'star', label: 'Khóa học VIP', color: '#2563eb', bg: '#eff6ff', to: '/courses' },
  { icon: 'graduation', label: 'Góc học tập', color: '#2563eb', bg: '#eff6ff', to: '/my-courses' },
  { icon: 'award', label: 'Cấp chứng chỉ', color: '#2563eb', bg: '#eff6ff', to: '/courses' },
  { icon: 'tag', label: 'Ưu đãi Hot', color: '#2563eb', bg: '#eff6ff', to: '#home-vouchers' },
  { icon: 'shield', label: 'Hỗ trợ 24/7', color: '#2563eb', bg: '#eff6ff', to: '/courses' },
];

const FEATURES = [
  { icon: 'clock', title: 'Học theo nhịp của bạn', desc: 'Truy cập bài giảng mọi lúc, xem lại bao nhiêu lần tùy thích trên mọi thiết bị.' },
  { icon: 'chart', title: 'Theo dõi tiến độ', desc: 'Đánh dấu bài đã học và biết chính xác mình đã hoàn thành bao nhiêu phần trăm khóa học.' },
  { icon: 'users', title: 'Đánh giá minh bạch', desc: 'Xem nhận xét thật từ học viên trước khi đăng ký, và chia sẻ cảm nhận của bạn sau khi học.' },
];

function BannerAnchor({ link, title, className, children }) {
  const href = (link || '/courses').trim();
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={title} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} aria-label={title} className={className}>
      {children}
    </Link>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const {
    activeBanners,
    activeVouchers,
    bannersLoading,
    vouchersLoading,
    isVoucherSaved,
    saveUserVoucher,
  } = useShopStore();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nearFooter, setNearFooter] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      courseApi.getCategories(),
      courseApi.getAllCourses({ page: 0, size: FEATURED_COUNT, sort: 'createdAt,desc' }),
    ])
      .then(([categoryList, coursePage]) => {
        if (ignore) return;
        setCategories(categoryList);
        setCourses(coursePage.content);
      })
      .catch((err) => !ignore && setError(parseApiError(err).message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = footer.getBoundingClientRect().top;
      setNearFooter(top < window.innerHeight - 140);
    };
    const onScrollOrResize = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const primaryBanner = activeBanners.find((b) => b.type === 'HomeMain') || activeBanners[0];
  const promoBanners = activeBanners.filter((b) => b.type === 'Promo');
  const sideBanners = activeBanners.filter((b) => b.type === 'Side');
  const floatLeftBanner = activeBanners.find((b) => b.type === 'FloatLeft');
  const floatRightBanner = activeBanners.find((b) => b.type === 'FloatRight');
  const leadPromoBanner = promoBanners[0];
  const supportingBanners = [...promoBanners.slice(1), ...sideBanners];

  function handleCopyVoucher(code) {
    saveUserVoucher(code);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
  }

  return (
    <>
      {/* Liễng treo 2 bên màn hình lớn */}
      {(floatLeftBanner || floatRightBanner) && (
        <>
          {floatLeftBanner && (
            <div
              className={`store-float-banner is-left${nearFooter ? ' is-hidden' : ''}`}
              aria-hidden={nearFooter}
            >
              <BannerAnchor
                link={floatLeftBanner.link}
                title={floatLeftBanner.title || 'Banner ưu đãi trái'}
                className="store-float-banner-link"
              >
                <img src={floatLeftBanner.imageUrl} alt={floatLeftBanner.title || 'Banner ưu đãi'} />
              </BannerAnchor>
            </div>
          )}
          {floatRightBanner && (
            <div
              className={`store-float-banner is-right${nearFooter ? ' is-hidden' : ''}`}
              aria-hidden={nearFooter}
            >
              <BannerAnchor
                link={floatRightBanner.link}
                title={floatRightBanner.title || 'Banner ưu đãi phải'}
                className="store-float-banner-link"
              >
                <img src={floatRightBanner.imageUrl} alt={floatRightBanner.title || 'Banner ưu đãi'} />
              </BannerAnchor>
            </div>
          )}
        </>
      )}

      {/* 1 & 2. Cụm Banner Trang chủ hoặc Khung xương khi đang tải */}
      {bannersLoading ? (
        <BannerSkeleton showSubBanners />
      ) : (
        <>
          {primaryBanner && (
            <section className="store-banner-top-section">
              <div className="container">
                <BannerAnchor
                  link={primaryBanner.link}
                  title={primaryBanner.title || SITE.name}
                  className="store-banner-card is-primary"
                >
                  <img
                    src={primaryBanner.imageUrl}
                    alt={primaryBanner.title || SITE.name}
                    className="store-banner-img"
                  />
                </BannerAnchor>
              </div>
            </section>
          )}

          {(leadPromoBanner || supportingBanners.length > 0) && (
            <section className="store-banner-sub-section">
              <div className="container">
                <div
                  className={`store-banner-grid${
                    leadPromoBanner && supportingBanners.length > 0 ? ' is-split' : ''
                  }`}
                >
                  {leadPromoBanner && (
                    <BannerAnchor
                      link={leadPromoBanner.link}
                      title={leadPromoBanner.title || 'Ưu đãi khóa học'}
                      className="store-banner-card"
                    >
                      <img
                        src={leadPromoBanner.imageUrl}
                        alt={leadPromoBanner.title || 'Ưu đãi khóa học'}
                        className="store-banner-img"
                      />
                    </BannerAnchor>
                  )}

                  {supportingBanners.length > 0 && (
                    <div className={`store-banner-side-stack${leadPromoBanner ? '' : ' is-two-col'}`}>
                      {supportingBanners.map((banner) => (
                        <BannerAnchor
                          key={banner.id}
                          link={banner.link}
                          title={banner.title || 'Ưu đãi khóa học'}
                          className="store-banner-card"
                        >
                          <img
                            src={banner.imageUrl}
                            alt={banner.title || 'Ưu đãi khóa học'}
                            className="store-banner-img"
                          />
                        </BannerAnchor>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* 3. Thanh Dịch vụ & Điều hướng nhanh (8 ô biểu tượng) */}
      <section className="store-quick-nav-section">
        <div className="container">
          <div className="store-quick-nav-bar">
            {QUICK_SERVICES.map((item) => {
              const isHash = item.to.startsWith('#');
              const Tag = isHash ? 'a' : Link;
              const linkProps = isHash ? { href: item.to } : { to: item.to };
              return (
                <Tag key={item.label} {...linkProps} className="store-quick-nav-item">
                  <div
                    className="store-quick-nav-icon"
                    style={{ background: item.bg, color: item.color }}
                  >
                    <Icon name={item.icon} size={26} />
                  </div>
                  <span className="store-quick-nav-label">{item.label}</span>
                </Tag>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Ví Mã Giảm Giá Chớp Nhoáng ngay dưới cụm Banner */}
      {(vouchersLoading || activeVouchers.length > 0) && (
        <section id="home-vouchers" className="store-voucher-section">
          <div className="container">
            <div className="store-voucher-header">
              <span className="store-voucher-header-icon">
                <Icon name="tag" size={24} />
              </span>
              <h2 className="store-voucher-header-title">Mã Giảm Giá Chớp Nhoáng</h2>
            </div>

            {vouchersLoading ? (
              <VoucherStripSkeleton count={4} />
            ) : (
              <div className="store-voucher-grid">
                {activeVouchers.slice(0, 4).map((v) => {
                  const isSaved = isVoucherSaved(v.code);
                  return (
                    <div key={v.id} className="store-ticket-card">
                      <div className="store-ticket-dots" aria-hidden="true">
                        {[0, 1, 2, 3, 4, 5].map((dot) => (
                          <span key={dot} className="store-ticket-dot" />
                        ))}
                      </div>

                      <div className="store-ticket-stub">
                        <span>{v.type === 'percent' ? 'GIẢM GIÁ %' : 'GIẢM TIỀN'}</span>
                      </div>

                      <div className="store-ticket-body">
                        <h4 className="store-ticket-title">
                          {v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${formatPrice(v.value)}`}
                        </h4>
                        <p className="store-ticket-code">{v.code}</p>
                        <p className="store-ticket-desc">
                          {v.description || `Đơn tối thiểu ${formatPrice(v.minOrderAmount)}`}
                        </p>

                        <div className="store-ticket-foot">
                          <span className="store-ticket-exp">HSD: {v.endDate || '2026-12-31'}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyVoucher(v.code)}
                            className={`store-ticket-btn${isSaved ? ' is-saved' : ''}`}
                          >
                            {isSaved ? (
                              <>
                                <Icon name="check" size={12} />
                                <span>Đã Lưu</span>
                              </>
                            ) : (
                              'Lưu Mã'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Danh mục */}
      {(loading || categories.length > 0) && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <h2 className="section-title">Khám phá theo danh mục</h2>
                <p className="section-subtitle">Chọn lĩnh vực bạn quan tâm để bắt đầu.</p>
              </div>
            </div>
            {loading ? (
              <CategoryGridSkeleton count={6} />
            ) : (
              <div className="category-grid">
                {categories.map((category, index) => (
                  <Link key={category.id} to={`/courses?categoryId=${category.id}`} className="category-tile">
                    <span className="category-tile-icon" style={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}>
                      <Icon name={CATEGORY_ICONS[index % CATEGORY_ICONS.length]} size={22} />
                    </span>
                    <div>
                      <div className="category-tile-name">{category.name}</div>
                      <div className="category-tile-count">Xem khóa học</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Khóa học mới nhất */}
      <section id="featured-courses" className={`section${loading || categories.length > 0 ? ' section-flush-top' : ''}`}>
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Khóa học mới nhất</h2>
              <p className="section-subtitle">Những khóa học vừa được xuất bản trên {SITE.name}.</p>
            </div>
            {courses.length > 0 && <Button variant="ghost" to="/courses">Xem tất cả <Icon name="arrowRight" size={16} /></Button>}
          </div>

          {loading ? (
            <CourseGridSkeleton count={FEATURED_COUNT} />
          ) : error ? (
            <Alert variant="error">{error}</Alert>
          ) : courses.length === 0 ? (
            <EmptyState icon="book" title="Chưa có khóa học nào" description="Các khóa học sẽ xuất hiện ở đây ngay khi được xuất bản." />
          ) : (
            <div className="course-grid">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  to={`/courses/${course.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lợi ích */}
      <section className="section section-surface">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Vì sao chọn {SITE.name}?</h2>
              <p className="section-subtitle">Mọi thứ bạn cần để học hiệu quả, ở cùng một nơi.</p>
            </div>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card feature-item">
                <div className="feature-icon"><Icon name={feature.icon} size={24} /></div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="section section-flush-bottom">
          <div className="container">
            <div className="cta-band">
              <div>
                <h2 className="cta-title">Sẵn sàng bắt đầu?</h2>
                <p className="cta-text">Tạo tài khoản miễn phí và đăng ký khóa học đầu tiên ngay hôm nay.</p>
              </div>
              <Button variant="white" size="lg" to="/register">Tạo tài khoản</Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
