import { useCallback, useEffect, useState } from 'react';

import { reviewApi } from '../api/reviewApi';

export default function AdminReviewPage() {

    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState('');

    const loadReviews = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await reviewApi.getAdminReviews({
                page,
                size: 10
            });

            setReviews(data.content ?? []);
            setTotalPages(data.totalPages ?? 0);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Không thể tải đánh giá'
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    async function changeStatus(id, status) {
        setUpdatingId(id);
        setError('');

        try {
            await reviewApi.updateReviewStatus(id, status);
            await loadReviews();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Không thể cập nhật trạng thái'
            );
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <div className="container section">

            <h1>Quản lý đánh giá</h1>

            <p>
                Kiểm tra và quản lý các đánh giá khóa học.
            </p>

            {error && <p role="alert">{error}</p>}

            {loading ? (
                <p>Đang tải đánh giá...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Học viên</th>
                                <th>Khóa học</th>
                                <th>Số sao</th>
                                <th>Nội dung</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {reviews.map(review => (
                                <tr key={review.id}>
                                    <td>{review.id}</td>
                                    <td>{review.fullName}</td>
                                    <td>{review.courseTitle}</td>
                                    <td>{review.rating}/5</td>
                                    <td>{review.comment}</td>
                                    <td>{review.status}</td>
                                    <td>
                                        {review.status !== 'APPROVED' && (
                                            <button
                                                type="button"
                                                disabled={
                                                    updatingId === review.id
                                                }
                                                onClick={() =>
                                                    changeStatus(
                                                        review.id,
                                                        'APPROVED'
                                                    )
                                                }
                                            >
                                                Hiển thị
                                            </button>
                                        )}

                                        {review.status !== 'HIDDEN' && (
                                            <button
                                                type="button"
                                                disabled={
                                                    updatingId === review.id
                                                }
                                                onClick={() =>
                                                    changeStatus(
                                                        review.id,
                                                        'HIDDEN'
                                                    )
                                                }
                                            >
                                                Ẩn
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {reviews.length === 0 && (
                        <p>Chưa có đánh giá nào.</p>
                    )}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginTop: '20px'
                }}
            >
                <button
                    type="button"
                    disabled={page === 0 || loading}
                    onClick={() => setPage(p => p - 1)}
                >
                    Trang trước
                </button>

                <span>
                    Trang {page + 1} / {Math.max(1, totalPages)}
                </span>

                <button
                    type="button"
                    disabled={
                        loading ||
                        page + 1 >= totalPages
                    }
                    onClick={() => setPage(p => p + 1)}
                >
                    Trang sau
                </button>
            </div>
        </div>
    );
}
