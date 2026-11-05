import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/useAuth';

export default function AdminUserPage() {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
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
                            status: status || undefined,
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
    }, [search, role, status, page]);

    async function toggleStatus(user) {
        const nextStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        const action = nextStatus === 'BLOCKED' ? 'khóa' : 'mở khóa';
        if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.email}?`)) return;

        setUpdatingId(user.id);
        setError('');
        try {
            const response = await client.patch(`/api/admin/users/${user.id}/status`, { status: nextStatus });
            setUsers(current => current.map(item => item.id === user.id ? response.data : item));
        } catch (err) {
            setError(err.response?.data?.message || `Không thể ${action} tài khoản`);
        } finally {
            setUpdatingId(null);
        }
    }

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

                <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} aria-label="Lọc trạng thái">
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="BLOCKED">Đã khóa</option>
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
                                <th>Thao tác</th>
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
                                    <td><button type="button" disabled={updatingId === user.id || user.id === currentUser?.id} onClick={() => toggleStatus(user)}>{updatingId === user.id ? 'Đang cập nhật…' : user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</button></td>
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
