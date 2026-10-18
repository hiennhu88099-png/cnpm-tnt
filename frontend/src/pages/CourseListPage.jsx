import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import useApiQuery from '../hooks/useApiQuery';
import { Alert, Button, CourseCard, EmptyState, PageHeader, PageLoading } from '../components/ui';
import Pagination from '../components/course/Pagination';
import { COURSE_SORTS, levelLabel } from '../config/course';
import { formatNumber } from '../utils/format';

const PAGE_SIZE = 12;
const DEFAULT_SORT = COURSE_SORTS[0].value;

export default function CourseListPage() {
  // Bộ lọc nằm trên URL (?q=&categoryId=&sort=&page=) để chia sẻ link / bấm Back vẫn giữ kết quả
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const sort = searchParams.get('sort') ?? DEFAULT_SORT;
  const page = Math.max(0, Number(searchParams.get('page') ?? 1) - 1) || 0;

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [syncedKeyword, setSyncedKeyword] = useState(keyword);
  const [categories, setCategories] = useState([]);

  // Ô tìm kiếm theo URL khi người dùng bấm Back/Forward
  if (syncedKeyword !== keyword) {
    setSyncedKeyword(keyword);
    setKeywordInput(keyword);
  }

  useEffect(() => {
    courseApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const fetchCourses = useCallback(
    () => courseApi.getAllCourses({ keyword, categoryId, sort, page, size: PAGE_SIZE }),
    [keyword, categoryId, sort, page],
  );
  const { data: result, error, loading, reload } = useApiQuery(fetchCourses);

  // Đổi bộ lọc thì quay về trang 1
  const updateParams = (changes, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (resetPage) next.delete('page');
    if (next.get('sort') === DEFAULT_SORT) next.delete('sort');
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ q: keywordInput.trim() });
  };

  const goToPage = (nextPage) => {
    updateParams({ page: nextPage > 0 ? String(nextPage + 1) : '' }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = Boolean(keyword || categoryId);
  const clearFilters = () => {
    setKeywordInput('');
    setSearchParams({});
  };

  // Lần tải đầu tiên: chưa có dữ liệu nào để hiển thị
  if (loading && !result && !error) return <PageLoading text="Đang tải khóa học..." />;

  const courses = result?.content ?? [];

  return (
    <div className="container section">
      <PageHeader title="Tất cả khóa học" subtitle="Tìm khóa học phù hợp với mục tiêu của bạn." />

      <form className="catalog-toolbar" onSubmit={handleSearch} role="search">
        <div className="catalog-search">
          <label htmlFor="course-search" className="sr-only">Tìm khóa học</label>
          <input
            id="course-search"
            className="input"
            type="search"
            placeholder="Tìm theo tên hoặc mô tả khóa học..."
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            maxLength={100}
          />
          <Button type="submit">Tìm</Button>
        </div>

        <label htmlFor="course-category" className="sr-only">Danh mục</label>
        <select
          id="course-category"
          className="input"
          value={categoryId}
          onChange={(e) => updateParams({ categoryId: e.target.value })}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <label htmlFor="course-sort" className="sr-only">Sắp xếp</label>
        <select
          id="course-sort"
          className="input"
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
        >
          {COURSE_SORTS.map((option) => (
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
          title={hasFilters ? 'Không tìm thấy khóa học phù hợp' : 'Chưa có khóa học nào'}
          description={
            hasFilters
              ? 'Thử từ khóa khác, hoặc bỏ bộ lọc danh mục để xem nhiều khóa học hơn.'
              : 'Các khóa học sẽ xuất hiện ở đây ngay khi được xuất bản.'
          }
          action={hasFilters && <Button variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button>}
        />
      ) : (
        <>
          <div className="catalog-summary" aria-live="polite">
            <span>
              {formatNumber(result.totalElements)} khóa học
              {keyword && <> cho “{keyword}”</>}
            </span>
            {hasFilters && (
              <button type="button" className="text-link" onClick={clearFilters}>Xóa bộ lọc</button>
            )}
          </div>

          <div className={`course-grid${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={{ ...course, level: levelLabel(course.level) }}
                to={`/courses/${course.id}`}
              />
            ))}
          </div>

          <Pagination page={result.page} totalPages={result.totalPages} onChange={goToPage} disabled={loading} />
        </>
      )}
    </div>
  );
}
