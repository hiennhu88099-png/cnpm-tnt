import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from './Badge';
import Icon from './Icon';
import StarRating from './StarRating';
import { formatPrice } from '../../utils/format';
import { COURSE_LEVEL_LABELS } from '../../config/site';

// Màu nền thumbnail khi khóa học chưa có ảnh hoặc ảnh lỗi
const FALLBACK_BACKGROUNDS = [
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #10b981, #0d9488)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
];

export default function CourseCard({ course, to, footer }) {
  const [imgError, setImgError] = useState(false);
  const Wrapper = to ? Link : 'div';
  const isFree = Number(course.price) === 0;
  const showThumb = course.thumbnail && !imgError;

  return (
    <Wrapper to={to} className="course-card">
      <div
        className="course-card-thumb"
        style={showThumb ? undefined : { background: FALLBACK_BACKGROUNDS[course.id % FALLBACK_BACKGROUNDS.length] }}
      >
        {showThumb ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon name="book" size={40} strokeWidth={1.5} />
        )}
        {course.categoryName && <Badge>{course.categoryName}</Badge>}
      </div>

      <div className="course-card-body">
        <h3 className="course-card-title" title={course.title}>{course.title}</h3>
        {course.instructorName && <div className="course-card-instructor">{course.instructorName}</div>}
        {course.averageRating != null && <StarRating value={course.averageRating} count={course.reviewCount} />}

        <div className="course-card-meta">
          {course.lessonCount != null && <span><Icon name="layers" size={14} />{course.lessonCount} bài học</span>}
          {course.level && <span><Icon name="trendingUp" size={14} />{COURSE_LEVEL_LABELS[course.level] || course.level}</span>}
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
