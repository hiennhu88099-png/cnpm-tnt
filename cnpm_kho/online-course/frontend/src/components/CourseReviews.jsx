import { useCallback, useEffect, useState } from 'react';

import { reviewApi } from '../api/reviewApi';
import { useAuth } from '../auth/useAuth';

export default function CourseReviews({ courseId }) {

    const { isAuthenticated } = useAuth();

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
            const [reviewData, summaryData] =
                await Promise.all([
                    reviewApi.getReviews(courseId),
                    reviewApi.getSummary(courseId)
                ]);

            setReviews(reviewData.content || []);
            setSummary(summaryData);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Không thể tải đánh giá'
            );
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

            setMessage('Đánh giá thành công!');
            setComment('');
            setRating(5);

            await loadReviews();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Không thể gửi đánh giá'
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section>
            <h2>Đánh giá khóa học</h2>

            {summary && (
                <div>
                    <h3>
                        {summary.averageRating.toFixed(1)} / 5
                    </h3>

                    <p>
                        {summary.reviewCount} lượt đánh giá
                    </p>
                </div>
            )}

            {error && (
                <p role="alert" style={{ color: 'red' }}>
                    {error}
                </p>
            )}

            {message && (
                <p role="status" style={{ color: 'green' }}>
                    {message}
                </p>
            )}

            {isAuthenticated && (
                <form onSubmit={handleSubmit}>
                    <h3>Viết đánh giá</h3>

                    <label htmlFor="review-rating">
                        Số sao
                    </label>

                    <select
                        id="review-rating"
                        value={rating}
                        onChange={e =>
                            setRating(Number(e.target.value))
                        }
                    >
                        <option value={5}>5 sao</option>
                        <option value={4}>4 sao</option>
                        <option value={3}>3 sao</option>
                        <option value={2}>2 sao</option>
                        <option value={1}>1 sao</option>
                    </select>

                    <div style={{ marginTop: '15px' }}>
                        <label htmlFor="review-comment">
                            Nội dung đánh giá
                        </label>

                        <textarea
                            id="review-comment"
                            value={comment}
                            onChange={e =>
                                setComment(e.target.value)
                            }
                            maxLength={5000}
                            rows={4}
                            style={{
                                display: 'block',
                                width: '100%'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{ marginTop: '12px' }}
                    >
                        {saving
                            ? 'Đang gửi...'
                            : 'Gửi đánh giá'}
                    </button>
                </form>
            )}

            <h3>Nhận xét của học viên</h3>

            {loading && <p>Đang tải đánh giá...</p>}

            {!loading && reviews.length === 0 && (
                <p>Chưa có đánh giá nào.</p>
            )}

            {reviews.map(review => (
                <article
                    key={review.id}
                    style={{
                        borderBottom: '1px solid #ddd',
                        padding: '16px 0'
                    }}
                >
                    <strong>
                        {review.fullName || 'Học viên'}
                    </strong>

                    <p>
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                    </p>

                    <p>{review.comment}</p>
                </article>
            ))}
        </section>
    );
}
