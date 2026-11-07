import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { shopApi } from '../api/shopApi';
import useApiQuery from '../hooks/useApiQuery';
import Pagination from '../components/course/Pagination';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CustomSelect,
  EmptyState,
  Icon,
  PageHeader,
  PageLoading,
  ProgressBar,
} from '../components/ui';
import { levelLabel } from '../config/course';
import { formatDate, formatNumber, formatPrice } from '../utils/format';

const STATUS_MAP = {
  ACTIVE: { label: 'Đang học', variant: 'primary' },
  COMPLETED: { label: 'Đã hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'neutral' },
};

const ORDER_STATUS_MAP = {
  COMPLETED: { label: 'Đã thanh toán', variant: 'success' },
  PENDING: { label: 'Chờ thanh toán', variant: 'warning' },
  CANCELLED: { label: 'Đã hủy', variant: 'danger' },
};

export default function AdminEnrollmentPage() {
  const [activeView, setActiveView] = useState('enrollments'); // 'enrollments' | 'orders'
  const [keyword, setKeyword] = useState('');
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);

  const [usersList, setUsersList] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [coursesList, setCoursesList] = useState([]);
  const [courseMap, setCourseMap] = useState({});
  const [allEnrollmentsSummary, setAllEnrollmentsSummary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [cancellingCode, setCancellingCode] = useState('');
  const [notice, setNotice] = useState({ type: 'success', text: '' });

  const loadAuxData = useCallback(async () => {
    try {
      const [usersRes, coursesRes, allEnrRes, ordersRes] = await Promise.all([
        client
          .get('/api/admin/users')
          .then((r) => r.data)
          .catch(() => []),
        courseApi.getAdminCourses({ page: 0, size: 100 }).catch(() => ({ content: [] })),
        enrollmentApi.getAllEnrollments({ page: 0, size: 200 }).catch(() => ({ content: [] })),
        shopApi.getAdminOrders().catch(() => []),
      ]);

      const uArr = Array.isArray(usersRes) ? usersRes : usersRes?.content ?? [];
      const uMap = {};
      uArr.forEach((u) => {
        uMap[u.id] = u;
      });

      const cArr = coursesRes?.content ?? [];
      const cMap = {};
      cArr.forEach((c) => {
        cMap[c.id] = c;
      });

      setUsersList(uArr);
      setUserMap(uMap);
      setCoursesList(cArr);
      setCourseMap(cMap);
      setAllEnrollmentsSummary(allEnrRes?.content ?? []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadAuxData();
    });
    return () => {
      active = false;
    };
  }, [loadAuxData]);

  const fetchEnrollments = useCallback(
    () =>
      enrollmentApi.getAllEnrollments({
        ...filters,
        page,
        size: 10,
      }),
    [filters, page],
  );

  const { data: result, error, loading, reload } = useApiQuery(fetchEnrollments);

  function handleSearch(event) {
    event.preventDefault();
    setPage(0);
    setFilters({
      keyword: keyword.trim() || undefined,
      userId: userId || undefined,
      courseId: courseId || undefined,
    });
  }

  function handleCourseSelect(nextCourseId) {
    setCourseId(nextCourseId);
    setPage(0);
    setFilters((prev) => ({
      ...prev,
      courseId: nextCourseId || undefined,
    }));
  }

  function handleUserSelect(nextUserId) {
    setUserId(nextUserId);
    setPage(0);
    setFilters((prev) => ({
      ...prev,
      userId: nextUserId || undefined,
    }));
  }

  function clearFilters() {
    setKeyword('');
    setUserId('');
    setCourseId('');
    setStatusFilter('ALL');
    setPage(0);
    setFilters({});
  }

  async function handleCancelOrder(orderCode) {
    if (!window.confirm(`Hủy đơn hàng #${orderCode}?`)) return;
    setCancellingCode(orderCode);
    setNotice({ type: 'success', text: '' });
    try {
      await shopApi.cancelOrder(orderCode);
      setNotice({ type: 'success', text: `Đã chuyển đơn hàng #${orderCode} sang trạng thái Đã hủy.` });
      await loadAuxData();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Không thể hủy đơn hàng này.',
      });
    } finally {
      setCancellingCode('');
    }
  }

  function handleExportCsv() {
    const source = allEnrollmentsSummary.length > 0 ? allEnrollmentsSummary : result?.content ?? [];
    if (source.length === 0) return;

    const headers = ['Ma DK', 'Hoc vien', 'Email', 'Khoa hoc', 'Hoc phi', 'Tien do (%)', 'Trang thai', 'Ngay dang ky'];
    const rows = source.map((item) => {
      const student = userMap[item.userId];
      const course = courseMap[item.courseId];
      return [
        item.id,
        `"${(student?.fullName || `HV #${item.userId}`).replace(/"/g, '""')}"`,
        `"${(student?.email || '').replace(/"/g, '""')}"`,
        `"${(item.title || course?.title || `KH #${item.courseId}`).replace(/"/g, '""')}"`,
        Number(course?.price ?? 0),
        Math.round(Number(item.progress ?? 0)),
        item.status,
        item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString('vi-VN') : '',
      ].join(',');
    });

    const csvContent = `\uFEFF${[headers.join(','), ...rows].join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-sach-ghi-danh-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpi = useMemo(() => {
    const total = allEnrollmentsSummary.length || (result?.totalElements ?? 0);
    const active = allEnrollmentsSummary.filter((e) => e.status === 'ACTIVE').length;
    const completed = allEnrollmentsSummary.filter((e) => e.status === 'COMPLETED').length;
    const avgProgress =
      allEnrollmentsSummary.length > 0
        ? Math.round(
            allEnrollmentsSummary.reduce((s, e) => s + Number(e.progress || 0), 0) /
              allEnrollmentsSummary.length,
          )
        : 0;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    return {
      total,
      active,
      completed,
      avgProgress,
      completedOrders,
      pendingOrders,
      cancelledOrders,
    };
  }, [allEnrollmentsSummary, result, orders]);

  if (loading && !result && !error) return <PageLoading text="Đang tải danh sách đăng ký..." />;

  const rawEnrollments = result?.content ?? [];
  const enrollments =
    statusFilter === 'ALL'
      ? rawEnrollments
      : rawEnrollments.filter((e) => e.status === statusFilter);
  const totalPages = result?.totalPages ?? 0;
  const totalElements = result?.totalElements ?? rawEnrollments.length;
  const hasFilters = Boolean(filters.keyword || filters.userId || filters.courseId || statusFilter !== 'ALL');

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      return (
        (o.orderCode || '').toLowerCase().includes(q) ||
        (o.courseTitles || '').toLowerCase().includes(q) ||
        (o.userFullName || '').toLowerCase().includes(q) ||
        (o.userEmail || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị đào tạo & thanh toán"
        title="Ghi danh & Đơn hàng Khóa học"
        subtitle="Theo dõi tiến độ học tập của học viên và đối soát trạng thái đơn hàng thanh toán SePay."
        actions={
          <div className="row-actions">
            <Button variant="secondary" onClick={handleExportCsv}>
              <Icon name="download" size={16} /> Xuất CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                reload();
                loadAuxData();
              }}
            >
              <Icon name="trendingUp" size={16} /> Làm mới
            </Button>
          </div>
        }
      />

      <Alert variant={notice.type}>{notice.text}</Alert>

      {/* 4 KPI Stat Cards */}
      <div className="nx-dash-stats-grid">
        <div className="nx-dash-stat-card">
          <div className="nx-dash-stat-top">
            <div className="nx-dash-stat-icon nx-grad-primary">
              <Icon name="award" size={20} />
            </div>
            <span className="nx-dash-stat-trend">{coursesList.length} khóa học</span>
          </div>
          <div className="nx-dash-stat-body">
            <p className="nx-dash-stat-label">Tổng lượt ghi danh</p>
            <h3 className="nx-dash-stat-value">{formatNumber(kpi.total)}</h3>
          </div>
        </div>

        <div className="nx-dash-stat-card">
          <div className="nx-dash-stat-top">
            <div className="nx-dash-stat-icon nx-grad-cyan">
              <Icon name="play" size={20} />
            </div>
            <span className="nx-dash-stat-trend">TB tiến độ {kpi.avgProgress}%</span>
          </div>
          <div className="nx-dash-stat-body">
            <p className="nx-dash-stat-label">Đang học tập (Active)</p>
            <h3 className="nx-dash-stat-value">{formatNumber(kpi.active)}</h3>
          </div>
        </div>

        <div className="nx-dash-stat-card">
          <div className="nx-dash-stat-top">
            <div className="nx-dash-stat-icon nx-grad-emerald">
              <Icon name="checkCircle" size={20} />
            </div>
            <span className="nx-dash-stat-trend">Đạt 100% bài học</span>
          </div>
          <div className="nx-dash-stat-body">
            <p className="nx-dash-stat-label">Đã hoàn thành</p>
            <h3 className="nx-dash-stat-value">{formatNumber(kpi.completed)}</h3>
          </div>
        </div>

        <div className="nx-dash-stat-card">
          <div className="nx-dash-stat-top">
            <div className="nx-dash-stat-icon nx-grad-orange">
              <Icon name="qrCode" size={20} />
            </div>
            <span className="nx-dash-stat-trend">
              {kpi.pendingOrders} chờ · {kpi.cancelledOrders} hủy
            </span>
          </div>
          <div className="nx-dash-stat-body">
            <p className="nx-dash-stat-label">Đơn hàng Thanh toán</p>
            <h3 className="nx-dash-stat-value">{formatNumber(orders.length)}</h3>
          </div>
        </div>
      </div>

      <Card>
        {/* Top Mode Switcher: Enrollments vs Orders */}
        <div className="nx-enrollment-mode-bar">
          <div className="nx-dash-table-tabs">
            <button
              type="button"
              onClick={() => setActiveView('enrollments')}
              className={`nx-dash-table-tab${activeView === 'enrollments' ? ' is-active' : ''}`}
            >
              <Icon name="award" size={16} />
              <span>Danh sách Ghi danh &amp; Tiến độ ({formatNumber(kpi.total)})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('orders')}
              className={`nx-dash-table-tab${activeView === 'orders' ? ' is-active' : ''}`}
            >
              <Icon name="qrCode" size={16} />
              <span>Đối soát Đơn hàng SePay ({formatNumber(orders.length)})</span>
            </button>
          </div>
        </div>

        {activeView === 'enrollments' ? (
          <>
            {/* Status Filter Pills */}
            <div className="nx-filter-pills" role="tablist" aria-label="Lọc trạng thái học tập">
              {[
                { value: 'ALL', label: `Tất cả trạng thái (${kpi.total})` },
                { value: 'ACTIVE', label: `Đang học (${kpi.active})` },
                { value: 'COMPLETED', label: `Đã hoàn thành (${kpi.completed})` },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`nx-filter-pill${statusFilter === tab.value ? ' is-active' : ''}`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Rich Filter Toolbar with CustomSelect */}
            <form className="admin-toolbar is-enrollment-toolbar" onSubmit={handleSearch} role="search">
              <div className="catalog-search">
                <input
                  id="admin-enrollment-keyword"
                  className="input"
                  type="search"
                  aria-label="Tìm học viên hoặc khóa học"
                  placeholder="Tìm tên/email học viên hoặc tên khóa học..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button type="submit" variant="secondary">
                  Tìm
                </Button>
              </div>

              <CustomSelect
                id="admin-enrollment-course"
                value={courseId}
                onChange={(e) => handleCourseSelect(e.target.value)}
              >
                <option value="">Tất cả khóa học ({coursesList.length})</option>
                {coursesList.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.title}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                id="admin-enrollment-user"
                value={userId}
                onChange={(e) => handleUserSelect(e.target.value)}
              >
                <option value="">Tất cả học viên ({usersList.length})</option>
                {usersList.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.fullName || u.email} (#{u.id})
                  </option>
                ))}
              </CustomSelect>
            </form>

            {error ? (
              <Alert variant="error">
                {error.message}{' '}
                <button type="button" className="text-link" onClick={reload}>
                  Thử lại
                </button>
              </Alert>
            ) : enrollments.length === 0 ? (
              <EmptyState
                icon="award"
                title={hasFilters ? 'Không có lượt đăng ký phù hợp' : 'Chưa có lượt đăng ký nào'}
                description={
                  hasFilters
                    ? 'Thử thay đổi từ khóa hoặc xóa bộ lọc để xem toàn bộ danh sách.'
                    : 'Khi học viên đăng ký khóa học, dữ liệu sẽ hiển thị tại đây.'
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
                  <span>Hiển thị {formatNumber(enrollments.length)} / {formatNumber(totalElements)} lượt ghi danh</span>
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
                        <th scope="col">Mã ĐK</th>
                        <th scope="col">Học viên</th>
                        <th scope="col">Khóa học</th>
                        <th scope="col">Học phí</th>
                        <th scope="col">Ngày đăng ký</th>
                        <th scope="col">Trạng thái</th>
                        <th scope="col">Tiến độ</th>
                        <th scope="col" className="nx-th-actions">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((item) => {
                        const pct = Math.round(Number(item.progress ?? 0));
                        const st = STATUS_MAP[item.status] || { label: item.status, variant: 'neutral' };
                        const student = userMap[item.userId];
                        const course = courseMap[item.courseId];
                        const price = Number(course?.price ?? 0);
                        return (
                          <tr key={item.id}>
                            <td className="nx-dash-code">#{item.id}</td>
                            <td style={{ minWidth: '210px' }}>
                              <div className="nx-user-cell">
                                <Avatar
                                  name={student?.fullName || `HV ${item.userId}`}
                                  src={student?.avatar}
                                  size={36}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <div className="cell-title cell-truncate" style={{ maxWidth: '180px' }}>
                                    {student?.fullName || `Học viên #${item.userId}`}
                                  </div>
                                  <div className="cell-sub cell-truncate" style={{ maxWidth: '180px' }}>
                                    {student?.email ? `${student.email} · #${item.userId}` : `ID #${item.userId}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ minWidth: '240px' }}>
                              <div className="nx-course-cell">
                                <div className="nx-course-thumb">
                                  {course?.thumbnail ? (
                                    <img src={course.thumbnail} alt="" loading="lazy" />
                                  ) : (
                                    <Icon name="book" size={18} />
                                  )}
                                </div>
                                <div className="nx-course-meta">
                                  <Link
                                    to={`/admin/courses/${item.courseId}/edit`}
                                    className="cell-title cell-truncate"
                                    style={{ textDecoration: 'none', color: 'var(--color-text)' }}
                                  >
                                    {item.title || course?.title || `Khóa học #${item.courseId}`}
                                  </Link>
                                  <div className="cell-sub">
                                    {item.instructorName || course?.instructorName
                                      ? `GV: ${item.instructorName || course?.instructorName}`
                                      : `Mã KH #${item.courseId}`}
                                    {item.level || course?.level ? ` · ${levelLabel(item.level || course?.level)}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {price === 0 ? (
                                <span style={{ color: '#059669' }}>Miễn phí</span>
                              ) : (
                                formatPrice(price)
                              )}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(item.enrolledAt)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <Badge variant={st.variant}>{st.label}</Badge>
                            </td>
                            <td style={{ minWidth: '150px' }}>
                              <ProgressBar value={pct} />
                            </td>
                            <td>
                              <div className="nx-row-actions" style={{ flexWrap: 'nowrap' }}>
                                <Link
                                  to={`/admin/courses/${item.courseId}/edit`}
                                  className="nx-action-btn is-edit"
                                  title="Xem / Sửa khóa học"
                                >
                                  <Icon name="pen" size={14} />
                                  <span>Khóa học</span>
                                </Link>
                                <Link
                                  to={`/admin/lessons?courseId=${item.courseId}`}
                                  className="nx-action-btn is-info"
                                  title="Quản lý bài học"
                                >
                                  <Icon name="layers" size={14} />
                                  <span>Bài học</span>
                                </Link>
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
          </>
        ) : (
          /* TAB 2: ORDERS & SEPAY TRANSACTIONS */
          <>
            <div className="nx-filter-pills" role="tablist" aria-label="Lọc trạng thái đơn hàng">
              {[
                { value: 'ALL', label: `Tất cả đơn hàng (${orders.length})` },
                { value: 'COMPLETED', label: `Đã thanh toán (${kpi.completedOrders})` },
                { value: 'PENDING', label: `Chờ thanh toán (${kpi.pendingOrders})` },
                { value: 'CANCELLED', label: `Đã hủy (${kpi.cancelledOrders})` },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setOrderStatusFilter(tab.value)}
                  className={`nx-filter-pill${orderStatusFilter === tab.value ? ' is-active' : ''}`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="admin-toolbar is-single-search">
              <div className="catalog-search">
                <input
                  className="input"
                  type="search"
                  placeholder="Tìm theo mã đơn (#ORD...), tên khóa học hoặc email học viên..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>

            {ordersLoading ? (
              <PageLoading text="Đang tải đơn hàng..." />
            ) : filteredOrders.length === 0 ? (
              <EmptyState
                icon="qrCode"
                title="Không có đơn hàng phù hợp"
                description="Các giao dịch thanh toán SePay / VietQR và đăng ký miễn phí sẽ hiển thị tại đây."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Mã đơn</th>
                      <th scope="col">Học viên</th>
                      <th scope="col">Khóa học thanh toán</th>
                      <th scope="col">Tổng thanh toán</th>
                      <th scope="col">Phương thức</th>
                      <th scope="col">Thời gian tạo</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" className="nx-th-actions">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const st = ORDER_STATUS_MAP[ord.status] || {
                        label: ord.status,
                        variant: 'neutral',
                      };
                      const student = userMap[ord.userId];
                      return (
                        <tr key={ord.id || ord.orderCode}>
                          <td className="nx-dash-code">#{ord.orderCode}</td>
                          <td style={{ minWidth: '200px' }}>
                            <div className="nx-user-cell">
                              <Avatar
                                name={ord.userFullName || student?.fullName || `HV ${ord.userId}`}
                                src={student?.avatar}
                                size={36}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div className="cell-title cell-truncate" style={{ maxWidth: '170px' }}>
                                  {ord.userFullName || student?.fullName || `Học viên #${ord.userId}`}
                                </div>
                                <div className="cell-sub cell-truncate" style={{ maxWidth: '170px' }}>
                                  {ord.userEmail || student?.email || `ID #${ord.userId}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ minWidth: '220px' }}>
                            <div className="cell-title cell-truncate" title={ord.courseTitles}>
                              {ord.courseTitles}
                            </div>
                            {ord.voucherCode && (
                              <div className="cell-sub">
                                Voucher: <strong>{ord.voucherCode}</strong> (-{formatPrice(ord.discountAmount || 0)})
                              </div>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>
                              {formatPrice(ord.finalAmount || 0)}
                            </strong>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <Badge variant="neutral">{ord.paymentMethod || 'SEPAY'}</Badge>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ord.createdAt)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                          <td>
                            <div className="nx-row-actions" style={{ flexWrap: 'nowrap' }}>
                              {ord.status === 'PENDING' && (
                                <button
                                  type="button"
                                  disabled={cancellingCode === ord.orderCode}
                                  onClick={() => handleCancelOrder(ord.orderCode)}
                                  className="nx-action-btn is-danger"
                                >
                                  <Icon name="x" size={14} />
                                  <span>{cancellingCode === ord.orderCode ? '...' : 'Hủy đơn'}</span>
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
            )}
          </>
        )}
      </Card>
    </div>
  );
}
