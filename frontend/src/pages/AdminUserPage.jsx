import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { useAuth } from '../auth/useAuth';
import useApiQuery from '../hooks/useApiQuery';
import Pagination from '../components/course/Pagination';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  PageHeader,
  PageLoading,
  ProgressBar,
} from '../components/ui';
import { ROLE_LABELS } from '../config/site';
import { formatDate, formatNumber, formatPrice } from '../utils/format';

const EMPTY_USER_FORM = {
  id: null,
  email: '',
  fullName: '',
  phone: '',
  role: 'USER',
  status: 'ACTIVE',
  password: '',
  newPassword: '',
};

export default function AdminUserPage() {
  const { user: currentUser } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [notice, setNotice] = useState({ type: 'success', text: '' });

  // Thống kê tổng quan & dữ liệu khóa học đã đăng ký của từng user
  const [allUsersList, setAllUsersList] = useState([]);
  const [enrollmentsByUser, setEnrollmentsByUser] = useState({});
  const [courseMap, setCourseMap] = useState({});

  // Modal Xem chi tiết học viên & khóa học
  const [detailUser, setDetailUser] = useState(null);

  // Modal Thêm / Sửa / Phân quyền / Đổi mật khẩu
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_USER_FORM);
  const [formError, setFormError] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  const fetchAuxData = useCallback(async () => {
    const [usersAllRes, enrollmentsRes, coursesRes] = await Promise.all([
      client
        .get('/api/admin/users')
        .then((r) => r.data)
        .catch(() => []),
      enrollmentApi.getAllEnrollments({ page: 0, size: 200 }).catch(() => ({ content: [] })),
      courseApi.getAdminCourses({ page: 0, size: 100 }).catch(() => ({ content: [] })),
    ]);

    const usersArr = Array.isArray(usersAllRes) ? usersAllRes : usersAllRes?.content ?? [];

    const cMap = {};
    (coursesRes?.content ?? []).forEach((c) => {
      cMap[c.id] = c;
    });

    const grouped = {};
    (enrollmentsRes?.content ?? []).forEach((enr) => {
      if (!grouped[enr.userId]) grouped[enr.userId] = [];
      grouped[enr.userId].push(enr);
    });

    return { usersArr, cMap, grouped };
  }, []);

  const refreshAuxData = useCallback(() => {
    fetchAuxData().then(({ usersArr, cMap, grouped }) => {
      setAllUsersList(usersArr);
      setCourseMap(cMap);
      setEnrollmentsByUser(grouped);
    });
  }, [fetchAuxData]);

  useEffect(() => {
    let active = true;
    fetchAuxData().then(({ usersArr, cMap, grouped }) => {
      if (!active) return;
      setAllUsersList(usersArr);
      setCourseMap(cMap);
      setEnrollmentsByUser(grouped);
    });
    return () => {
      active = false;
    };
  }, [fetchAuxData]);

  const fetchUsers = useCallback(
    () =>
      client
        .get('/api/admin/users/search', {
          params: {
            keyword: search || undefined,
            role: role || undefined,
            status: status || undefined,
            page,
            size: 10,
          },
        })
        .then((res) => res.data),
    [search, role, status, page],
  );

  const { data: result, error, loading, reload } = useApiQuery(fetchUsers);

  function handleSearch(event) {
    event.preventDefault();
    setPage(0);
    setSearch(keyword.trim());
  }

  function clearFilters() {
    setKeyword('');
    setSearch('');
    setRole('');
    setStatus('');
    setPage(0);
  }

  async function toggleStatus(targetUser) {
    const nextStatus = targetUser.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const actionLabel = nextStatus === 'BLOCKED' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản "${targetUser.email}"?`)) return;

    setUpdatingId(targetUser.id);
    setNotice({ type: 'success', text: '' });
    try {
      await client.patch(`/api/admin/users/${targetUser.id}/status`, { status: nextStatus });
      setNotice({
        type: 'success',
        text: `Đã ${actionLabel} tài khoản ${targetUser.email}.`,
      });
      reload();
      refreshAuxData();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || `Không thể ${actionLabel} tài khoản.`,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  function openCreateModal() {
    setFormData(EMPTY_USER_FORM);
    setFormError('');
    setFormModalOpen(true);
  }

  function openEditModal(u) {
    setFormData({
      id: u.id,
      email: u.email || '',
      fullName: u.fullName || '',
      phone: u.phone || '',
      role: u.role || 'USER',
      status: u.status || 'ACTIVE',
      password: '',
      newPassword: '',
    });
    setFormError('');
    setFormModalOpen(true);
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setFormError('Họ và tên phải có từ 2 ký tự trở lên.');
      return;
    }

    if (!formData.id) {
      if (!formData.email.trim()) {
        setFormError('Vui lòng nhập địa chỉ Email.');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setFormError('Mật khẩu khởi tạo phải có ít nhất 6 ký tự.');
        return;
      }
    } else if (formData.newPassword && formData.newPassword.length < 6) {
      setFormError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setSubmittingForm(true);
    try {
      if (formData.id) {
        await client.put(`/api/admin/users/${formData.id}`, {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          status: formData.status,
          newPassword: formData.newPassword ? formData.newPassword : null,
        });
        setNotice({
          type: 'success',
          text: `Đã cập nhật thông tin tài khoản ${formData.email}.`,
        });
      } else {
        await client.post('/api/admin/users', {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          status: formData.status,
          password: formData.password,
        });
        setNotice({
          type: 'success',
          text: `Đã tạo tài khoản mới cho ${formData.email}.`,
        });
      }
      setFormModalOpen(false);
      reload();
      refreshAuxData();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          'Không thể lưu thông tin người dùng. Vui lòng kiểm tra lại dữ liệu.',
      );
    } finally {
      setSubmittingForm(false);
    }
  }

  function handleExportCsv() {
    const source = allUsersList.length > 0 ? allUsersList : result?.content ?? [];
    if (source.length === 0) return;

    const headers = ['ID', 'Ho va ten', 'Email', 'So dien thoai', 'Vai tro', 'Trang thai', 'So khoa hoc', 'Ngay tham gia'];
    const rows = source.map((u) => {
      const enrCount = (enrollmentsByUser[u.id] || []).length;
      return [
        u.id,
        `"${(u.fullName || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${(u.phone || '').replace(/"/g, '""')}"`,
        u.role,
        u.status,
        enrCount,
        u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '',
      ].join(',');
    });

    const csvContent = `\uFEFF${[headers.join(','), ...rows].join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-nguoi-dung-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !result && !error) return <PageLoading text="Đang tải danh sách người dùng..." />;

  const users = result?.content ?? [];
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? users.length;
  const hasFilters = Boolean(search || role || status);

  const totalCount = allUsersList.length || totalElements;
  const activeCount = allUsersList.filter((u) => u.status === 'ACTIVE').length;
  const blockedCount = allUsersList.filter((u) => u.status === 'BLOCKED').length;
  const adminCount = allUsersList.filter((u) => u.role === 'ADMIN').length;

  const detailEnrollments = detailUser ? enrollmentsByUser[detailUser.id] || [] : [];
  const detailTotalSpent = detailEnrollments.reduce((sum, enr) => {
    if (enr.status === 'CANCELLED') return sum;
    return sum + Number(courseMap[enr.courseId]?.price ?? 0);
  }, 0);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Quản lý Người dùng"
        subtitle="Theo dõi hồ sơ học viên, tiến độ ghi danh khóa học, phân quyền và quản lý trạng thái tài khoản."
        actions={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={handleExportCsv}>
              Xuất file .CSV
            </Button>
            <Button onClick={openCreateModal}>
              <Icon name="plus" size={16} /> Thêm tài khoản
            </Button>
          </div>
        }
      />

      <Alert variant={notice.type}>{notice.text}</Alert>

      {/* 4 Thẻ KPI thống kê người dùng */}
      <div className="nx-dash-stats-grid">
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Tổng số tài khoản</div>
          <div className="nx-dash-stat-value">{formatNumber(totalCount)}</div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang hoạt động</div>
          <div className="nx-dash-stat-value" style={{ color: '#059669' }}>
            {formatNumber(activeCount)}
          </div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang bị khóa</div>
          <div className="nx-dash-stat-value" style={{ color: '#e11d48' }}>
            {formatNumber(blockedCount)}
          </div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Quản trị viên (Admin)</div>
          <div className="nx-dash-stat-value" style={{ color: 'var(--color-primary)' }}>
            {formatNumber(adminCount)}
          </div>
        </div>
      </div>

      <Card>
        <div className="nx-filter-pills" role="tablist" aria-label="Lọc nhanh người dùng">
          {[
            { value: '', roleVal: '', label: 'Tất cả tài khoản' },
            { value: 'ACTIVE', roleVal: '', label: 'Đang hoạt động' },
            { value: 'BLOCKED', roleVal: '', label: 'Đã khóa' },
            { value: '', roleVal: 'USER', label: 'Học viên' },
            { value: '', roleVal: 'ADMIN', label: 'Quản trị viên' },
          ].map((tab) => {
            const isTabActive = status === tab.value && role === tab.roleVal;
            return (
              <button
                key={`${tab.value}-${tab.roleVal || 'ALL'}`}
                type="button"
                className={`nx-filter-pill${isTabActive ? ' is-active' : ''}`}
                onClick={() => {
                  setStatus(tab.value);
                  setRole(tab.roleVal);
                  setPage(0);
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form className="admin-toolbar" onSubmit={handleSearch} role="search">
          <div className="catalog-search">
            <label htmlFor="admin-user-search" className="sr-only">
              Tìm người dùng
            </label>
            <input
              id="admin-user-search"
              className="input"
              type="search"
              placeholder="Tìm theo họ tên hoặc địa chỉ email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              Tìm
            </Button>
          </div>

          <label htmlFor="admin-user-role" className="sr-only">
            Vai trò
          </label>
          <select
            id="admin-user-role"
            className="input"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">Học viên</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>

          <label htmlFor="admin-user-status" className="sr-only">
            Trạng thái
          </label>
          <select
            id="admin-user-status"
            className="input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="BLOCKED">Đã khóa</option>
          </select>
        </form>

        {error ? (
          <Alert variant="error">
            {error.message}{' '}
            <button type="button" className="text-link" onClick={reload}>
              Thử lại
            </button>
          </Alert>
        ) : users.length === 0 ? (
          <EmptyState
            icon="users"
            title={hasFilters ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
            description={
              hasFilters
                ? 'Thử đổi từ khóa hoặc xóa bộ lọc để xem toàn bộ danh sách.'
                : 'Danh sách tài khoản đăng ký sẽ hiển thị tại đây.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <div className="catalog-summary" aria-live="polite">
              <span>Hiển thị {formatNumber(totalElements)} tài khoản</span>
              {hasFilters && (
                <button type="button" className="text-link" onClick={clearFilters}>
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className={`table-wrap${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Thành viên</th>
                    <th scope="col">Số điện thoại</th>
                    <th scope="col">Khóa đã ĐK</th>
                    <th scope="col">Vai trò</th>
                    <th scope="col">Ngày tham gia</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="nx-th-actions">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    const isActive = u.status === 'ACTIVE';
                    const userEnrollments = enrollmentsByUser[u.id] || [];

                    return (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td>
                          <div className="nx-user-cell">
                            <Avatar src={u.avatar} name={u.fullName} size={38} />
                            <div>
                              <div className="cell-title">
                                {u.fullName}
                                {isSelf && (
                                  <span className="nx-self-chip">Bạn</span>
                                )}
                              </div>
                              <div className="cell-sub">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {u.phone ? (
                            <span style={{ fontWeight: 600 }}>{u.phone}</span>
                          ) : (
                            <span className="text-muted">Chưa cập nhật</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setDetailUser(u)}
                            className="nx-user-courses-pill"
                            title="Xem các khóa học của thành viên này"
                          >
                            <Icon name="book" size={13} />
                            <span>{userEnrollments.length} khóa học</span>
                          </button>
                        </td>
                        <td>
                          <Badge variant={u.role === 'ADMIN' ? 'primary' : 'neutral'}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          <Badge variant={isActive ? 'success' : 'danger'}>
                            {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                          </Badge>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              onClick={() => setDetailUser(u)}
                              className="nx-action-btn is-info"
                              title="Xem chi tiết hồ sơ & khóa học"
                            >
                              <Icon name="eye" size={14} />
                              <span>Chi tiết</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="nx-action-btn is-edit"
                              title="Chỉnh sửa thông tin & phân quyền"
                            >
                              <Icon name="pen" size={14} />
                              <span>Sửa</span>
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                disabled={updatingId === u.id}
                                onClick={() => toggleStatus(u)}
                                className={`nx-action-btn ${isActive ? 'is-danger' : 'is-success'}`}
                                title={isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này'}
                              >
                                <Icon name={isActive ? 'lock' : 'unlock'} size={14} />
                                <span>{isActive ? 'Khóa' : 'Mở khóa'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
          </>
        )}
      </Card>

      {/* Modal 1: Xem chi tiết hồ sơ & Lịch sử khóa học của học viên */}
      {detailUser && (
        <div
          className="voucher-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Hồ sơ học viên"
          onClick={() => setDetailUser(null)}
        >
          <div
            className="voucher-modal-card"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="voucher-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar src={detailUser.avatar} name={detailUser.fullName} size={52} />
                <div>
                  <h3 className="voucher-modal-title">{detailUser.fullName}</h3>
                  <p className="voucher-modal-sub">
                    {detailUser.email} {detailUser.phone ? `· SĐT: ${detailUser.phone}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="voucher-modal-close"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="nx-user-detail-body">
              <div className="nx-user-detail-stats">
                <div className="nx-user-detail-stat">
                  <span>Vai trò</span>
                  <strong>{ROLE_LABELS[detailUser.role] || detailUser.role}</strong>
                </div>
                <div className="nx-user-detail-stat">
                  <span>Ngày tham gia</span>
                  <strong>{formatDate(detailUser.createdAt)}</strong>
                </div>
                <div className="nx-user-detail-stat">
                  <span>Khóa đã đăng ký</span>
                  <strong>{detailEnrollments.length} khóa</strong>
                </div>
                <div className="nx-user-detail-stat">
                  <span>Tổng học phí</span>
                  <strong style={{ color: 'var(--color-primary)' }}>
                    {formatPrice(detailTotalSpent)}
                  </strong>
                </div>
              </div>

              <h4 className="nx-user-detail-Subtitle">
                Danh sách khóa học đã ghi danh ({detailEnrollments.length})
              </h4>

              {detailEnrollments.length === 0 ? (
                <div className="nx-dash-empty-row">
                  Tài khoản này chưa đăng ký khóa học nào.
                </div>
              ) : (
                <div className="nx-user-enr-list">
                  {detailEnrollments.map((enr) => {
                    const c = courseMap[enr.courseId];
                    const pct = Math.round(Number(enr.progress ?? 0));
                    return (
                      <div key={enr.id} className="nx-user-enr-item">
                        <div className="nx-user-enr-top">
                          <Link
                            to={`/courses/${enr.courseId}`}
                            className="nx-user-enr-title"
                            onClick={() => setDetailUser(null)}
                          >
                            {enr.title || c?.title || `Khóa học #${enr.courseId}`}
                          </Link>
                          <Badge
                            variant={
                              enr.status === 'COMPLETED'
                                ? 'success'
                                : enr.status === 'CANCELLED'
                                  ? 'danger'
                                  : 'primary'
                            }
                          >
                            {enr.status === 'COMPLETED'
                              ? 'Hoàn thành'
                              : enr.status === 'CANCELLED'
                                ? 'Đã hủy'
                                : 'Đang học'}
                          </Badge>
                        </div>

                        <div className="nx-user-enr-meta">
                          <span>Ngày ĐK: {formatDate(enr.enrolledAt)}</span>
                          <span>Học phí: {formatPrice(c?.price ?? 0)}</span>
                          <span>Tiến độ: {pct}%</span>
                        </div>

                        <ProgressBar value={pct} label={false} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="voucher-modal-footer">
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="voucher-modal-done-btn"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Thêm người dùng mới / Sửa thông tin & Phân quyền / Đặt lại mật khẩu */}
      {formModalOpen && (
        <div
          className="voucher-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={formData.id ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          onClick={() => setFormModalOpen(false)}
        >
          <div className="voucher-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <div>
                <h3 className="voucher-modal-title">
                  {formData.id ? 'Cập nhật tài khoản & Phân quyền' : 'Thêm tài khoản mới'}
                </h3>
                <p className="voucher-modal-sub">
                  {formData.id
                    ? `Tài khoản: ${formData.email}`
                    : 'Tạo nhanh tài khoản học viên hoặc quản trị viên mới'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="voucher-modal-close"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="admin-voucher-form">
              <Alert variant="error">{formError}</Alert>

              <div className="admin-voucher-form-grid">
                {!formData.id && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Địa chỉ Email *</label>
                    <input
                      className="input"
                      type="email"
                      placeholder="hocvien@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="field-label">Họ và tên *</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Số điện thoại</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">Vai trò hệ thống *</label>
                  <select
                    className="input"
                    value={formData.role}
                    disabled={formData.id === currentUser?.id}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="USER">Học viên (USER)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Trạng thái tài khoản *</label>
                  <select
                    className="input"
                    value={formData.status}
                    disabled={formData.id === currentUser?.id}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                    <option value="BLOCKED">Đã khóa (BLOCKED)</option>
                  </select>
                </div>

                {!formData.id ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">Mật khẩu khởi tạo *</label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Tối thiểu 6 ký tự..."
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                ) : (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="field-label">
                      Cấp lại mật khẩu mới (Để trống nếu giữ nguyên)
                    </label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Nhập mật khẩu mới nếu muốn đặt lại..."
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="admin-voucher-form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setFormModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" loading={submittingForm}>
                  {formData.id ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
