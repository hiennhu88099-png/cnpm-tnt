import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import useApiQuery from '../hooks/useApiQuery';
import { Icon } from '../components/ui';
import { formatPrice } from '../utils/format';

const METHOD_LABELS = {
  SEPAY: 'Chuyển khoản QR (VietQR)',
  FREE: 'Đăng ký miễn phí',
};

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const courseIdsParam = searchParams.get('courseIds');
  const amountParam = searchParams.get('amount');
  const method = searchParams.get('method') || 'SEPAY';
  const orderCode = searchParams.get('code') || 'EDU8899';

  const targetIds = courseIdsParam
    ? courseIdsParam
        .split(',')
        .map((x) => Number(x.trim()))
        .filter(Boolean)
    : courseId
      ? [Number(courseId)]
      : [];
  const targetKey = targetIds.join(',');

  const fetchCourses = useCallback(async () => {
    if (!targetKey) return [];
    const ids = targetKey.split(',').map(Number).filter(Boolean);
    const list = await Promise.all(ids.map((id) => courseApi.getCourseById(id).catch(() => null)));
    return list.filter(Boolean);
  }, [targetKey]);

  const { data: coursesData } = useApiQuery(fetchCourses);
  const courses = coursesData ?? [];
  const primaryCourse = courses[0];
  const finalAmount = Number(amountParam ?? primaryCourse?.price ?? 0);

  const steps = [
    {
      label: 'Đã xác nhận',
      desc: 'Đơn đăng ký khóa học đã được hệ thống ghi nhận',
      icon: 'package',
      active: true,
    },
    {
      label: 'Thanh toán',
      desc: 'Giao dịch thanh toán thành công và đã đối soát',
      icon: 'zap',
      active: true,
    },
    {
      label: 'Mở khóa bài học',
      desc: 'Toàn bộ video bài giảng đã sẵn sàng trong phòng học',
      icon: 'graduation',
      active: true,
    },
  ];

  return (
    <div className="order-success-wrap">
      <div className="container order-success-container">
        <div className="order-success-hero">
          <div className="order-success-badge">
            <Icon name="checkCircle" size={56} />
          </div>
          <h1 className="order-success-title">Tuyệt vời! Đăng ký thành công</h1>
          <p className="order-success-subtitle">
            Đơn #{orderCode} — {courses.length > 1 ? `${courses.length} khóa học đã sẵn sàng` : 'Khóa học đã sẵn sàng'}
          </p>
        </div>

        <div className="order-success-card">
          <div className="order-success-grid">
            {/* Left Column: Summary */}
            <div className="order-success-summary">
              <div>
                <h3 className="order-success-section-label">Tóm tắt đơn hàng</h3>

                <div className="order-success-rows">
                  {courses.map((course) => (
                    <div key={course.id} className="order-success-course-box">
                      {course.thumbnail && (
                        <img src={course.thumbnail} alt={course.title} className="order-success-course-thumb" />
                      )}
                      <div>
                        <div className="order-success-course-title">{course.title}</div>
                        {course.instructorName && (
                          <div className="order-success-course-sub">Giảng viên: {course.instructorName}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="order-success-row">
                    <span>Mã giao dịch</span>
                    <strong>#{orderCode}</strong>
                  </div>

                  <div className="order-success-row">
                    <span>Phương thức</span>
                    <strong>{METHOD_LABELS[method] || method}</strong>
                  </div>

                  <div className="order-success-row is-total">
                    <span>Tổng cộng</span>
                    <span className="order-success-total-price">{formatPrice(finalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="order-success-auto-box">
                <div className="order-success-auto-title">
                  <Icon name="zap" size={16} />
                  <span>Kích hoạt tự động 24/7</span>
                </div>
                <p>
                  Khóa học đã được thêm vào mục <strong>Khóa học của tôi</strong>. Bạn có thể bắt đầu học ngay trên mọi
                  thiết bị.
                </p>
              </div>
            </div>

            {/* Right Column: Timeline */}
            <div className="order-success-timeline-col">
              <h3 className="order-success-section-label">Tiến độ</h3>
              <div className="order-success-timeline">
                {steps.map((step, index) => (
                  <div key={step.label} className="order-success-step">
                    <div className="order-success-step-icon-col">
                      <div className={`order-success-step-icon${step.active ? ' is-active' : ''}`}>
                        <Icon name={step.icon} size={20} />
                      </div>
                      {index < steps.length - 1 && <div className="order-success-step-line" />}
                    </div>
                    <div className="order-success-step-body">
                      <div className="order-success-step-title">{step.label}</div>
                      <p className="order-success-step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-success-actions">
            <Link to="/" className="order-success-btn is-secondary">
              <Icon name="home" size={18} />
              <span>Về trang chủ</span>
            </Link>

            <Link to="/my-courses" className="order-success-btn is-outline">
              <Icon name="book" size={18} />
              <span>Khóa học của tôi</span>
            </Link>

            {primaryCourse && (
              <Link to={`/learning/${primaryCourse.id}`} className="order-success-btn is-primary">
                <span>Vào học ngay</span>
                <Icon name="arrowRight" size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
