import { useEffect, useState } from 'react';
import { enrollmentApi } from '../api/enrollmentApi';
import Pagination from '../components/course/Pagination';
import { Alert, Badge, Button, Card, EmptyState, ProgressBar, Spinner } from '../components/ui';
import { formatDate } from '../utils/format';

const STATUS_MAP = {
  ACTIVE: { label: 'Đang học', variant: 'primary' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'neutral' },
};

export default function AdminEnrollmentPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadEnrollments() {
      setLoading(true);
      setError('');

      try {
        const data = await enrollmentApi.getAllEnrollments({
          ...filters,
          page,
          size: 10,
        });

        if (active) {
          setEnrollments(data.content ?? []);
          setTotalPages(data.totalPages ?? 0);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Không thể tải danh sách đăng ký');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEnrollments();
    return () => {
      active = false;
    };
  }, [filters, page]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(0);
    setFilters({
      userId: userId.trim() || undefined,
      courseId: courseId.trim() || undefined,
    });
  }

  return (
    <div className="stack">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Quản lý đăng ký khóa học</h1>
          <p className="text-muted">Theo dõi danh sách học viên đăng ký và tiến độ học tập trên toàn hệ thống.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="course-filters" style={{ marginBottom: 0 }}>
          <input
            type="number"
            min="1"
            className="input"
            placeholder="Lọc theo ID học viên..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input
            type="number"
            min="1"
            className="input"
            placeholder="Lọc theo ID khóa học..."
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
          <Button type="submit">Lọc kết quả</Button>
        </form>
      </Card>

      <Alert variant="error">{error}</Alert>

      <Card>
        {loading ? (
          <Spinner label="Đang tải danh sách đăng ký..." />
        ) : enrollments.length === 0 ? (
          <EmptyState icon="award" title="Chưa có lượt đăng ký phù hợp" />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ID Học viên</th>
                  <th>Khóa học</th>
                  <th>Ngày đăng ký</th>
                  <th>Trạng thái</th>
                  <th>Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((item) => {
                  const pct = Math.round(Number(item.progress ?? item.progressPercent ?? item.progressPercentage ?? 0));
                  const st = STATUS_MAP[item.status] || { label: item.status, variant: 'neutral' };
                  return (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>User #{item.userId}</td>
                      <td>
                        <strong>{item.title || item.courseTitle || `Khóa học #${item.courseId}`}</strong>
                      </td>
                      <td>{formatDate(item.enrolledAt)}</td>
                      <td>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td style={{ minWidth: '140px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <ProgressBar value={pct} />
                          </div>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}

