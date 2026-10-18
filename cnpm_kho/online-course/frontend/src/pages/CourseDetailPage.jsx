import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import useApiQuery from '../hooks/useApiQuery';
import { useAuth } from '../auth/useAuth';
import { Alert, Button, EmptyState, Icon, PageLoading, StarRating } from '../components/ui';
import { formatDuration, levelLabel } from '../config/course';
import { formatPrice } from '../utils/format';

const TABS = [
  { id: 'overview', label: 'Giới thiệu' },
  { id: 'curriculum', label: 'Chương trình học' },
];

export default function CourseDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const fetchCourse = useCallback(() => courseApi.getCourseById(id), [id]);
  const { data: course, error, loading } = useApiQuery(fetchCourse);

  if (loading) return <PageLoading text="Đang tải khóa học..." />;

  // Khóa học không tồn tại, chưa xuất bản hoặc đã ẩn: backend trả 404 (id sai định dạng: 400)
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
                <span><Icon name="user" size={16} />Giảng viên: {course.instructorName}</span>
              )}
              <span><Icon name="trendingUp" size={16} />{levelLabel(course.level)}</span>
              <span><Icon name="layers" size={16} />{lessons.length} bài học</span>
              {totalMinutes > 0 && <span><Icon name="clock" size={16} />{formatDuration(totalMinutes)}</span>}
              {/* TODO(TV3): điểm đánh giá trung bình (averageRating, reviewCount) khi có API reviews */}
              {course.averageRating != null && <StarRating value={course.averageRating} count={course.reviewCount} />}
            </div>
          </div>

          <aside className="enroll-card" aria-label="Đăng ký khóa học">
            <div className="enroll-card-thumb">
              {course.thumbnail ? <img src={course.thumbnail} alt="" /> : <Icon name="play" size={40} />}
            </div>
            <div className="enroll-card-body">
              <div className={`enroll-card-price${isFree ? ' is-free' : ''}`}>{formatPrice(course.price)}</div>

              {/* TODO(TV3): gọi enrollmentApi.enrollCourse(course.id) khi API đăng ký sẵn sàng */}
              {isAuthenticated ? (
                <>
                  <Button size="lg" block disabled>Đăng ký học</Button>
                  <p className="enroll-card-note">Chức năng đăng ký khóa học đang được hoàn thiện.</p>
                </>
              ) : (
                <Button size="lg" block to="/login">Đăng nhập để đăng ký</Button>
              )}

              <ul className="enroll-card-facts">
                <li><Icon name="layers" size={16} />{lessons.length} bài học</li>
                {totalMinutes > 0 && <li><Icon name="clock" size={16} />Tổng thời lượng {formatDuration(totalMinutes)}</li>}
                <li><Icon name="globe" size={16} />Học trực tuyến, mọi lúc</li>
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
            </button>
          ))}
        </div>

        {activeTab === 'overview' ? (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            {course.description ? (
              <p className="prose">{course.description}</p>
            ) : (
              <p className="text-muted">Khóa học này chưa có mô tả chi tiết.</p>
            )}
          </div>
        ) : (
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
                      <span className="lesson-duration"><Icon name="clock" size={14} />{formatDuration(lesson.duration)}</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </section>
    </>
  );
}
