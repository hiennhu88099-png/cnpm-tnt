import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { shopApi } from '../api/shopApi';
import { parseApiError } from '../api/apiError';
import { Alert, Badge, Button, Card, EmptyState, Icon, Skeleton } from '../components/ui';
import { formatDate, formatPrice } from '../utils/format';

const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả giao dịch' },
  { id: 'COMPLETED', label: 'Đã hoàn tất' },
  { id: 'PENDING', label: 'Chờ thanh toán' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

function OrderHistorySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-busy="true">
      {[1, 2, 3].map((item) => (
        <Card key={item}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Skeleton width="180px" height="20px" />
            <Skeleton width="110px" height="24px" radius="999px" />
          </div>
          <Skeleton width="75%" height="18px" style={{ marginBottom: '8px' }} />
          <Skeleton width="45%" height="16px" style={{ marginBottom: '16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="140px" height="22px" />
            <Skeleton width="150px" height="36px" radius="8px" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [cancellingCode, setCancellingCode] = useState('');

  useEffect(() => {
    let active = true;

    shopApi
      .getMyOrders()
      .then((data) => {
        if (active) {
          setOrders(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(parseApiError(err).message || 'Không thể tải lịch sử giao dịch.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const pending = orders.filter((o) => o.status === 'PENDING').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;
    const totalSpent = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);

    return { total, completed, pending, cancelled, totalSpent };
  }, [orders]);

  async function handleCancelOrder(orderCode) {
    if (!orderCode || cancellingCode) return;
    setCancellingCode(orderCode);
    setError('');
    try {
      const updated = await shopApi.cancelOrder(orderCode);
      setOrders((prev) =>
        prev.map((item) => (item.orderCode === orderCode ? { ...item, ...updated, status: 'CANCELLED' } : item))
      );
    } catch (err) {
      setError(parseApiError(err).message || 'Không thể hủy đơn hàng này.');
    } finally {
      setCancellingCode('');
    }
  }

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === activeFilter);
  }, [orders, activeFilter]);

  function buildResumePayUrl(order) {
    const params = new URLSearchParams();
    if (order.courseIdsCsv) params.set('courseIds', order.courseIdsCsv);
    if (order.subtotalAmount != null) params.set('subtotal', String(order.subtotalAmount));
    if (order.discountAmount != null) params.set('discount', String(order.discountAmount));
    if (order.voucherCode) params.set('coupon', order.voucherCode);
    if (order.finalAmount != null) params.set('amount', String(order.finalAmount));
    if (order.orderCode) params.set('ref', order.orderCode);
    return `/payment/sepay?${params.toString()}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 4px 0' }}>Lịch sử giao dịch & đơn hàng</h2>
            <p style={{ margin: 0, color: 'var(--color-text-muted, #64748b)', fontSize: '14px' }}>
              Tra cứu biên lai thanh toán VietQR / SePay, mã giảm giá đã áp dụng và trạng thái kích hoạt khóa học.
            </p>
          </div>
          <Button as={Link} to="/courses" variant="secondary" size="sm">
            <Icon name="shoppingBag" size={16} />
            Khám phá thêm khóa học
          </Button>
        </div>

        {/* Thống kê nhanh */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TỔNG ĐƠN HÀNG</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>ĐÃ THANH TOÁN</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
              {stats.completed}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
            }}
          >
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>CHỜ THANH TOÁN</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#92400e', marginTop: '4px' }}>
              {stats.pending}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
            }}
          >
            <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>ĐÃ HỦY</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#991b1b', marginTop: '4px' }}>
              {stats.cancelled}
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
            }}
          >
            <div style={{ fontSize: '12px', color: '#4338ca', fontWeight: 600 }}>TỔNG ĐẦU TƯ HỌC TẬP</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#312e81', marginTop: '4px' }}>
              {formatPrice(stats.totalSpent)}
            </div>
          </div>
        </div>
      </Card>

      {/* Bộ lọc trạng thái */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: isActive ? '1.5px solid var(--color-primary, #4f46e5)' : '1px solid #cbd5e1',
                background: isActive ? 'var(--color-primary, #4f46e5)' : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <OrderHistorySkeleton />
      ) : filteredOrders.length === 0 ? (
        <Card>
          <EmptyState
            icon="wallet"
            title="Chưa có giao dịch nào"
            description="Khi bạn đăng ký khóa học hoặc tạo mã thanh toán VietQR, toàn bộ biên lai giao dịch sẽ hiển thị tại đây."
            action={
              <Button as={Link} to="/courses">
                Khám phá khóa học ngay
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredOrders.map((order) => {
            const isCompleted = order.status === 'COMPLETED';
            const isCancelled = order.status === 'CANCELLED';
            const discount = Number(order.discountAmount || 0);
            const subtotal = Number(order.subtotalAmount || order.finalAmount || 0);
            const finalAmt = Number(order.finalAmount || 0);

            return (
              <Card key={order.id || order.orderCode}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    paddingBottom: '12px',
                    marginBottom: '12px',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '15px',
                        color: '#1e293b',
                        background: '#f1f5f9',
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}
                    >
                      #{order.orderCode}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      • {order.createdAt ? formatDate(order.createdAt) : 'Vừa tạo'}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#475569',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {order.paymentMethod || 'SEPAY / VietQR'}
                    </span>
                  </div>

                  <Badge variant={isCompleted ? 'success' : isCancelled ? 'danger' : 'warning'}>
                    {isCompleted
                      ? '✓ Đã thanh toán & Kích hoạt'
                      : isCancelled
                        ? '✕ Đã hủy giao dịch'
                        : '⏳ Đang chờ thanh toán QR'}
                  </Badge>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    Khóa học trong đơn:
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {order.courseTitles || `Khóa học #${order.courseIdsCsv}`}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '14px',
                    paddingTop: '12px',
                    borderTop: '1px dashed #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'baseline' }}>
                    {discount > 0 && (
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Tạm tính: <del>{formatPrice(subtotal)}</del> • Giảm:{' '}
                        <strong style={{ color: '#16a34a' }}>-{formatPrice(discount)}</strong>
                        {order.voucherCode ? ` (${order.voucherCode})` : ''}
                      </span>
                    )}
                    <span style={{ fontSize: '15px', color: '#0f172a' }}>
                      Thành tiền:{' '}
                      <strong style={{ fontSize: '18px', color: 'var(--color-primary, #4f46e5)' }}>
                        {formatPrice(finalAmt)}
                      </strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isCompleted ? (
                      <Button as={Link} to="/my-courses" size="sm">
                        <Icon name="play" size={15} />
                        Vào học ngay
                      </Button>
                    ) : isCancelled ? (
                      <Button
                        as={Link}
                        to={
                          order.courseIdsCsv && !order.courseIdsCsv.includes(',')
                            ? `/checkout?courseId=${order.courseIdsCsv}`
                            : `/checkout?mode=cart&courseIds=${order.courseIdsCsv || ''}`
                        }
                        variant="secondary"
                        size="sm"
                      >
                        <Icon name="shoppingBag" size={15} />
                        Đăng ký lại
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={cancellingCode === order.orderCode}
                          onClick={() => handleCancelOrder(order.orderCode)}
                        >
                          <Icon name="xCircle" size={15} />
                          {cancellingCode === order.orderCode ? 'Đang hủy...' : 'Hủy đơn'}
                        </Button>
                        <Button as={Link} to={buildResumePayUrl(order)} size="sm">
                          <Icon name="qrCode" size={15} />
                          Tiếp tục thanh toán QR
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

