import { useCallback, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../auth/useAuth';
import useApiQuery from '../hooks/useApiQuery';
import Pagination from '../components/course/Pagination';
import { Alert, Badge, Button, Card, EmptyState, Spinner } from '../components/ui';
import { ROLE_LABELS } from '../config/site';

export default function AdminUserPage() {
  const { user: currentUser } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchUsers = useCallback(
    () =>
      client
        .get('/api/admin/users/search', {
          params: {
            keyword: search || undefined,
            role: role || undefined,
            page,
            size: 10,
          },
        })
        .then((res) => res.data),
    [search, role, page],
  );

  const { data: result, error: queryError, loading, reload } = useApiQuery(fetchUsers);
  const users = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const error = actionError || queryError?.message || '';

  function handleSearch(event) {
    event.preventDefault();
    setPage(0);
    setSearch(keyword.trim());
  }

  async function toggleStatus(targetUser) {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    setUpdatingId(targetUser.id);
    setActionError('');
    try {
      await client.patch(`/api/admin/users/${targetUser.id}/status`, { status: nextStatus });
      reload();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="stack">
      <div className="admin-head">
        <div>
          <h1 className="admin-title">Quản lý người dùng</h1>
          <p className="text-muted">Tìm kiếm học viên, lọc vai trò và khóa/mở khóa tài khoản.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="course-filters" style={{ marginBottom: 0 }}>
          <input
            className="input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo họ tên hoặc email..."
            aria-label="Tìm người dùng"
          />
          <select
            className="input"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(0);
            }}
            aria-label="Lọc vai trò"
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">Học viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
          <Button type="submit">Tìm kiếm</Button>
        </form>
      </Card>

      <Alert variant="error">{error}</Alert>

      <Card>
        {loading ? (
          <Spinner label="Đang tải danh sách người dùng..." />
        ) : users.length === 0 ? (
          <EmptyState icon="user" title="Không tìm thấy người dùng phù hợp" />
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isActive = u.status === 'ACTIVE';
                  return (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>
                        <strong>{u.fullName}</strong>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <Badge variant={u.role === 'ADMIN' ? 'primary' : 'neutral'}>
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={isActive ? 'success' : 'danger'}>
                          {isActive ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td>
                        {!isSelf && (
                          <Button
                            type="button"
                            size="sm"
                            variant={isActive ? 'danger' : 'secondary'}
                            loading={updatingId === u.id}
                            onClick={() => toggleStatus(u)}
                          >
                            {isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
