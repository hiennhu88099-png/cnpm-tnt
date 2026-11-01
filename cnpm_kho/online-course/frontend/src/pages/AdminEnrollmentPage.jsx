import { useEffect, useState } from 'react';
import { enrollmentApi } from '../api/enrollmentApi';

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
                const data =
                    await enrollmentApi.getAllEnrollments({
                        ...filters,
                        page,
                        size: 10
                    });

                if (active) {
                    setEnrollments(data.content ?? []);
                    setTotalPages(data.totalPages ?? 0);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        'Không thể tải danh sách đăng ký'
                    );
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
            courseId: courseId.trim() || undefined
        });
    }

    return (
        <div className="container section">

            <h1>Quản lý đăng ký khóa học</h1>

            <form
                onSubmit={handleSearch}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '20px'
                }}
            >
                <input
                    type="number"
                    min="1"
                    placeholder="ID học viên"
                    aria-label="ID học viên"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                />

                <input
                    type="number"
                    min="1"
                    placeholder="ID khóa học"
                    aria-label="ID khóa học"
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                />

                <button type="submit">
                    Tìm kiếm
                </button>
            </form>

            {error && <p role="alert">{error}</p>}

            {loading ? (
                <p>Đang tải danh sách đăng ký...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Học viên</th>
                                <th>Khóa học</th>
                                <th>Trạng thái</th>
                                <th>Tiến độ</th>
                            </tr>
                        </thead>

                        <tbody>
                            {enrollments.map(item => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>
                                        {item.userId}
                                    </td>
                                    <td>
                                        {item.courseTitle ||
                                            item.courseId}
                                    </td>
                                    <td>{item.status}</td>
                                    <td>
                                        {item.progressPercent ??
                                            item.progressPercentage ??
                                            0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {enrollments.length === 0 && (
                        <p>Không có lượt đăng ký phù hợp.</p>
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
