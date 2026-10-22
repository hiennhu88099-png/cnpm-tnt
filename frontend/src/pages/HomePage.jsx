import { useAuth } from '../auth/useAuth';
import { Button, CourseCard, Icon, ProgressBar } from '../components/ui';
import { SITE } from '../config/site';
// TODO(TV2): thay dữ liệu mẫu bằng courseApi.getCategories() / courseApi.getAllCourses()
import { MOCK_CATEGORIES, MOCK_COURSES } from '../data/mockData';

const CATEGORY_COLORS = [
  { background: '#eef2ff', color: '#4f46e5' },
  { background: '#f5f3ff', color: '#7c3aed' },
  { background: '#ecfeff', color: '#0891b2' },
  { background: '#fdf2f8', color: '#db2777' },
  { background: '#fffbeb', color: '#d97706' },
  { background: '#f0fdf4', color: '#16a34a' },
];

const FEATURES = [
  { icon: 'clock', title: 'Học theo nhịp của bạn', desc: 'Truy cập bài giảng mọi lúc, xem lại bao nhiêu lần tùy thích trên mọi thiết bị.' },
  { icon: 'chart', title: 'Theo dõi tiến độ', desc: 'Đánh dấu bài đã học và biết chính xác mình đã hoàn thành bao nhiêu phần trăm khóa học.' },
  { icon: 'users', title: 'Đánh giá minh bạch', desc: 'Xem nhận xét thật từ học viên trước khi đăng ký, và chia sẻ cảm nhận của bạn sau khi học.' },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge badge-primary">
              <Icon name="graduation" size={14} /> {SITE.tagline}
            </span>
            <h1 className="hero-title">
              Học kỹ năng mới, <span className="hero-title-highlight">mở lối sự nghiệp</span>
            </h1>
            <p className="hero-desc">{SITE.description}</p>

            <div className="hero-actions">
              {isAuthenticated ? (
                <Button size="lg" to="/profile">
                  Xin chào, {user.fullName.split(' ').pop()} <Icon name="arrowRight" size={18} />
                </Button>
              ) : (
                <Button size="lg" to="/register">
                  Bắt đầu miễn phí <Icon name="arrowRight" size={18} />
                </Button>
              )}
              <a href="#featured-courses" className="btn btn-secondary btn-lg">Xem khóa học</a>
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">100%</div>
                <div className="hero-stat-label">Học trực tuyến</div>
              </div>
              <div>
                <div className="hero-stat-value">24/7</div>
                <div className="hero-stat-label">Truy cập bài giảng</div>
              </div>
              <div>
                <div className="hero-stat-value">0đ</div>
                <div className="hero-stat-label">Phí đăng ký tài khoản</div>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-preview">
              <div className="hero-preview-thumb">
                <span className="hero-preview-play"><Icon name="play" size={24} fill="currentColor" /></span>
              </div>
              <div className="hero-preview-body">
                <div className="hero-preview-title">{MOCK_COURSES[0].title}</div>
                <ProgressBar value={68} label={false} />
                <div className="hero-preview-meta">
                  <span>Bài 33 / {MOCK_COURSES[0].lessonCount}</span>
                  <span>68% hoàn thành</span>
                </div>
              </div>
            </div>

            <div className="hero-chip top">
              <span className="hero-chip-icon" style={CATEGORY_COLORS[5]}><Icon name="checkCircle" size={18} /></span>
              <div><strong>Hoàn thành bài 32</strong><span>Vừa xong</span></div>
            </div>
            <div className="hero-chip bottom">
              <span className="hero-chip-icon" style={CATEGORY_COLORS[4]}><Icon name="star" size={18} fill="currentColor" /></span>
              <div><strong>4.8 / 5</strong><span>Đánh giá trung bình</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Danh mục */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Khám phá theo danh mục</h2>
              <p className="section-subtitle">Chọn lĩnh vực bạn quan tâm để bắt đầu.</p>
            </div>
          </div>
          <div className="category-grid">
            {MOCK_CATEGORIES.map((category, index) => (
              <div key={category.id} className="category-tile">
                <span className="category-tile-icon" style={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}>
                  <Icon name={category.icon} size={22} />
                </span>
                <div>
                  <div className="category-tile-name">{category.name}</div>
                  <div className="category-tile-count">{category.courseCount} khóa học</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Khóa học nổi bật */}
      <section id="featured-courses" className="section section-flush-top">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">Khóa học nổi bật</h2>
              <p className="section-subtitle">Được học viên đánh giá cao trong tháng này.</p>
            </div>
          </div>
          <div className="course-grid">
            {MOCK_COURSES.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
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
