import { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { enrollmentApi } from '../api/enrollmentApi';
import useApiQuery from '../hooks/useApiQuery';
import Pagination from '../components/course/Pagination';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, PageLoading, ProgressBar } from '../components/ui';
import { levelLabel } from '../config/course';
import { formatDate, formatNumber } from '../utils/format';

const STATUS_MAP = {
  ACTIVE: { label: 'Đang học', variant: 'primary' },
  COMPLETED: { label: 'Đã hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'neutral' },
};

export default function AdminEnrollmentPage() {
  const [keyword, setKeyword] = useState('');
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    let active = true;
    client
      .get('/api/admin/users')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
        const map = {};
        list.forEach((u) => {
          map[u.id] = u;
        });
        setUserMap(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const fetchEnrollments = useCallback(
    () =>
      enrollmentApi.getAllEnrollments({
        ...filters,
        page,
        size: 10,
      }),
    [filters, page],
  );

  const { data: result, error, loading, reload } = useApiQuery(fetchEnrollments);

  function handleSearch(event) {
    event.preventDefault();
    setPage(0);
    setFilters({
      keyword: keyword.trim() || undefined,
      userId: userId.trim() || undefined,
      courseId: courseId.trim() || undefined,
    });
  }

  function clearFilters() {
    setKeyword('');
    setUserId('');
    setCourseId('');
    setPage(0);
    setFilters({});
  }

  if (loading && !result && !error) return <PageLoading text="Đang tải danh sách đăng ký..." />;

  const enrollments = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? enrollments.length;
  const hasFilters = Boolean(filters.keyword || filters.userId || filters.courseId);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị"
        title="Đăng ký khóa học"
        subtitle="Theo dõi danh sách học viên ghi danh và tiến độ hoàn thành khóa học."
      />

      <Card>
        <form className="admin-toolbar" onSubmit={handleSearch} role="search">
          <div className="catalog-search">
            <label htmlFor="admin-enrollment-keyword" className="sr-only">
              Tìm học viên hoặc khóa học
            </label>
            <input
              id="admin-enrollment-keyword"
              className="input"
              type="search"
              placeholder="Tìm tên/email học viên hoặc tên khóa học..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              Tìm
            </Button>
          </div>

          <input
            type="number"
            min="1"
            className="input"
            placeholder="ID học viên"
            aria-label="ID học viên"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />

          <input
            type="number"
            min="1"
            className="input"
            placeholder="ID khóa học"
            aria-label="ID khóa học"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
        </form>

        {error ? (
          <Alert variant="error">
            {error.message}{' '}
            <button type="button" className="text-link" onClick={reload}>
              Thử lại
            </button>
          </Alert>
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon="award"
            title={hasFilters ? 'Không có lượt đăng ký phù hợp' : 'Chưa có lượt đăng ký nào'}
            description={
              hasFilters
                ? 'Thử thay đổi từ khóa hoặc xóa bộ lọc để xem toàn bộ danh sách.'
                : 'Khi học viên đăng ký khóa học, dữ liệu sẽ hiển thị tại đây.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="catalog-summary" aria-live="polite">
              <span>{formatNumber(totalElements)} lượt đăng ký</span>
              {hasFilters && (
                <button type="button" className="text-link" onClick={clearFilters}>
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className={`table-wrap${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Mã ĐK</th>
                    <th scope="col">Học viên</th>
                    <th scope="col">Khóa học</th>
                    <th scope="col">Ngày đăng ký</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Tiến độ</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((item) => {
                    const pct = Math.round(Number(item.progress ?? 0));
                    const st = STATUS_MAP[item.status] || { label: item.status, variant: 'neutral' };
                    const student = userMap[item.userId];
                    return (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>
                          <div className="cell-title">
                            {student?.fullName || `Học viên #${item.userId}`}
                          </div>
                          <div className="cell-sub">
                            {student?.email ? `${student.email} · ID #${item.userId}` : `ID #${item.userId}`}
                          </div>
                        </td>
                        <td>
                          <div className="cell-title cell-truncate">
                            {item.title || `Khóa học #${item.courseId}`}
                          </div>
                          <div className="cell-sub">
                            {item.instructorName ? `GV: ${item.instructorName}` : `Mã KH #${item.courseId}`}
                            {item.level ? ` · ${levelLabel(item.level)}` : ''}
                          </div>
                        </td>
                        <td>{formatDate(item.enrolledAt)}</td>
                        <td>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td style={{ minWidth: '160px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <ProgressBar value={pct} />
                            </div>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, minWidth: '34px' }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
          </>
        )}
      </Card>
    </div>
  );
}
