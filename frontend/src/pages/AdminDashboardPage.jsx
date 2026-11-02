import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdminDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            try {
                const response = await client.get(
                    '/api/admin/dashboard/summary'
                );

                if (active) {
                    setData(response.data);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        'Không thể tải thống kê'
                    );
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
        return <p>Đang tải thống kê...</p>;
    }

    if (error) {
        return <p role="alert">{error}</p>;
    }

    const statistics = [
        {
            title: 'Tổng người dùng',
            value: data?.totalUsers ?? 0
        },
        {
            title: 'Tổng khóa học',
            value: data?.totalCourses ?? 0
        },
        {
            title: 'Lượt đăng ký',
            value: data?.totalEnrollments ?? 0
        },
        {
            title: 'Tổng đánh giá',
            value: data?.totalReviews ?? 0
        }
    ];

    return (
        <div className="container section">
            <h1>Tổng quan hệ thống</h1>
            <p>Thống kê dữ liệu quản lý khóa học.</p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '20px',
                    marginTop: '24px'
                }}
            >
                {statistics.map(item => (
                    <div
                        key={item.title}
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: '12px',
                            padding: '24px'
                        }}
                    >
                        <h3>{item.title}</h3>
                        <p
                            style={{
                                fontSize: '30px',
                                fontWeight: 'bold'
                            }}
                        >
                            {item.value.toLocaleString('vi-VN')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
