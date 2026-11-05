import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { reviewApi } from '../api/reviewApi';
import useApiQuery from '../hooks/useApiQuery';
import { useAuth } from '../auth/useAuth';
import CourseReviews from '../components/CourseReviews';
import {
  Alert,
  Badge,
  Button,
  CourseDetailSkeleton,
  EmptyState,
  Icon,
  ProgressBar,
  StarRating,
} from '../components/ui';
import { formatDuration, levelLabel } from '../config/course';
import { formatPrice } from '../utils/format';
import { useShopStore } from '../utils/shopStore';

const TABS = [
  { id: 'overview', label: 'Giới thiệu' },
  { id: 'curriculum', label: 'Chương trình học' },
  { id: 'reviews', label: 'Đánh giá học viên' },
];

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist, isInCart, addToCart } = useShopStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollment, setEnrollment] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const fetchCourse = useCallback(() => courseApi.getCourseById(id), [id]);
  const { data: course, error, loading } = useApiQuery(fetchCourse);

  useEffect(() => {
    let active = true;
    reviewApi
      .getSummary(id)
      .then((res) => {
        if (active) setReviewSummary(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let active = true;
    enrollmentApi
      .getMyCourses()
      .then((list) => {
        if (!active) return;
        const items = Array.isArray(list) ? list : list?.content ?? [];
        const found = items.find((item) => Number(item.courseId) === Number(id));
        setEnrollment(found || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, isAuthenticated]);

  async function handleConfirmEnroll() {
    setEnrolling(true);
    setEnrollError('');
    try {
      const created = await enrollmentApi.enrollCourse(id);
      setEnrollment(created);
      navigate(`/learning/${id}`);
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Không thể đăng ký khóa học này.');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return <CourseDetailSkeleton />;

  if (error?.status === 404 || error?.status === 400) {
    return (
      <div className="container section">
        <EmptyState
          icon="book"
          title="Không tìm thấy khóa học"
          description="Khóa học này không tồn tại hoặc hiện không còn mở cho học viên."
          action={<Button to="/courses">Xem các khóa học khác</Button>}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container section">
        <Alert variant="error">{error.message}</Alert>
      </div>
    );
  }

  const lessons = course.lessons ?? [];
  const totalMinutes = course.duration || lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  const isFree = Number(course.price) === 0;
  const avgRating = reviewSummary?.averageRating ?? course.averageRating;
  const revCount = reviewSummary?.reviewCount ?? course.reviewCount ?? 0;
  const progressPct = Math.round(Number(enrollment?.progress ?? 0));

  return (
    <>
      <section className="course-hero">
        <div className="container course-hero-grid">
          <div>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/courses">Khóa học</Link>
              <span aria-hidden="true">/</span>
              <Link to={`/courses?categoryId=${course.categoryId}`}>{course.categoryName}</Link>
            </nav>

            <h1 className="course-hero-title">{course.title}</h1>

            <div className="course-hero-meta">
              {course.instructorName && (
                <span>
                  <Icon name="user" size={16} />
                  Giảng viên: {course.instructorName}
                </span>
              )}
              <span>
                <Icon name="trendingUp" size={16} />
                {levelLabel(course.level)}
              </span>
              <span>
                <Icon name="layers" size={16} />
                {lessons.length} bài học
              </span>
              {totalMinutes > 0 && (
                <span>
                  <Icon name="clock" size={16} />
                  {formatDuration(totalMinutes)}
                </span>
              )}
              {revCount > 0 && <StarRating value={Number(avgRating || 0)} count={revCount} />}
            </div>
          </div>

          <aside className="enroll-card" aria-label="Đăng ký khóa học">
            <div className="enroll-card-thumb">
              {course.thumbnail ? <img src={course.thumbnail} alt="" /> : <Icon name="play" size={40} />}
            </div>
            <div className="enroll-card-body">
              <div className="enroll-card-pricing">
                <div className={`enroll-card-price${isFree ? ' is-free' : ''}`}>{formatPrice(course.price)}</div>
                {!isFree && Number(course.originalPrice) > Number(course.price) && (
                  <span className="enroll-card-price-old">{formatPrice(course.originalPrice)}</span>
                )}
              </div>

              <Alert variant="error">{enrollError}</Alert>

              {!isAuthenticated ? (
                <Button size="lg" block to="/login">
                  Đăng nhập để đăng ký
                </Button>
              ) : enrollment ? (
                <div className="stack" style={{ gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge variant={enrollment.status === 'COMPLETED' ? 'success' : 'primary'}>
                      {enrollment.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đã sở hữu khóa học'}
                    </Badge>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{progressPct}%</span>
                  </div>
                  <ProgressBar value={progressPct} />
                  <Button size="lg" block to={`/learning/${course.id}`}>
                    {progressPct > 0 ? 'Tiếp tục vào học' : 'Vào học ngay'}
                  </Button>
                </div>
              ) : isFree ? (
                <Button size="lg" block loading={enrolling} onClick={handleConfirmEnroll}>
                  Đăng ký học miễn phí
                </Button>
              ) : (
                <Button size="lg" block to={`/checkout?courseId=${course.id}`}>
                  Mua khóa học ngay
                </Button>
              )}

              {!enrollment && (
                <div className="enroll-card-subactions">
                  {!isFree && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isInCart(course.id)) {
                          navigate('/cart');
                        } else {
                          addToCart(course);
                        }
                      }}
                      className={`enroll-sub-btn${isInCart(course.id) ? ' is-in-cart' : ''}`}
                    >
                      <Icon name={isInCart(course.id) ? 'check' : 'shoppingCart'} size={16} />
                      <span>{isInCart(course.id) ? 'Đã trong giỏ (Xem giỏ)' : 'Thêm vào giỏ hàng'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleWishlist(course)}
                    className={`enroll-sub-btn is-wish${isInWishlist(course.id) ? ' is-active' : ''}`}
                    title="Lưu khóa học yêu thích"
                  >
                    <Icon name="heart" size={16} fill={isInWishlist(course.id) ? 'currentColor' : 'none'} />
                    <span>{isInWishlist(course.id) ? 'Đã yêu thích' : 'Yêu thích'}</span>
                  </button>
                </div>
              )}

              <ul className="enroll-card-facts">
                <li>
                  <Icon name="layers" size={16} />
                  {lessons.length} bài học
                </li>
                {totalMinutes > 0 && (
                  <li>
                    <Icon name="clock" size={16} />
                    Tổng thời lượng {formatDuration(totalMinutes)}
                  </li>
                )}
                <li>
                  <Icon name="globe" size={16} />
                  Truy cập trọn đời, học mọi lúc
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="container section">
        <div className="tabs" role="tablist" aria-label="Thông tin khóa học">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              className="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'curriculum' && ` (${lessons.length})`}
              {tab.id === 'reviews' && revCount > 0 && ` (${revCount})`}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            {course.description ? (
              <p className="prose">{course.description}</p>
            ) : (
              <p className="text-muted">Khóa học này chưa có mô tả chi tiết.</p>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div role="tabpanel" id="panel-curriculum" aria-labelledby="tab-curriculum">
            {lessons.length === 0 ? (
              <EmptyState icon="layers" title="Chưa có bài học" description="Nội dung khóa học đang được chuẩn bị." />
            ) : (
              <ol className="lesson-list">
                {lessons.map((lesson) => (
                  <li key={lesson.id} className="lesson-item">
                    <span className="lesson-order">{lesson.lessonOrder}</span>
                    <div>
                      <div className="lesson-title">{lesson.title}</div>
                      {lesson.description && <p className="lesson-desc">{lesson.description}</p>}
                    </div>
                    {lesson.duration > 0 && (
                      <span className="lesson-duration">
                        <Icon name="clock" size={14} />
                        {formatDuration(lesson.duration)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews">
            <CourseReviews courseId={course.id} isEnrolled={Boolean(enrollment)} />
          </div>
        )}
      </section>
    </>
  );
}
