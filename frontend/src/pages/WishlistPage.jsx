import { useNavigate } from 'react-router-dom';
import { Button, CourseCard, EmptyState, Icon, PageHeader } from '../components/ui';
import { formatNumber } from '../utils/format';
import { useShopStore } from '../utils/shopStore';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, addToCart, isInCart } = useShopStore();

  function handleMoveAllToCart() {
    wishlist.forEach((course) => {
      if (Number(course.price) > 0 && !isInCart(course.id)) {
        addToCart(course);
      }
    });
    navigate('/cart');
  }

  return (
    <div className="container section">
      <PageHeader
        eyebrow="Bộ sưu tập cá nhân"
        title="Khóa học yêu thích"
        subtitle="Danh sách những khóa học bạn đã đánh dấu quan tâm để tham khảo và đăng ký."
        actions={
          wishlist.length > 0 ? (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button variant="secondary" to="/courses">
                Khám phá thêm
              </Button>
              <Button onClick={handleMoveAllToCart}>
                <Icon name="shoppingCart" size={16} /> Chuyển tất cả sang giỏ hàng
              </Button>
            </div>
          ) : null
        }
      />

      {wishlist.length === 0 ? (
        <EmptyState
          icon="heart"
          title="Chưa có khóa học yêu thích nào"
          description="Nhấn vào biểu tượng trái tim trên bất kỳ khóa học nào để lưu lại vào danh sách của bạn."
          action={<Button to="/courses">Khám phá khóa học ngay</Button>}
        />
      ) : (
        <>
          <div className="catalog-summary" aria-live="polite">
            <span>Đã lưu {formatNumber(wishlist.length)} khóa học</span>
          </div>

          <div className="course-grid">
            {wishlist.map((course) => (
              <CourseCard key={course.id} course={course} to={`/courses/${course.id}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

