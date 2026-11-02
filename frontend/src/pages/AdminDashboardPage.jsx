import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Alert, Card, Icon, Spinner } from '../components/ui';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await client.get('/api/admin/dashboard/summary');
        if (active) {
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Không thể tải thống kê hệ thống');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <Spinner label="Đang tải thống kê..." />;
  }

  const statistics = [
    {
      title: 'Tổng người dùng',
      value: data?.totalUsers ?? 0,
      icon: 'user',
      to: '/admin/users',
    },
    {
      title: 'Tổng khóa học',
      value: data?.totalCourses ?? 0,
      icon: 'book',
      to: '/admin/courses',
    },
    {
      title: 'Lượt đăng ký học',
      value: data?.totalEnrollments ?? 0,
      icon: 'award',
      to: '/admin/enrollments',
    },
    {
      title: 'Đánh giá khóa học',
      value: data?.totalReviews ?? 0,
      icon: 'star',
      to: '/admin/reviews',
    },
  ];

  return (
    <div className="stack">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Tổng quan hệ thống</h1>
          <p className="text-muted">Số liệu thống kê thời gian thực của toàn bộ nền tảng học trực tuyến.</p>
        </div>
      </div>

      <Alert variant="error">{error}</Alert>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
        }}
      >
        {statistics.map((item) => (
          <Link key={item.title} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div className="text-muted" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px' }}>
                    {Number(item.value).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="feature-icon" style={{ margin: 0 }}>
                  <Icon name={item.icon} size={22} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

