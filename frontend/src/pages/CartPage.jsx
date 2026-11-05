import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, Icon, PageHeader } from '../components/ui';
import { levelLabel } from '../config/course';
import { formatPrice } from '../utils/format';
import { useShopStore } from '../utils/shopStore';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart, toggleWishlist, isInWishlist } = useShopStore();

  const subtotal = cart.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0), 0);
  const originalSubtotal = cart.reduce(
    (sum, item) => sum + Math.max(Number(item.originalPrice) || 0, Number(item.price) || 0),
    0,
  );
  const savedFromOriginal = Math.max(0, originalSubtotal - subtotal);

  function handleProceedCheckout() {
    if (cart.length === 0) return;
    if (cart.length === 1) {
      navigate(`/checkout?courseId=${cart[0].id}`);
      return;
    }
    const ids = cart.map((c) => c.id).join(',');
    navigate(`/checkout?mode=cart&courseIds=${ids}`);
  }

  return (
    <div className="container section">
      <PageHeader
        eyebrow="Thanh toán"
        title="Giỏ hàng khóa học"
        subtitle="Gộp nhiều khóa học yêu thích và áp dụng mã giảm giá Combo trong một lần thanh toán."
        actions={
          cart.length > 0 ? (
            <Button variant="ghost" onClick={clearCart}>
              <Icon name="trash" size={16} /> Xóa toàn bộ giỏ hàng
            </Button>
          ) : null
        }
      />

      {cart.length === 0 ? (
        <EmptyState
          icon="shoppingCart"
          title="Giỏ hàng của bạn đang trống"
          description="Hãy chọn các khóa học bạn muốn trang bị kỹ năng và thêm vào giỏ để thanh toán cùng lúc."
          action={<Button to="/courses">Tìm khóa học ngay</Button>}
        />
      ) : (
        <div className="cart-layout">
          {/* Danh sách khóa học trong giỏ */}
          <div className="cart-items-col">
            <div className="cart-count-bar">
              <strong>{cart.length} khóa học trong giỏ hàng</strong>
              <Link to="/courses" className="text-link">
                + Chọn thêm khóa học khác
              </Link>
            </div>

            <div className="cart-list">
              {cart.map((item) => {
                const wishlisted = isInWishlist(item.id);
                return (
                  <div key={item.id} className="cart-item-card">
                    <Link to={`/courses/${item.id}`} className="cart-item-thumb">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} />
                      ) : (
                        <Icon name="book" size={28} />
                      )}
                    </Link>

                    <div className="cart-item-body">
                      <div className="cart-item-top">
                        <div>
                          {item.categoryName && (
                            <span className="cart-item-cat">{item.categoryName}</span>
                          )}
                          <Link to={`/courses/${item.id}`} className="cart-item-title">
                            {item.title}
                          </Link>
                        </div>

                        <div className="cart-item-prices">
                          <span className="cart-item-price">{formatPrice(item.price)}</span>
                          {Number(item.originalPrice) > Number(item.price) && (
                            <span className="cart-item-old-price">
                              {formatPrice(item.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="cart-item-meta">
                        {item.instructorName && <span>GV: {item.instructorName}</span>}
                        {item.level && <span>{levelLabel(item.level)}</span>}
                        {item.lessonCount != null && <span>{item.lessonCount} bài học</span>}
                      </div>

                      <div className="cart-item-actions">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(item)}
                          className="cart-item-action-btn"
                        >
                          <Icon
                            name="heart"
                            size={14}
                            fill={wishlisted ? 'currentColor' : 'none'}
                          />
                          <span>{wishlisted ? 'Đã lưu yêu thích' : 'Lưu vào yêu thích'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="cart-item-action-btn is-danger"
                        >
                          <Icon name="trash" size={14} />
                          <span>Xóa khỏi giỏ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột tóm tắt thanh toán */}
          <aside className="cart-summary-col">
            <div className="checkout-summary-card">
              <h2 className="checkout-summary-title">Tóm tắt đơn hàng</h2>

              <div className="checkout-summary-Totals">
                <div className="checkout-summary-row">
                  <span>Số lượng khóa học</span>
                  <strong>{cart.length} khóa học</strong>
                </div>

                {savedFromOriginal > 0 && (
                  <div className="checkout-summary-row is-discount">
                    <span>Tiết kiệm từ giá gốc</span>
                    <strong>-{formatPrice(savedFromOriginal)}</strong>
                  </div>
                )}

                <div className="checkout-summary-row">
                  <span>Mã ưu đãi Combo</span>
                  <strong className="is-free-badge">ÁP DỤNG Ở BƯỚC SAU</strong>
                </div>

                <div className="checkout-summary-total-row">
                  <span>Tạm tính</span>
                  <span className="checkout-summary-total-price">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedCheckout}
                className="checkout-submit-btn"
                style={{ width: '100%', marginTop: '20px' }}
              >
                <span>Tiến hành thanh toán ({cart.length})</span>
                <Icon name="arrowRight" size={20} />
              </button>

              <p className="cart-summary-note">
                <Icon name="shieldCheck" size={15} />
                <span>Kích hoạt toàn bộ khóa học tự động ngay sau khi quét mã VietQR.</span>
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

