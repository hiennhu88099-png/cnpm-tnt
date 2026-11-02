import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import useApiQuery from '../hooks/useApiQuery';
import { Alert, Button, EmptyState, Icon, PageLoading } from '../components/ui';
import { levelLabel } from '../config/course';
import { formatPrice } from '../utils/format';

const AVAILABLE_VOUCHERS = [
  {
    id: 'v1',
    code: 'NEWSTUDENT',
    type: 'percent',
    value: 20,
    maxDiscount: 100000,
    minOrderAmount: 0,
    description: 'Ưu đãi 20% (tối đa 100K) dành cho học viên đăng ký khóa học mới',
    endDate: '2026-12-31',
  },
  {
    id: 'v2',
    code: 'EDUHUB50',
    type: 'fixed',
    value: 50000,
    minOrderAmount: 150000,
    description: 'Giảm trực tiếp 50.000đ cho khóa học từ 150.000đ',
    endDate: '2026-12-31',
  },
  {
    id: 'v3',
    code: 'FULLSTACK100',
    type: 'fixed',
    value: 100000,
    minOrderAmount: 400000,
    description: 'Giảm 100.000đ cho các khóa học chuyên sâu từ 400.000đ',
    endDate: '2026-12-31',
  },
];

function computeDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === 'percent') {
    const raw = Math.round((subtotal * coupon.value) / 100);
    return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  }
  return Math.min(coupon.value, subtotal);
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  const fetchCourse = useCallback(() => {
    if (!courseId) return Promise.resolve(null);
    return courseApi.getCourseById(courseId);
  }, [courseId]);

  const { data: course, error, loading } = useApiQuery(fetchCourse);

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    enrollmentApi
      .getMyCourses()
      .then((list) => {
        if (!active) return;
        const items = Array.isArray(list) ? list : list?.content ?? [];
        const found = items.some((item) => Number(item.courseId) === Number(courseId));
        setAlreadyEnrolled(found);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [courseId]);

  if (!courseId) {
    return (
      <div className="container section">
        <EmptyState
          icon="shoppingBag"
          title="Chưa chọn khóa học để thanh toán"
          description="Hãy chọn một khóa học bạn yêu thích trong danh mục để tiến hành đăng ký."
          action={<Button to="/courses">Khám phá khóa học</Button>}
        />
      </div>
    );
  }

  if (loading) return <PageLoading text="Đang chuẩn bị trang thanh toán..." />;

  if (error || !course) {
    return (
      <div className="container section">
        <EmptyState
          icon="book"
          title="Không tìm thấy khóa học"
          description="Khóa học bạn chọn không tồn tại hoặc tạm ngừng tuyển sinh."
          action={<Button to="/courses">Quay lại danh sách khóa học</Button>}
        />
      </div>
    );
  }

  const subtotal = Math.max(0, Number(course.price) || 0);
  const discountAmount = computeDiscount(appliedCoupon, subtotal);
  const total = Math.max(0, subtotal - discountAmount);
  const lessonsCount = course.lessons?.length ?? course.lessonCount ?? 0;

  function handleSelectVoucher(voucher) {
    setCouponError('');
    if (subtotal < voucher.minOrderAmount) {
      setCouponError(`Đơn tối thiểu ${formatPrice(voucher.minOrderAmount)} để dùng mã ${voucher.code}.`);
      return;
    }
    setAppliedCoupon(voucher);
    setCouponCode(voucher.code);
    setShowCouponModal(false);
  }

  function handleApplyCouponCode() {
    const trimmed = couponCode.trim().toUpperCase();
    if (!trimmed) return;
    setCouponError('');
    const found = AVAILABLE_VOUCHERS.find((v) => v.code === trimmed);
    if (!found) {
      setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      return;
    }
    if (subtotal < found.minOrderAmount) {
      setCouponError(`Khóa học cần tối thiểu ${formatPrice(found.minOrderAmount)} để áp dụng mã này.`);
      return;
    }
    setAppliedCoupon(found);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (alreadyEnrolled) {
      navigate(`/learning/${course.id}`);
      return;
    }

    const orderCode = `EDU${Date.now().toString().slice(-6)}`;

    if (total === 0) {
      setIsProcessing(true);
      try {
        const created = await enrollmentApi.enrollCourse(course.id);
        navigate(
          `/checkout/success?courseId=${course.id}&enrollmentId=${created?.id || ''}&amount=0&method=FREE&code=${orderCode}`
        );
      } catch (err) {
        setSubmitError(err.response?.data?.message || 'Không thể xử lý đăng ký khóa học.');
        setIsProcessing(false);
      }
      return;
    }

    // Chuyển khoản QR SePay / VietQR
    setIsProcessing(true);
    setTimeout(() => {
      navigate(
        `/payment/sepay?courseId=${course.id}&amount=${total}&discount=${discountAmount}&coupon=${
          appliedCoupon?.code || ''
        }&ref=${orderCode}`
      );
    }, 350);
  }

  return (
    <div className="checkout-page-wrap">
      {isProcessing && (
        <div className="checkout-overlay" role="status" aria-live="polite">
          <div className="checkout-overlay-card">
            <div className="checkout-overlay-spinner-wrap">
              <div className="checkout-overlay-spinner" />
              <Icon name="shoppingBag" size={28} className="checkout-overlay-icon" />
            </div>
            <div className="checkout-overlay-title">Đang xử lý đơn hàng</div>
            <p className="checkout-overlay-sub">Vui lòng không tắt trình duyệt...</p>
          </div>
        </div>
      )}

      <div className="container checkout-container">
        <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
          <Link to="/courses">Khóa học</Link>
          <span className="checkout-breadcrumb-sep" aria-hidden="true">/</span>
          <Link to={`/courses/${course.id}`}>{course.title}</Link>
          <span className="checkout-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="checkout-breadcrumb-current">Thanh toán</span>
        </nav>

        <h1 className="checkout-main-title">Thanh toán</h1>

        {alreadyEnrolled && (
          <div style={{ marginBottom: '24px' }}>
            <Alert variant="success" title="Bạn đã sở hữu khóa học này">
              Tài khoản của bạn đã được kích hoạt khóa học <strong>{course.title}</strong>. Bạn có thể vào học ngay mà
              không cần thanh toán lại.
            </Alert>
          </div>
        )}

        <Alert variant="error">{submitError}</Alert>

        <form onSubmit={handleSubmit} className="checkout-layout">
          {/* Left Column */}
          <div className="checkout-left">
            {/* Step 1: Mã giảm giá */}
            <section className="checkout-step-card">
              <h2 className="checkout-step-heading">
                <span className="checkout-step-badge">1</span>
                Mã giảm giá
              </h2>

              <div className="checkout-voucher-bar">
                <div className="checkout-voucher-input-wrap">
                  <Icon name="ticket" size={18} className="checkout-voucher-input-icon" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã voucher (VD: NEWSTUDENT)"
                    disabled={Boolean(appliedCoupon)}
                    className="checkout-voucher-input"
                  />
                </div>

                {!appliedCoupon && (
                  <div className="checkout-voucher-actions">
                    {couponCode.trim() && (
                      <button type="button" onClick={handleApplyCouponCode} className="checkout-btn-apply">
                        Áp dụng
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowCouponModal(true)}
                      className="checkout-btn-choose-voucher"
                    >
                      Chọn
                    </button>
                  </div>
                )}
              </div>

              {couponError && <p className="checkout-coupon-error">{couponError}</p>}

              {appliedCoupon && (
                <div className="checkout-applied-voucher">
                  <div className="checkout-applied-voucher-info">
                    <div className="checkout-applied-voucher-icon">
                      <Icon name="ticket" size={18} />
                    </div>
                    <div>
                      <div className="checkout-applied-voucher-code">{appliedCoupon.code}</div>
                      <div className="checkout-applied-voucher-desc">{appliedCoupon.description}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="checkout-applied-voucher-remove"
                    aria-label="Gỡ mã giảm giá"
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>
              )}
            </section>

            {/* Step 2: Phương thức thanh toán */}
            <section className="checkout-step-card">
              <h2 className="checkout-step-heading">
                <span className="checkout-step-badge">2</span>
                Phương thức thanh toán
              </h2>

              <div className="checkout-methods-grid">
                {/* Chuyển khoản QR SePay */}
                <label className="checkout-method-option is-selected">
                  <div className="checkout-method-left">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="SEPAY"
                      checked
                      readOnly
                      className="checkout-method-radio"
                    />
                    <div className="checkout-method-icon">
                      <Icon name="qrCode" size={24} />
                    </div>
                    <div>
                      <div className="checkout-method-title">Chuyển khoản QR (VietQR)</div>
                      <div className="checkout-method-desc">
                        Quét mã VietQR bằng mọi ứng dụng Ngân hàng, hệ thống tự xác nhận và mở khóa ngay
                      </div>
                    </div>
                  </div>
                  <span className="checkout-method-pill">Tự động 24/7</span>
                </label>
              </div>
            </section>

            {/* Submit Button */}
            <button type="submit" disabled={isProcessing} className="checkout-submit-btn">
              <span>
                {alreadyEnrolled
                  ? 'Vào học ngay'
                  : `Xác nhận thanh toán — ${formatPrice(total)}`}
              </span>
              <Icon name="arrowRight" size={22} />
            </button>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="checkout-right">
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-title">Thông tin đơn hàng</h2>

              <div className="checkout-course-item">
                <div className="checkout-course-thumb">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="checkout-course-thumb-fallback">
                      <Icon name="play" size={24} />
                    </div>
                  )}
                </div>
                <div className="checkout-course-meta">
                  <div className="checkout-course-name">{course.title}</div>
                  <div className="checkout-course-sub">
                    {course.instructorName ? `GV: ${course.instructorName}` : 'EduHub Academy'} ·{' '}
                    {levelLabel(course.level)}
                    {lessonsCount > 0 ? ` · ${lessonsCount} bài học` : ''}
                  </div>
                  <div className="checkout-course-price-row">
                    <span className="checkout-course-price">{formatPrice(subtotal)}</span>
                    {Number(course.originalPrice) > subtotal && (
                      <span className="checkout-course-price-old">{formatPrice(course.originalPrice)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="checkout-summary-Totals">
                <div className="checkout-summary-row">
                  <span>Tạm tính</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                {discountAmount > 0 && (
                  <div className="checkout-summary-row is-discount">
                    <span>Giảm giá ({appliedCoupon?.code})</span>
                    <strong>-{formatPrice(discountAmount)}</strong>
                  </div>
                )}

                <div className="checkout-summary-row">
                  <span>Kích hoạt khóa học</span>
                  <strong className="is-free-badge">TỰ ĐỘNG 24/7</strong>
                </div>

                <div className="checkout-summary-row">
                  <span>Quyền truy cập</span>
                  <strong>TRỌN ĐỜI</strong>
                </div>

                <div className="checkout-summary-total-row">
                  <span>Tổng cộng</span>
                  <span className="checkout-summary-total-price">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>

      {/* Luxury Minimalist Coupon Modal */}
      {showCouponModal && (
        <div
          className="voucher-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Voucher của bạn"
          onClick={() => setShowCouponModal(false)}
        >
          <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <div>
                <h3 className="voucher-modal-title">Voucher của bạn</h3>
                <p className="voucher-modal-sub">Chọn ưu đãi tốt nhất cho khóa học</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="voucher-modal-close"
                aria-label="Đóng"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="voucher-modal-list">
              {AVAILABLE_VOUCHERS.map((v) => {
                const isEligible = subtotal >= v.minOrderAmount;
                const isSelected = appliedCoupon?.code === v.code;

                return (
                  <div
                    key={v.id}
                    onClick={() => isEligible && handleSelectVoucher(v)}
                    className={`voucher-item${isSelected ? ' is-selected' : ''}${!isEligible ? ' is-disabled' : ''}`}
                  >
                    <div className="voucher-item-inner">
                      <div className={`voucher-item-badge${isSelected ? ' is-selected' : ''}`}>
                        <Icon name="ticket" size={22} />
                        <span>{v.type === 'percent' ? `${v.value}%` : `${Math.round(v.value / 1000)}K`}</span>
                      </div>

                      <div className="voucher-item-body">
                        <div className="voucher-item-top">
                          <span className="voucher-item-code">{v.code}</span>
                          {isSelected && (
                            <span className="voucher-item-check">
                              <Icon name="check" size={14} />
                            </span>
                          )}
                        </div>
                        <p className="voucher-item-desc">{v.description}</p>
                        <div className="voucher-item-foot">
                          <span>Đơn tối thiểu: {formatPrice(v.minOrderAmount)}</span>
                          <span>HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {!isEligible && (
                          <div className="voucher-item-ineligible">
                            Cần thêm {formatPrice(v.minOrderAmount - subtotal)} để sử dụng mã này
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="voucher-modal-footer">
              <button type="button" onClick={() => setShowCouponModal(false)} className="voucher-modal-done-btn">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

