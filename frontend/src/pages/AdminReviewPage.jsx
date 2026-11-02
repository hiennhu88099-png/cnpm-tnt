import { useCallback, useState } from 'react';
import { reviewApi } from '../api/reviewApi';
import useApiQuery from '../hooks/useApiQuery';
import Pagination from '../components/course/Pagination';
import { Alert, Badge, Button, Card, EmptyState, Spinner, StarRating } from '../components/ui';
import { formatDate } from '../utils/format';

export default function AdminReviewPage() {
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchReviews = useCallback(() => reviewApi.getAdminReviews({ page, size: 10 }), [page]);
  const { data: result, error: queryError, loading, reload } = useApiQuery(fetchReviews);

  const reviews = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const error = actionError || queryError?.message || '';

  async function changeStatus(id, status) {
    setUpdatingId(id);
    setActionError('');

    try {
      await reviewApi.updateReviewStatus(id, status);
      reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể cập nhật trạng thái đánh giá');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="stack">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Kiểm duyệt đánh giá</h1>
          <p className="text-muted">Hiển thị hoặc ẩn các nhận xét không phù hợp trên trang khóa học.</p>
        </div>
      </div>

      <Alert variant="error">{error}</Alert>

      <Card>
        {loading ? (
          <Spinner label="Đang tải đánh giá..." />
        ) : reviews.length === 0 ? (
          <EmptyState icon="star" title="Chưa có đánh giá nào" />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Khóa học</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Ngày gửi</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <strong>{review.fullName || `User #${review.userId}`}</strong>
                    </td>
                    <td>{review.courseTitle || `Khóa học #${review.courseId}`}</td>
                    <td>
                      <StarRating value={review.rating} />
                    </td>
                    <td style={{ maxWidth: '280px' }}>{review.comment || '—'}</td>
                    <td>{formatDate(review.createdAt)}</td>
                    <td>
                      <Badge variant={review.status === 'APPROVED' ? 'success' : 'neutral'}>
                        {review.status === 'APPROVED' ? 'Hiển thị' : 'Đã ẩn'}
                      </Badge>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        {review.status !== 'APPROVED' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            loading={updatingId === review.id}
                            onClick={() => changeStatus(review.id, 'APPROVED')}
                          >
                            Hiển thị
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            loading={updatingId === review.id}
                            onClick={() => changeStatus(review.id, 'HIDDEN')}
                          >
                            Ẩn
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
