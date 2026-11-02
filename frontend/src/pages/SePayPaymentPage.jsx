import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import useApiQuery from '../hooks/useApiQuery';
import { Alert, Button, EmptyState, Icon } from '../components/ui';
import { formatPrice } from '../utils/format';

const BANK_INFO = {
  bankCode: 'MB',
  bankName: 'MB Bank (Ngân hàng Quân Đội)',
  accountNumber: '0000012345678',
  accountHolder: 'EDUHUB ACADEMY',
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
  const amountParam = searchParams.get('amount');
  const refParam = searchParams.get('ref');

  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [status, setStatus] = useState('WAITING'); // WAITING | COMPLETED | EXPIRED
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchCourse = useCallback(() => {
    if (!courseId) return Promise.resolve(null);
    return courseApi.getCourseById(courseId);
  }, [courseId]);

  const { data: course } = useApiQuery(fetchCourse);

  useEffect(() => {
    if (status !== 'WAITING') return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  if (!courseId) {
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

  const amount = Math.max(0, Number(amountParam ?? course?.price ?? 0));
  const refCode = refParam || `EDU${courseId}`;
  const transferContent = `EDUHUB KH${courseId} ${refCode}`;
  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNumber}-compact2.png?amount=${Math.round(
    amount
  )}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_INFO.accountHolder)}`;

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  async function handleConfirmTransfer() {
    setConfirming(true);
    setErrorMsg('');
    try {
      let created = null;
      try {
        created = await enrollmentApi.enrollCourse(courseId);
      } catch (err) {
        // Nếu học viên đã sở hữu khóa học rồi thì vẫn cho qua trang success
        const msg = err.response?.data?.message || '';
        if (!msg.toLowerCase().includes('đã đăng ký') && err.response?.status !== 409 && err.response?.status !== 400) {
          throw err;
        }
      }
      setStatus('COMPLETED');
      setTimeout(() => {
        navigate(
          `/checkout/success?courseId=${courseId}&enrollmentId=${created?.id || ''}&amount=${amount}&method=SEPAY&code=${refCode}`
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
            <span className="sepay-course-badge">VietQR SePay</span>
            <span className="sepay-course-name">{course.title}</span>
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
                <CopyRow label="Ngân hàng" value={BANK_INFO.bankName} />
                <CopyRow label="Số tài khoản" value={BANK_INFO.accountNumber} mono />
                <CopyRow label="Chủ tài khoản" value={BANK_INFO.accountHolder} />
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
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={handleConfirmTransfer}
                    className="sepay-confirm-btn"
                  >
                    <Icon name="checkCircle" size={18} />
                    <span>{confirming ? 'Đang kiểm tra giao dịch...' : 'Tôi đã chuyển khoản (Xác nhận ngay)'}</span>
                  </button>

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
              Phiên thanh toán QR cho khóa học này sẽ bị hủy. Bạn có thể đăng ký lại bất cứ lúc nào.
            </p>
            <div className="sepay-modal-actions">
              <button type="button" onClick={() => setShowCancelModal(false)} className="sepay-modal-keep">
                Giữ lại
              </button>
              <button
                type="button"
                onClick={() => navigate(`/checkout?courseId=${courseId}`)}
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

