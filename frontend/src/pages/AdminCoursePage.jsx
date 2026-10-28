import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import useApiQuery from '../hooks/useApiQuery';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, PageLoading } from '../components/ui';
import Pagination from '../components/course/Pagination';
import { COURSE_STATUSES, levelLabel, statusOption } from '../config/course';
import { formatDate, formatNumber, formatPrice } from '../utils/format';

const PAGE_SIZE = 10;

export default function AdminCoursePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Bộ lọc nằm trên URL để quay lại từ trang sửa vẫn giữ nguyên kết quả
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Math.max(0, Number(searchParams.get('page') ?? 1) - 1) || 0;

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const [categories, setCategories] = useState([]);
  const [busyId, setBusyId] = useState(null);
  // Thông báo do trang tạo/sửa gửi sang qua location.state
  const [notice, setNotice] = useState({ type: 'success', text: location.state?.notice ?? '' });

  // Xóa state sau khi đọc để F5 không hiện lại thông báo cũ
  useEffect(() => {
    if (location.state?.notice) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  if (syncedKeyword !== keyword) {
    setSyncedKeyword(keyword);
    setKeywordInput(keyword);
  }

  useEffect(() => {
    courseApi.getAdminCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const fetchCourses = useCallback(
    () => courseApi.getAdminCourses({ keyword, categoryId, status, page, size: PAGE_SIZE, sort: 'createdAt,desc' }),
    [keyword, categoryId, status, page],
  );
  const { data: result, error, loading, reload } = useApiQuery(fetchCourses);

  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ q: keywordInput.trim() });
  };

  // Xóa mềm: khóa học chuyển sang INACTIVE (ẩn khỏi trang công khai, dữ liệu vẫn còn)
  const handleHide = async (course) => {
    if (!window.confirm(`Ẩn khóa học “${course.title}”?\nHọc viên sẽ không còn thấy khóa học này.`)) return;
    setBusyId(course.id);
    setNotice({ type: 'success', text: '' });
    try {
      await courseApi.deleteCourse(course.id);
      setNotice({ type: 'success', text: `Đã ẩn khóa học “${course.title}”.` });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: parseApiError(err).message });
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !result && !error) return <PageLoading text="Đang tải khóa học..." />;

  const courses = result?.content ?? [];
  const hasFilters = Boolean(keyword || categoryId || status);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị"
        title="Khóa học"
        subtitle="Tạo, chỉnh sửa và xuất bản khóa học."
        actions={<Button to="/admin/courses/new">Thêm khóa học</Button>}
      />

      <Alert variant={notice.type}>{notice.text}</Alert>

      <Card>
        <form className="admin-toolbar" onSubmit={handleSearch} role="search">
          <div className="catalog-search">
            <label htmlFor="admin-course-search" className="sr-only">Tìm khóa học</label>
            <input
              id="admin-course-search"
              className="input"
              type="search"
              placeholder="Tìm theo tên hoặc mô tả..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              maxLength={100}
            />
            <Button type="submit" variant="secondary">Tìm</Button>
          </div>

          <label htmlFor="admin-course-category" className="sr-only">Danh mục</label>
          <select
            id="admin-course-category"
            className="input"
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value })}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          <label htmlFor="admin-course-status" className="sr-only">Trạng thái</label>
          <select
            id="admin-course-status"
            className="input"
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            {COURSE_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </form>

        {error ? (
          <Alert variant="error">
            {error.message}{' '}
            <button type="button" className="text-link" onClick={reload}>
              Thử lại
            </button>
          </Alert>
        ) : courses.length === 0 ? (
          <EmptyState
            icon="book"
            title={hasFilters ? 'Không có khóa học phù hợp' : 'Chưa có khóa học nào'}
            description={
              hasFilters ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Bắt đầu bằng việc tạo khóa học đầu tiên.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={() => setSearchParams({})}>Xóa bộ lọc</Button>
              ) : (
                <Button to="/admin/courses/new">Thêm khóa học</Button>
              )
            }
          />
        ) : (
          <>
            <div className="catalog-summary" aria-live="polite">
              <span>{formatNumber(result.totalElements)} khóa học</span>
            </div>

            <div className={`table-wrap${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Khóa học</th>
                    <th scope="col">Giá</th>
                    <th scope="col">Trình độ</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Cập nhật</th>
                    <th scope="col"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => {
                    const courseStatus = statusOption(COURSE_STATUSES, course.status);
                    return (
                      <tr key={course.id}>
                        <td>
                          <div className="cell-title cell-truncate">{course.title}</div>
                          <div className="cell-sub">{course.categoryName}</div>
                        </td>
                        <td>{formatPrice(course.price)}</td>
                        <td>{levelLabel(course.level)}</td>
                        <td><Badge variant={courseStatus.variant}>{courseStatus.label}</Badge></td>
                        <td>{formatDate(course.updatedAt)}</td>
                        <td>
                          <div className="row-actions">
                            <Button variant="ghost" size="sm" to={`/admin/courses/${course.id}/edit`}>Sửa</Button>
                            <Button variant="ghost" size="sm" to={`/admin/lessons?courseId=${course.id}`}>Bài học</Button>
                            {course.status !== 'INACTIVE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleHide(course)}
                                loading={busyId === course.id}
                              >
                                Ẩn
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onChange={(next) => updateParams({ page: next > 0 ? String(next + 1) : '' }, false)}
              disabled={loading}
            />
          </>
        )}
      </Card>
    </div>
  );
}
