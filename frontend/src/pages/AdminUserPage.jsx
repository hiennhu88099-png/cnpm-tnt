import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdminUserPage() {

    const [users, setUsers] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function loadUsers() {
            setLoading(true);
            setError('');

            try {
                const response = await client.get(
                    '/api/admin/users/search',
                    {
                        params: {
                            keyword: search || undefined,
                            role: role || undefined,
                            page,
                            size: 10
                        }
                    }
                );

                if (active) {
                    const result = response.data;
                    setUsers(result.content ?? []);
                    setTotalPages(result.totalPages ?? 0);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        'Không thể tải người dùng'
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadUsers();

        return () => {
            active = false;
        };
    }, [search, role, page]);

    function handleSearch(event) {
        event.preventDefault();
        setPage(0);
        setSearch(keyword.trim());
    }

    return (
        <div className="container section">
            <h1>Quản lý người dùng</h1>

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
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="Tìm tên hoặc email"
                    aria-label="Tìm người dùng"
                />

                <select
                    value={role}
                    onChange={e => {
                        setRole(e.target.value);
                        setPage(0);
                    }}
                    aria-label="Lọc vai trò"
                >
                    <option value="">Tất cả vai trò</option>
                    <option value="USER">Học viên</option>
                    <option value="ADMIN">Admin</option>
                </select>

                <button type="submit">
                    Tìm kiếm
                </button>
            </form>

            {error && <p role="alert">{error}</p>}

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>{user.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <p>Không tìm thấy người dùng.</p>
                    )}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
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
                    disabled={loading || page + 1 >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Trang sau
                </button>
            </div>
        </div>
    );
}
