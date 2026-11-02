import { useCallback, useEffect, useState } from 'react';
import { reviewApi } from '../api/reviewApi';
import { useAuth } from '../auth/useAuth';
import { Alert, Avatar, Button, Card, EmptyState, StarRating } from './ui';
import { formatDate } from '../utils/format';

export default function CourseReviews({ courseId }) {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const [reviewData, summaryData] = await Promise.all([
        reviewApi.getReviews(courseId),
        reviewApi.getSummary(courseId)
      ]);

      setReviews(reviewData.content || []);
      setSummary(summaryData);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải đánh giá');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      await reviewApi.createReview({
        courseId: Number(courseId),
        rating: Number(rating),
        comment: comment.trim()
      });

      setMessage('Đánh giá của bạn đã được gửi thành công!');
      setComment('');
      setRating(5);
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="course-reviews" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {summary && (
        <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--color-primary, #6366f1)' }}>
              {summary.averageRating != null ? summary.averageRating.toFixed(1) : '5.0'}
            </div>
            <div style={{ marginTop: '0.25rem' }}>
              <StarRating value={summary.averageRating ?? 5} />
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #64748b)', marginTop: '0.25rem' }}>
              {summary.reviewCount ?? 0} lượt đánh giá
            </div>
          </div>
          <div style={{ flex: 1, fontSize: '0.95rem', color: 'var(--color-text-muted, #64748b)' }}>
            Đánh giá trung bình từ các học viên đã hoàn thành hoặc đang tham gia khóa học này.
          </div>
        </Card>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      {isAuthenticated ? (
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Viết đánh giá của bạn</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="review-rating" style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                Đánh giá chất lượng:
              </label>
              <select
                id="review-rating"
                className="form-control"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius, 8px)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  background: 'var(--color-bg, #fff)',
                  color: 'inherit'
                }}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 sao - Tuyệt vời)</option>
                <option value={4}>⭐⭐⭐⭐ (4 sao - Rất tốt)</option>
                <option value={3}>⭐⭐⭐ (3 sao - Khá)</option>
                <option value={2}>⭐⭐ (2 sao - Cần cải thiện)</option>
                <option value={1}>⭐ (1 sao - Chưa đạt)</option>
              </select>
            </div>

            <div>
              <label htmlFor="review-comment" style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem' }}>
                Cảm nhận chi tiết:
              </label>
              <textarea
                id="review-comment"
                className="form-control"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={5000}
                rows={3}
                placeholder="Chia sẻ nhận xét của bạn về nội dung bài giảng, giảng viên..."
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius, 8px)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  background: 'var(--color-bg, #fff)',
                  color: 'inherit',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <Button type="submit" loading={saving} disabled={!comment.trim()}>
                Gửi đánh giá
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-muted, #64748b)' }}>
            Đăng nhập để chia sẻ cảm nhận của bạn về khóa học.
          </p>
          <Button to="/login" variant="ghost" size="sm">Đăng nhập ngay</Button>
        </Card>
      )}

      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          Nhận xét của học viên ({reviews.length})
        </h3>

        {loading && <p style={{ color: 'var(--color-text-muted, #64748b)' }}>Đang tải đánh giá...</p>}

        {!loading && reviews.length === 0 && (
          <EmptyState
            icon="star"
            title="Chưa có đánh giá nào"
            description="Hãy là người đầu tiên tham gia học và để lại nhận xét cho khóa học này!"
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((review) => (
            <Card key={review.id} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Avatar name={review.fullName || 'Học viên'} size={36} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{review.fullName || 'Học viên'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                </div>
                <StarRating value={review.rating} />
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: 'inherit', lineHeight: 1.6 }}>
                {review.comment}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
