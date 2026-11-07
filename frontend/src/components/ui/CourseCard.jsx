import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import Icon from './Icon';
import { formatPrice } from '../../utils/format';
import { COURSE_LEVEL_LABELS } from '../../config/site';
import { useShopStore } from '../../utils/shopStore';

export default function CourseCard({ course, to, footer }) {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist, isInCart, addToCart } = useShopStore();

  const detailPath = to || `/courses/${course.id}`;
  const price = Number(course.price ?? 0);
  const originalPrice = Number(course.originalPrice ?? 0);
  const isFree = price === 0;
  const hasDiscount = !isFree && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  const showThumb = Boolean(course.thumbnail) && !imgError;
  const wishlisted = isAuthenticated && isInWishlist(course.id);
  const inCart = isInCart(course.id);
  const reviewCount = Number(course.reviewCount || 0);
  const ratingValue = reviewCount > 0 && course.averageRating != null ? Number(course.averageRating) : 0;

  function handleToggleWish(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search || ''}` } });
      return;
    }
    toggleWishlist(course);
  }

  function handleCartAction(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isFree) {
      navigate(detailPath);
      return;
    }
    if (inCart) {
      navigate('/cart');
      return;
    }
    addToCart(course);
  }

  return (
    <article className="course-card">
      <div
        className="course-card-thumb"
        style={showThumb ? undefined : { background: '#f8fafc' }}
      >
        <Link to={detailPath} className="course-card-thumb-link" aria-label={course.title}>
          {showThumb ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="course-card-thumb-fallback">
              <Icon name="book" size={42} strokeWidth={1.6} />
            </span>
          )}
        </Link>

        {/* Cụm nhãn góc trên bên trái */}
        <div className="course-card-badges">
          {hasDiscount && (
            <span className="course-card-badge is-discount">-{discountPercent}%</span>
          )}
          {isFree && <span className="course-card-badge is-free">MIỄN PHÍ</span>}
          {course.categoryName && (
            <span className="course-card-badge is-category">{course.categoryName}</span>
          )}
        </div>

        {/* Nút Yêu thích góc trên bên phải */}
        <button
          type="button"
          onClick={handleToggleWish}
          className={`course-card-wish-btn${wishlisted ? ' is-active' : ''}`}
          aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          title={wishlisted ? 'Bỏ khỏi danh sách yêu thích' : 'Lưu vào danh sách yêu thích'}
        >
          <Icon name="heart" size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Thanh hành động trượt lên khi rê chuột */}
        <div className="course-card-hover-cta">
          <button
            type="button"
            onClick={handleCartAction}
            className={`course-card-hover-btn${inCart ? ' is-in-cart' : ''}`}
          >
            <Icon name={isFree ? 'play' : inCart ? 'check' : 'shoppingBag'} size={14} />
            <span>{isFree ? 'Học miễn phí ngay' : inCart ? 'Đã có trong giỏ' : 'Thêm vào giỏ hàng'}</span>
          </button>
        </div>
      </div>

      <div className="course-card-body">
        <Link to={detailPath} className="course-card-title" title={course.title}>
          {course.title}
        </Link>

        <div className="course-card-subrow">
          {course.instructorName ? (
            <span className="course-card-instructor">
              <Icon name="user" size={13} />
              {course.instructorName}
            </span>
          ) : (
            <span className="course-card-instructor">Giảng viên EduHub</span>
          )}
          {course.level && (
            <span className="course-card-level">
              {COURSE_LEVEL_LABELS[course.level] || course.level}
            </span>
          )}
        </div>

        <div className="course-card-footer">
          {footer ?? (
            <>
              <div className="course-card-price-row">
                <div className="course-card-price-group">
                  <span className={`course-card-price${isFree ? ' is-free' : ''}`}>
                    {formatPrice(price)}
                  </span>
                  {hasDiscount && (
                    <span className="course-card-price-old">{formatPrice(originalPrice)}</span>
                  )}
                </div>

                {!isFree ? (
                  <button
                    type="button"
                    onClick={handleCartAction}
                    className={`course-card-cart-btn${inCart ? ' is-in-cart' : ''}`}
                    title={inCart ? 'Xem trong giỏ hàng' : 'Thêm vào giỏ hàng'}
                  >
                    <Icon name={inCart ? 'check' : 'shoppingCart'} size={14} />
                    <span>{inCart ? 'Trong giỏ' : 'Thêm giỏ'}</span>
                  </button>
                ) : (
                  <Link to={detailPath} className="course-card-cart-btn is-free-btn">
                    <Icon name="arrowRight" size={14} />
                    <span>Vào học</span>
                  </Link>
                )}
              </div>

              <div className="course-card-bottom-meta">
                <div
                  className="course-card-stars"
                  title={reviewCount > 0 ? `Đánh giá ${ratingValue.toFixed(1)}/5 (${reviewCount} lượt)` : 'Chưa có đánh giá'}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      name="star"
                      size={12}
                      fill={star <= Math.round(ratingValue) ? '#facc15' : '#e2e8f0'}
                      style={{ color: star <= Math.round(ratingValue) ? '#facc15' : '#cbd5e1' }}
                    />
                  ))}
                  <span className="course-card-review-cnt">
                    {reviewCount > 0 ? `${ratingValue.toFixed(1)} (${reviewCount})` : 'Chưa có đánh giá'}
                  </span>
                </div>

                <div className="course-card-stat-right">
                  <span className="course-card-lesson-badge">
                    {course.lessonCount != null ? `${course.lessonCount} bài giảng` : 'Trọn bộ'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
