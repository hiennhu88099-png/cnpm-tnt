import { useCallback, useState } from 'react';
import { reviewApi } from '../api/reviewApi';
import useApiQuery from '../hooks/useApiQuery';
import Pagination from '../components/course/Pagination';
import { Alert, Badge, Card, EmptyState, Icon, PageHeader, PageLoading, StarRating } from '../components/ui';
import { formatDate, formatNumber } from '../utils/format';

const REVIEW_STATUS_MAP = {
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  HIDDEN: { label: 'Đã ẩn', variant: 'neutral' },
};

export default function AdminReviewPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [notice, setNotice] = useState({ type: 'success', text: '' });

  const fetchReviews = useCallback(
    () =>
      reviewApi.getAdminReviews({
        status: status || undefined,
        page,
        size: 10,
      }),
    [status, page],
  );

  const { data: result, error, loading, reload } = useApiQuery(fetchReviews);

  async function changeStatus(id, nextStatus) {
    setUpdatingId(id);
    setNotice({ type: 'success', text: '' });
    try {
      await reviewApi.updateReviewStatus(id, nextStatus);
      setNotice({
        type: 'success',
        text: nextStatus === 'APPROVED' ? 'Đã duyệt hiển thị đánh giá.' : 'Đã ẩn đánh giá khỏi khóa học.',
      });
      reload();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Không thể cập nhật trạng thái đánh giá.',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !result && !error) return <PageLoading text="Đang tải danh sách đánh giá..." />;

  const reviews = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? reviews.length;

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị"
        title="Kiểm duyệt đánh giá"
        subtitle="Xem xét, phê duyệt hoặc ẩn các nhận xét của học viên trên khóa học."
      />

      <Alert variant={notice.type}>{notice.text}</Alert>

      <Card>
        <div className="nx-filter-pills" role="tablist" aria-label="Lọc đánh giá theo trạng thái">
          {[
            { value: '', label: 'Tất cả đánh giá' },
            { value: 'PENDING', label: 'Chờ xử lý' },
            { value: 'APPROVED', label: 'Đã duyệt (Hiển thị)' },
            { value: 'HIDDEN', label: 'Đã ẩn' },
          ].map((tab) => (
            <button
              key={tab.value || 'ALL'}
              type="button"
              className={`nx-filter-pill${status === tab.value ? ' is-active' : ''}`}
              onClick={() => {
                setStatus(tab.value);
                setPage(0);
              }}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {error ? (
          <Alert variant="error">
            {error.message}{' '}
            <button type="button" className="text-link" onClick={reload}>
              Thử lại
            </button>
          </Alert>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon="star"
            title={status ? 'Không có đánh giá phù hợp' : 'Chưa có đánh giá nào'}
            description={
              status
                ? 'Thử chọn trạng thái khác để xem thêm đánh giá.'
                : 'Các nhận xét và chấm sao của học viên sẽ xuất hiện tại đây.'
            }
          />
        ) : (
          <>
            <div className="catalog-summary" aria-live="polite">
              <span>{formatNumber(totalElements)} đánh giá</span>
            </div>

            <div className={`table-wrap${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Học viên</th>
                    <th scope="col">Khóa học</th>
                    <th scope="col">Mức sao</th>
                    <th scope="col">Nhận xét</th>
                    <th scope="col">Ngày gửi</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="nx-th-actions">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => {
                    const st = REVIEW_STATUS_MAP[review.status] || {
                      label: review.status,
                      variant: 'neutral',
                    };
                    return (
                      <tr key={review.id}>
                        <td>#{review.id}</td>
                        <td>
                          <div className="cell-title">{review.fullName || `Học viên #${review.userId}`}</div>
                          <div className="cell-sub">ID #{review.userId}</div>
                        </td>
                        <td>
                          <div className="cell-title cell-truncate">
                            {review.courseTitle || `Khóa học #${review.courseId}`}
                          </div>
                        </td>
                        <td>
                          <StarRating value={Number(review.rating || 0)} />
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          <div style={{ whiteSpace: 'normal', lineHeight: 1.45 }}>
                            {review.comment || <span className="text-muted">Không có nội dung</span>}
                          </div>
                        </td>
                        <td>{formatDate(review.createdAt)}</td>
                        <td>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td>
                          <div className="row-actions">
                            {review.status !== 'APPROVED' && (
                              <button
                                type="button"
                                disabled={updatingId === review.id}
                                onClick={() => changeStatus(review.id, 'APPROVED')}
                                className="nx-action-btn is-success"
                              >
                                <Icon name="checkCircle" size={14} />
                                <span>{updatingId === review.id ? '...' : 'Duyệt'}</span>
                              </button>
                            )}
                            {review.status !== 'HIDDEN' && (
                              <button
                                type="button"
                                disabled={updatingId === review.id}
                                onClick={() => changeStatus(review.id, 'HIDDEN')}
                                className="nx-action-btn is-warning"
                              >
                                <Icon name="eyeOff" size={14} />
                                <span>{updatingId === review.id ? '...' : 'Ẩn'}</span>
                              </button>
                            )}
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
