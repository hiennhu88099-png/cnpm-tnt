import { useEffect, useState } from 'react';
import { enrollmentApi } from '../api/enrollmentApi';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  MyCoursesGridSkeleton,
  PageHeader,
  ProgressBar,
} from '../components/ui';
import { COURSE_LEVEL_LABELS } from '../config/site';
import { formatDate } from '../utils/format';

const STATUS_MAP = {
  ACTIVE: { label: 'Đang học', variant: 'primary' },
  COMPLETED: { label: 'Đã hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'neutral' },
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      try {
        const data = await enrollmentApi.getMyCourses();
        if (active) {
          setCourses(Array.isArray(data) ? data : data?.content ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Không thể tải danh sách khóa học của bạn');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCourses();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container section">
      <PageHeader
        eyebrow="Học tập"
        title="Khóa học của tôi"
        subtitle="Theo dõi tiến độ và tiếp tục các khóa học bạn đã đăng ký."
        actions={
          <Button variant="secondary" to="/courses">
            Khám phá thêm khóa học
          </Button>
        }
      />

      <Alert variant="error">{error}</Alert>

      {loading ? (
        <MyCoursesGridSkeleton count={3} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon="book"
          title="Bạn chưa đăng ký khóa học nào"
          description="Hãy chọn một khóa học phù hợp để bắt đầu hành trình học tập ngay hôm nay."
          action={<Button to="/courses">Xem danh sách khóa học</Button>}
        />
      ) : (
        <div className="course-grid">
          {courses.map((item) => {
            const courseId = item.courseId;
            const title = item.title || item.courseTitle || `Khóa học #${courseId}`;
            const progress = Math.round(
              Number(item.progress ?? item.progressPercentage ?? item.progressPercent ?? 0),
            );
            const statusInfo = STATUS_MAP[item.status] || { label: item.status, variant: 'neutral' };

            return (
              <article key={item.id} className="course-card">
                <div className="course-card-thumb">
                  <div className="course-card-thumb-link">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={title} loading="lazy" />
                    ) : null}
                  </div>
                  <div className="course-card-badges">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </div>
                <div className="course-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    {item.categoryName && <span className="course-card-level">{item.categoryName}</span>}
                    {item.level && <Badge variant="neutral">{COURSE_LEVEL_LABELS[item.level] || item.level}</Badge>}
                  </div>

                  <h3 className="course-card-title" style={{ margin: 0 }}>
                    {title}
                  </h3>

                  {item.instructorName && (
                    <div className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                      Giảng viên: {item.instructorName}
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 'var(--text-xs)',
                        marginBottom: '6px',
                      }}
                    >
                      <span>Tiến độ hoàn thành</span>
                      <strong>{progress}%</strong>
                    </div>
                    <ProgressBar value={progress} />
                  </div>

                  {item.enrolledAt && (
                    <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      Đăng ký ngày {formatDate(item.enrolledAt)}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                    <Button to={`/learning/${courseId}`} block>
                      {progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                    </Button>
                    <Button variant="secondary" to={`/courses/${courseId}`}>
                      Chi tiết
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

