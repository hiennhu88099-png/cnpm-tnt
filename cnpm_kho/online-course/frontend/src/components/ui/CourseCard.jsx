import { Link } from 'react-router-dom';
import Badge from './Badge';
import Icon from './Icon';
import StarRating from './StarRating';
import { formatPrice } from '../../utils/format';

// Màu nền thumbnail khi khóa học chưa có ảnh
const FALLBACK_BACKGROUNDS = [
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #10b981, #0d9488)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
];

/**
 * Thẻ khóa học dùng cho mọi danh sách (trang chủ, danh sách khóa học, khóa học của tôi...).
 * course: { id, title, instructorName, categoryName, thumbnail, price, originalPrice,
 *           averageRating, reviewCount, lessonCount, level }
 * to:     đường dẫn khi bấm vào thẻ (vd. `/courses/${course.id}`); không truyền thì thẻ không bấm được.
 * footer: thay phần giá bằng nội dung khác (vd. thanh tiến độ ở trang "Khóa học của tôi").
 */
export default function CourseCard({ course, to, footer }) {
  const Wrapper = to ? Link : 'div';
  const isFree = Number(course.price) === 0;

  return (
    <Wrapper to={to} className="course-card">
      <div
        className="course-card-thumb"
        style={course.thumbnail ? undefined : { background: FALLBACK_BACKGROUNDS[course.id % FALLBACK_BACKGROUNDS.length] }}
      >
        {course.thumbnail ? <img src={course.thumbnail} alt="" loading="lazy" /> : <Icon name="book" size={40} strokeWidth={1.5} />}
        {course.categoryName && <Badge>{course.categoryName}</Badge>}
      </div>

      <div className="course-card-body">
        <h3 className="course-card-title" title={course.title}>{course.title}</h3>
        {course.instructorName && <div className="course-card-instructor">{course.instructorName}</div>}
        {course.averageRating != null && <StarRating value={course.averageRating} count={course.reviewCount} />}

        <div className="course-card-meta">
          {course.lessonCount != null && <span><Icon name="layers" size={14} />{course.lessonCount} bài học</span>}
          {course.level && <span><Icon name="trendingUp" size={14} />{course.level}</span>}
        </div>

        <div className="course-card-footer">
          {footer ?? (
            <>
              <span className={`course-card-price${isFree ? ' is-free' : ''}`}>{formatPrice(course.price)}</span>
              {!isFree && course.originalPrice > course.price && (
                <span className="course-card-price-old">{formatPrice(course.originalPrice)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
