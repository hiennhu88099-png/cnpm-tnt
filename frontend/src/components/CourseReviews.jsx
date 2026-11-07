import { useCallback, useState } from 'react';
import { reviewApi } from '../api/reviewApi';
import { useAuth } from '../auth/useAuth';
import useApiQuery from '../hooks/useApiQuery';
import { Alert, Avatar, Button, Card, CustomSelect, EmptyState, StarRating } from './ui';
import { formatDate } from '../utils/format';

export default function CourseReviews({ courseId, isEnrolled = false }) {
  const { user, isAuthenticated } = useAuth();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReviewBundle = useCallback(async () => {
    const [reviewData, summaryData] = await Promise.all([
      reviewApi.getReviews(courseId),
      reviewApi.getSummary(courseId),
    ]);
    return {
      reviews: reviewData.content || [],
      summary: summaryData,
    };
  }, [courseId]);

  const { data: bundle, error: queryError, loading, reload } = useApiQuery(fetchReviewBundle);
  const reviews = bundle?.reviews ?? [];
  const summary = bundle?.summary ?? null;
  const error = actionError || queryError?.message || '';

  const myReview = user ? reviews.find((r) => r.userId === user.id) : null;

  async function handleSubmit(event) {
    event.preventDefault();
    setActionError('');
    setMessage('');
    setSaving(true);

    try {
      await reviewApi.createReview({
        courseId: Number(courseId),
        rating: Number(rating),
        comment: comment.trim(),
      });
      setMessage('Cảm ơn bạn đã gửi đánh giá khóa học!');
      setComment('');
      setRating(5);
      reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Bạn cần đăng ký khóa học trước khi gửi đánh giá.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reviewId) {
    setActionError('');
    setMessage('');
    try {
      await reviewApi.deleteReview(reviewId);
      setMessage('Đã xóa đánh giá của bạn.');
      reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể xóa đánh giá');
    }
  }

  return (
    <div className="stack">
      {summary && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1 }}>
                {Number(summary.averageRating || 0).toFixed(1)}
                <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)' }}> / 5</span>
              </div>
              <div style={{ marginTop: '6px' }}>
                <StarRating value={Number(summary.averageRating || 0)} count={summary.reviewCount || 0} />
              </div>
            </div>
            <div className="text-muted">
              Dựa trên <strong>{summary.reviewCount || 0}</strong> nhận xét từ học viên đã tham gia khóa học.
            </div>
          </div>
        </Card>
      )}

      <Alert variant="error">{error}</Alert>
      <Alert variant="success">{message}</Alert>

      {isAuthenticated && isEnrolled && !myReview && (
        <Card title="Viết đánh giá của bạn" subtitle="Chia sẻ trải nghiệm học tập của bạn với các học viên khác.">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="review-rating">
                Mức độ hài lòng
              </label>
              <CustomSelect
                id="review-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{ maxWidth: '280px' }}
              >
                <option value={5}>★★★★★ — 5 sao (Rất tuyệt vời)</option>
                <option value={4}>★★★★☆ — 4 sao (Tốt)</option>
                <option value={3}>★★★☆☆ — 3 sao (Khá)</option>
                <option value={2}>★★☆☆☆ — 2 sao (Trung bình)</option>
                <option value={1}>★☆☆☆☆ — 1 sao (Cần cải thiện)</option>
              </CustomSelect>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="review-comment">
                Nội dung nhận xét
              </label>
              <textarea
                id="review-comment"
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Khóa học giúp ích gì cho bạn? Giảng viên truyền đạt thế nào?"
                maxLength={5000}
                rows={4}
              />
            </div>

            <div className="form-actions">
              <Button type="submit" loading={saving}>
                {saving ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title={`Nhận xét của học viên (${reviews.length})`}>
        {loading ? (
          <p className="text-muted">Đang tải đánh giá...</p>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon="star"
            title="Chưa có đánh giá nào"
            description="Hãy đăng ký khóa học và trở thành người đầu tiên để lại đánh giá."
          />
        ) : (
          <div className="stack">
            {reviews.map((review) => (
              <article
                key={review.id}
                style={{
                  display: 'flex',
                  gap: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <Avatar src={review.avatar} name={review.fullName || 'Học viên'} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <strong>{review.fullName || 'Học viên'}</strong>
                    <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div style={{ margin: '4px 0 8px' }}>
                    <StarRating value={review.rating} />
                  </div>
                  {review.comment && <p style={{ margin: 0 }}>{review.comment}</p>}
                  {user && (user.id === review.userId || user.role === 'ADMIN') && (
                    <div style={{ marginTop: '8px' }}>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(review.id)}>
                        Xóa đánh giá
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
