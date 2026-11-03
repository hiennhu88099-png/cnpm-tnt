import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Icon } from '../components/ui';

const number = value => Number(value ?? 0).toLocaleString('vi-VN');

const metrics = [
    { key: 'totalUsers', title: 'Người dùng', caption: 'Tổng tài khoản', icon: 'users', tone: 'violet', href: '/admin/users' },
    { key: 'totalCourses', title: 'Khóa học', caption: 'Tất cả trạng thái', icon: 'book', tone: 'blue', href: '/admin/courses' },
    { key: 'totalEnrollments', title: 'Lượt đăng ký', caption: 'Tất cả trạng thái', icon: 'checkCircle', tone: 'green', href: '/admin/enrollments' },
    { key: 'totalReviews', title: 'Đánh giá', caption: 'Tất cả trạng thái', icon: 'star', tone: 'amber', href: '/admin/reviews' },
];

function Breakdown({ title, rows }) {
    return <section className="admin-panel">
        <h2>{title}</h2>
        <div className="admin-breakdown">
            {rows.map(([label, value, tone]) => <div className="admin-breakdown-row" key={label}>
                <span><i className={`admin-dot ${tone}`} />{label}</span>
                <strong>{number(value)}</strong>
            </div>)}
        </div>
    </section>;
}

export default function AdminDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    async function loadDashboard({ initial = false } = {}) {
        if (initial) setLoading(true);
        else setRefreshing(true);
        setError('');
        try {
            const response = await client.get('/api/admin/dashboard/summary');
            setData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải thống kê. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => { loadDashboard({ initial: true }); }, []);

    if (loading) {
        return <p>Đang tải thống kê...</p>;
    }

    return (
        <div className="container section admin-dashboard">
            <header className="admin-dashboard-header">
                <div><span className="page-header-eyebrow">TRUNG TÂM ĐIỀU HÀNH</span><h1>Tổng quan hệ thống</h1><p>Theo dõi tình hình vận hành và truy cập nhanh các mục quản trị.</p></div>
                <button className="btn btn-secondary" type="button" onClick={() => loadDashboard()} disabled={refreshing}>
                    <Icon name="trendingUp" size={16} />{refreshing ? 'Đang cập nhật…' : 'Làm mới số liệu'}
                </button>
            </header>
            {error && <div className="alert alert-error" role="alert">{error}<button className="btn btn-sm btn-secondary" onClick={() => loadDashboard()}>Thử lại</button></div>}
            <div className="admin-metric-grid">
                {metrics.map(item => <Link className={`admin-metric-card ${item.tone}`} to={item.href} key={item.key}>
                    <div className="admin-metric-top"><span>{item.title}</span><span className="admin-metric-icon"><Icon name={item.icon} size={19} /></span></div>
                    <strong>{number(data?.[item.key])}</strong><small>{item.caption}</small>
                    <span className="admin-metric-link">Xem chi tiết <Icon name="arrowRight" size={14} /></span>
                </Link>)}
            </div>
            <div className="admin-dashboard-lower">
                <Breakdown title="Tài khoản" rows={[
                    ['Đang hoạt động', data?.activeUsers, 'green'], ['Đã khóa', data?.blockedUsers, 'red']
                ]} />
                <Breakdown title="Khóa học & đăng ký" rows={[
                    ['Đã xuất bản', data?.publishedCourses, 'green'], ['Bản nháp', data?.draftCourses, 'amber'],
                    ['Đang học', data?.activeEnrollments, 'blue'], ['Đã hoàn thành', data?.completedEnrollments, 'green']
                ]} />
                <Breakdown title="Đánh giá" rows={[
                    ['Đã duyệt', data?.approvedReviews, 'green'], ['Chờ xử lý', data?.pendingReviews, 'amber'],
                    ['Đã ẩn', data?.hiddenReviews, 'red']
                ]} />
                <section className="admin-panel admin-rating-panel"><h2>Điểm trung bình</h2><div className="admin-rating-value"><Icon name="star" size={24} />{Number(data?.averageRating ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span>/ 5</span></div><p>Tính trên các đánh giá đã duyệt</p><Link to="/admin/reviews">Kiểm duyệt đánh giá <Icon name="arrowRight" size={14} /></Link></section>
            </div>
        </div>
    );
}
