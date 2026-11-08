import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { shopApi } from '../api/shopApi';
import useApiQuery from '../hooks/useApiQuery';
import { Alert, Button, EmptyState, Icon } from '../components/ui';
import { formatPrice } from '../utils/format';
import { removeMultipleFromCart } from '../utils/shopStore';

const FALLBACK_BANK_INFO = {
  bankCode: 'MB',
  bankName: 'MB Bank (Ngân hàng Quân Đội)',
  accountNumber: '0000012345678',
  accountHolder: 'EDUHUB ACADEMY',
  transferPrefix: 'EDUHUB',
};

function CopyRow({ label, value, mono = false }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="sepay-copy-row">
      <div className="sepay-copy-meta">
        <div className="sepay-copy-label">{label}</div>
        <div className={`sepay-copy-value${mono ? ' is-mono' : ''}`}>{value}</div>
      </div>
      <button type="button" onClick={handleCopy} className={`sepay-copy-btn${copied ? ' is-copied' : ''}`}>
        {copied ? (
          <>
            <Icon name="check" size={14} />
            <span>Đã chép</span>
          </>
        ) : (
          <>
            <Icon name="copy" size={14} />
            <span>Sao chép</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function SePayPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const courseId = searchParams.get('courseId');
  const courseIdsParam = searchParams.get('courseIds');
  const subtotalParam = searchParams.get('subtotal');
  const discountParam = searchParams.get('discount');
  const couponParam = searchParams.get('coupon');
  const amountParam = searchParams.get('amount');
  const refParam = searchParams.get('ref');

  const targetIds = courseIdsParam
    ? courseIdsParam
        .split(',')
        .map((x) => Number(x.trim()))
        .filter(Boolean)
    : courseId
      ? [Number(courseId)]
      : [];
  const targetKey = targetIds.join(',');
  const primaryId = targetIds[0] || courseId;

  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [status, setStatus] = useState('WAITING'); // WAITING | COMPLETED | EXPIRED
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bankInfo, setBankInfo] = useState(FALLBACK_BANK_INFO);

  const fetchCourse = useCallback(() => {
    if (!primaryId) return Promise.resolve(null);
    return courseApi.getCourseById(primaryId);
  }, [primaryId]);

  const { data: course } = useApiQuery(fetchCourse);

  const amount = Math.max(0, Number(amountParam ?? course?.price ?? 0));
  const refCode = (refParam || `EDU${primaryId}`).toUpperCase();
  const prefix = bankInfo.transferPrefix || 'EDUHUB';
  const transferContent = `${prefix} KH${primaryId} ${refCode}`;
  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber}-compact2.png?amount=${Math.round(
    amount,
  )}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountHolder)}`;

  // 1. Tải cấu hình tài khoản ngân hàng từ Backend (application.properties / .env)
  useEffect(() => {
    let active = true;
    shopApi
      .getPaymentConfig()
      .then((cfg) => {
        if (!active || !cfg) return;
        setBankInfo({
          bankCode: cfg.bankCode || FALLBACK_BANK_INFO.bankCode,
          bankName: cfg.bankName || FALLBACK_BANK_INFO.bankName,
          accountNumber: cfg.accountNumber || FALLBACK_BANK_INFO.accountNumber,
          accountHolder: cfg.accountHolder || FALLBACK_BANK_INFO.accountHolder,
          transferPrefix: cfg.transferPrefix || FALLBACK_BANK_INFO.transferPrefix,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 2. Khởi tạo đơn hàng ở trạng thái PENDING để sẵn sàng đối soát tự động qua Webhook
  useEffect(() => {
    if (!targetKey || !refCode || amount <= 0) return;
    const ids = targetKey.split(',').map(Number).filter(Boolean);
    shopApi
      .createPendingOrder({
        orderCode: refCode,
        courseIds: ids,
        subtotalAmount: Number(subtotalParam ?? amount),
        discountAmount: Number(discountParam ?? 0),
        finalAmount: amount,
        voucherCode: couponParam || '',
        paymentMethod: 'SEPAY',
      })
      .catch(() => {});
  }, [targetKey, refCode, amount, subtotalParam, discountParam, couponParam]);

  // 3. Tự động kiểm tra trạng thái đơn hàng mỗi 2 giây (tự kích hoạt khóa học ngay khi nhận được tiền)
  useEffect(() => {
    if (status !== 'WAITING' || !refCode || !targetKey) return undefined;
    const poll = setInterval(() => {
      shopApi
        .getOrderStatus(refCode)
        .then((order) => {
          if (order?.status === 'COMPLETED') {
            const ids = targetKey.split(',').map(Number).filter(Boolean);
            removeMultipleFromCart(ids);
            setStatus('COMPLETED');
            setTimeout(() => {
              navigate(
                `/checkout/success?courseId=${primaryId}&courseIds=${targetKey}&orderId=${order.id || ''}&amount=${amount}&method=SEPAY&code=${refCode}`,
              );
            }, 900);
          } else if (order?.status === 'CANCELLED') {
            setStatus('EXPIRED');
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(poll);
  }, [status, refCode, targetKey, primaryId, amount, navigate]);

  useEffect(() => {
    if (status !== 'WAITING') return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setStatus('EXPIRED');
          if (refCode) {
            shopApi.cancelOrder(refCode).catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, refCode]);

  if (!primaryId) {
    return (
      <div className="container section">
        <EmptyState
          icon="qrCode"
          title="Không tìm thấy giao dịch"
          description="Phiên thanh toán không hợp lệ hoặc thiếu mã khóa học."
          action={<Button to="/courses">Quay lại danh sách khóa học</Button>}
        />
      </div>
    );
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  async function handleConfirmTransfer() {
    setConfirming(true);
    setErrorMsg('');
    try {
      const savedOrder = await shopApi.checkoutOrder({
        orderCode: refCode,
        courseIds: targetIds,
        subtotalAmount: Number(subtotalParam ?? amount),
        discountAmount: Number(discountParam ?? 0),
        finalAmount: amount,
        voucherCode: couponParam || '',
        paymentMethod: 'SEPAY',
      });

      removeMultipleFromCart(targetIds);
      setStatus('COMPLETED');
      setTimeout(() => {
        navigate(
          `/checkout/success?courseId=${primaryId}&courseIds=${targetKey}&orderId=${savedOrder?.id || ''}&amount=${amount}&method=SEPAY&code=${refCode}`,
        );
      }, 900);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể xác nhận thanh toán lúc này. Vui lòng thử lại.');
      setConfirming(false);
    }
  }

  return (
    <div className="sepay-page-wrap">
      <div className="container sepay-container">
        {course && (
          <div className="sepay-course-banner">
            <span className="sepay-course-badge">VietQR 24/7</span>
            <span className="sepay-course-name">
              {targetIds.length > 1
                ? `${course.title} (+${targetIds.length - 1} khóa học khác)`
                : course.title}
            </span>
          </div>
        )}

        <Alert variant="error">{errorMsg}</Alert>

        <div className="sepay-grid">
          {/* Left Column: QR & Live Status */}
          <div className="sepay-qr-card">
            <div className="sepay-qr-frame">
              {status === 'WAITING' && <img src={qrUrl} alt="Mã VietQR thanh toán" className="sepay-qr-img" />}

              {status === 'COMPLETED' && (
                <div className="sepay-qr-state is-success">
                  <Icon name="checkCircle" size={64} />
                  <p>Đã nhận thanh toán!</p>
                </div>
              )}

              {status === 'EXPIRED' && (
                <div className="sepay-qr-state is-expired">
                  <Icon name="xCircle" size={56} />
                  <p>Mã QR đã hết hạn</p>
                </div>
              )}
            </div>

            <div className="sepay-status-bar">
              {status === 'WAITING' && (
                <div className="sepay-status-waiting">
                  <span className="sepay-spinner" />
                  <span>
                    Đang chờ tiền về · <strong>{minutes}:{seconds}</strong>
                  </span>
                </div>
              )}
              {status === 'COMPLETED' && (
                <div className="sepay-status-done">Đang mở khóa bài học và chuyển hướng...</div>
              )}
              {status === 'EXPIRED' && (
                <button
                  type="button"
                  onClick={() => {
                    if (targetKey && refCode && amount > 0) {
                      const ids = targetKey.split(',').map(Number).filter(Boolean);
                      shopApi
                        .createPendingOrder({
                          orderCode: refCode,
                          courseIds: ids,
                          subtotalAmount: Number(subtotalParam ?? amount),
                          discountAmount: Number(discountParam ?? 0),
                          finalAmount: amount,
                          voucherCode: couponParam || '',
                          paymentMethod: 'SEPAY',
                        })
                        .catch(() => {});
                    }
                    setSecondsLeft(15 * 60);
                    setStatus('WAITING');
                  }}
                  className="sepay-refresh-btn"
                >
                  Tạo lại mã QR mới
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Bank Transfer Details */}
          <div className="sepay-info-card">
            <div>
              <div className="sepay-amount-box">
                <div className="sepay-amount-label">Số tiền cần chuyển</div>
                <div className="sepay-amount-value">{formatPrice(amount)}</div>
              </div>

              <div className="sepay-copy-list">
                <CopyRow label="Ngân hàng" value={bankInfo.bankName} />
                <CopyRow label="Số tài khoản" value={bankInfo.accountNumber} mono />
                <CopyRow label="Chủ tài khoản" value={bankInfo.accountHolder} />
                <CopyRow label="Nội dung chuyển khoản" value={transferContent} mono />
              </div>
            </div>

            <div className="sepay-bottom-stack">
              <div className="sepay-warning-box">
                <Icon name="shieldCheck" size={18} className="sepay-warning-icon" />
                <p>
                  Giữ nguyên nội dung <strong>{transferContent}</strong> khi chuyển khoản để hệ thống tự động kích hoạt
                  khóa học ngay lập tức.
                </p>
              </div>

              {status === 'WAITING' && (
                <div className="sepay-actions">
                  {/* Khung trạng thái Tự động kích hoạt khi nhận tiền qua VietQR */}
                  <div className="sepay-auto-listen-card">
                    <div className="sepay-auto-listen-header">
                      <span className="sepay-live-dot" />
                      <span className="sepay-auto-listen-title">Tự động kích hoạt sau khi quét mã</span>
                    </div>
                    <p className="sepay-auto-listen-desc">
                      Sau khi bạn quét mã QR và chuyển khoản thành công, hệ thống sẽ <strong>tự động mở khóa khóa học ngay lập tức</strong> mà không cần bạn phải bấm bất kỳ nút xác nhận nào.
                    </p>
                    <div className="sepay-auto-listen-indicator">
                      <span className="sepay-spinner" />
                      <span>Hệ thống đang tự động lắng nghe giao dịch thời gian thực...</span>
                    </div>
                  </div>

                  {/* Nút hỗ trợ mô phỏng dành cho Demo / Kiểm thử khi chạy localhost */}
                  <div className="sepay-demo-hint-box">
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={handleConfirmTransfer}
                      className="sepay-demo-btn"
                      title="Sử dụng khi thuyết trình / chấm điểm trên máy local không có kết nối webhook từ Internet"
                    >
                      <Icon name="zap" size={14} />
                      <span>{confirming ? 'Đang mô phỏng giao dịch...' : '⚡ Mô phỏng chuyển tiền thành công (Dành cho Test / Demo)'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => setShowCancelModal(true)}
                    className="sepay-cancel-btn"
                  >
                    Hủy thanh toán &amp; đơn hàng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          className="voucher-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Hủy thanh toán"
          onClick={() => setShowCancelModal(false)}
        >
          <div className="sepay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sepay-modal-icon">
              <Icon name="warning" size={28} />
            </div>
            <h3 className="sepay-modal-title">Hủy thanh toán?</h3>
            <p className="sepay-modal-desc">
              Phiên thanh toán QR cho đơn hàng này sẽ bị hủy. Bạn có thể đăng ký lại bất cứ lúc nào.
            </p>
            <div className="sepay-modal-actions">
              <button type="button" onClick={() => setShowCancelModal(false)} className="sepay-modal-keep">
                Giữ lại
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (refCode) {
                    await shopApi.cancelOrder(refCode).catch(() => {});
                  }
                  navigate(
                    targetIds.length > 1
                      ? `/checkout?mode=cart&courseIds=${targetKey}`
                      : `/checkout?courseId=${primaryId}`,
                  );
                }}
                className="sepay-modal-confirm-cancel"
              >
                Hủy ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
