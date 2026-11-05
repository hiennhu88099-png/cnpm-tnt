import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { shopApi } from '../api/shopApi';
import useApiQuery from '../hooks/useApiQuery';
import { Alert, Button, EmptyState, Icon, PageLoading } from '../components/ui';
import { levelLabel } from '../config/course';
import { formatPrice } from '../utils/format';
import { computeVoucherDiscount, removeMultipleFromCart, useShopStore } from '../utils/shopStore';

function createOrderCode() {
  return `EDU${Date.now().toString().slice(-6)}`;
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const singleCourseId = searchParams.get('courseId');
  const multiCourseIdsParam = searchParams.get('courseIds');
  const mode = searchParams.get('mode');
  const navigate = useNavigate();

  const { cart, activeVouchers, isVoucherSaved } = useShopStore();

  const targetIds = singleCourseId
    ? [Number(singleCourseId)]
    : multiCourseIdsParam
      ? multiCourseIdsParam
          .split(',')
          .map((x) => Number(x.trim()))
          .filter(Boolean)
      : mode === 'cart'
        ? cart.map((c) => Number(c.id))
        : [];

  const targetKey = targetIds.join(',');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [enrolledIds, setEnrolledIds] = useState([]);

  const fetchSelectedCourses = useCallback(async () => {
    if (!targetKey) return [];
    const ids = targetKey.split(',').map(Number).filter(Boolean);
    const results = await Promise.all(
      ids.map((id) => courseApi.getCourseById(id).catch(() => null)),
    );
    return results.filter(Boolean);
  }, [targetKey]);

  const { data: coursesData, error, loading } = useApiQuery(fetchSelectedCourses);
  const courses = coursesData ?? [];

  useEffect(() => {
    if (!targetKey) return;
    let active = true;
    enrollmentApi
      .getMyCourses()
      .then((list) => {
        if (!active) return;
        const items = Array.isArray(list) ? list : list?.content ?? [];
        const owned = items.map((item) => Number(item.courseId));
        setEnrolledIds(owned);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [targetKey]);

  if (targetIds.length === 0) {
    return (
      <div className="container section">
        <EmptyState
          icon="shoppingBag"
          title="Chưa chọn khóa học để thanh toán"
          description="Hãy chọn khóa học trong danh mục hoặc kiểm tra giỏ hàng của bạn để tiến hành đăng ký."
          action={<Button to="/courses">Khám phá khóa học</Button>}
        />
      </div>
    );
  }

  if (loading) return <PageLoading text="Đang chuẩn bị trang thanh toán..." />;

  if (error || courses.length === 0) {
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

  const unownedCourses = courses.filter((c) => !enrolledIds.includes(Number(c.id)));
  const allAlreadyEnrolled = unownedCourses.length === 0;
  const activeCoursesForOrder = allAlreadyEnrolled ? courses : unownedCourses;

  const subtotal = activeCoursesForOrder.reduce(
    (sum, c) => sum + Math.max(0, Number(c.price) || 0),
    0,
  );
  const discountAmount = computeVoucherDiscount(appliedCoupon, subtotal);
  const total = Math.max(0, subtotal - discountAmount);

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
    const found = activeVouchers.find((v) => v.code === trimmed);
    if (!found) {
      setCouponError('Mã giảm giá không hợp lệ, đã tạm dừng hoặc đã hết hạn.');
      return;
    }
    if (subtotal < found.minOrderAmount) {
      setCouponError(`Đơn hàng cần tối thiểu ${formatPrice(found.minOrderAmount)} để áp dụng mã này.`);
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

    if (allAlreadyEnrolled) {
      navigate(`/learning/${courses[0].id}`);
      return;
    }

    const orderIds = activeCoursesForOrder.map((c) => c.id);
    const orderIdsParam = orderIds.join(',');
    const primaryId = orderIds[0];
    const orderCode = createOrderCode();

    if (total === 0) {
      setIsProcessing(true);
      try {
        await shopApi.checkoutOrder({
          orderCode,
          courseIds: orderIds,
          subtotalAmount: subtotal,
          discountAmount,
          finalAmount: 0,
          voucherCode: appliedCoupon?.code || '',
          paymentMethod: 'FREE',
        });
        removeMultipleFromCart(orderIds);
        navigate(
          `/checkout/success?courseId=${primaryId}&courseIds=${orderIdsParam}&amount=0&method=FREE&code=${orderCode}`,
        );
      } catch (err) {
        setSubmitError(err.response?.data?.message || 'Không thể xử lý đăng ký khóa học.');
        setIsProcessing(false);
      }
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      navigate(
        `/payment/sepay?courseId=${primaryId}&courseIds=${orderIdsParam}&subtotal=${subtotal}&amount=${total}&discount=${discountAmount}&coupon=${
          appliedCoupon?.code || ''
        }&ref=${orderCode}`,
      );
    }, 350);
  }

  const firstCourse = courses[0];

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
          {courses.length > 1 ? (
            <Link to="/cart">Giỏ hàng ({courses.length} khóa học)</Link>
          ) : (
            <Link to={`/courses/${firstCourse.id}`}>{firstCourse.title}</Link>
          )}
          <span className="checkout-breadcrumb-sep" aria-hidden="true">/</span>
          <span className="checkout-breadcrumb-current">Thanh toán</span>
        </nav>

        <h1 className="checkout-main-title">Thanh toán</h1>

        {allAlreadyEnrolled && (
          <div style={{ marginBottom: '24px' }}>
            <Alert variant="success" title="Bạn đã sở hữu khóa học này">
              Tài khoản của bạn đã được kích hoạt khóa học. Bạn có thể vào học ngay mà không cần thanh toán lại.
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
                      Chọn ({activeVouchers.length})
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
                {allAlreadyEnrolled
                  ? 'Vào học ngay'
                  : `Xác nhận thanh toán (${activeCoursesForOrder.length} khóa) — ${formatPrice(total)}`}
              </span>
              <Icon name="arrowRight" size={22} />
            </button>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="checkout-right">
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-title">
                Thông tin đơn hàng ({activeCoursesForOrder.length})
              </h2>

              <div className="checkout-course-list">
                {activeCoursesForOrder.map((course) => {
                  const lessonsCount = course.lessons?.length ?? course.lessonCount ?? 0;
                  const cPrice = Math.max(0, Number(course.price) || 0);
                  return (
                    <div key={course.id} className="checkout-course-item">
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
                          <span className="checkout-course-price">{formatPrice(cPrice)}</span>
                          {Number(course.originalPrice) > cPrice && (
                            <span className="checkout-course-price-old">
                              {formatPrice(course.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-summary-Totals">
                <div className="checkout-summary-row">
                  <span>Tạm tính ({activeCoursesForOrder.length} khóa học)</span>
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

      {/* Coupon Modal */}
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
                <p className="voucher-modal-sub">Chọn ưu đãi tốt nhất cho đơn hàng khóa học</p>
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
              {[...activeVouchers]
                .sort((a, b) => Number(isVoucherSaved(b.code)) - Number(isVoucherSaved(a.code)))
                .map((v) => {
                  const isEligible = subtotal >= v.minOrderAmount;
                  const isSelected = appliedCoupon?.code === v.code;
                  const isSaved = isVoucherSaved(v.code);

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
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <span className="voucher-item-code">{v.code}</span>
                              {isSaved && (
                                <span
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    color: '#047857',
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  Đã lưu
                                </span>
                              )}
                            </div>
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
