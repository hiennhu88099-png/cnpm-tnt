import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { reviewApi } from '../api/reviewApi';
import { AdminDashboardSkeleton, Alert, Icon, StarRating } from '../components/ui';
import { formatDate, formatNumber, formatPrice } from '../utils/format';

const STATUS_BADGE = {
  COMPLETED: { label: 'Hoàn thành', cls: 'is-emerald' },
  ACTIVE: { label: 'Đang học', cls: 'is-blue' },
  CANCELLED: { label: 'Đã hủy', cls: 'is-red' },
};

const REVIEW_BADGE = {
  APPROVED: { label: 'Đã duyệt', cls: 'is-emerald' },
  PENDING: { label: 'Chờ duyệt', cls: 'is-amber' },
  HIDDEN: { label: 'Đã ẩn', cls: 'is-red' },
};

const BAR_GRADIENTS = [
  'nx-grad-primary',
  'nx-grad-cyan',
  'nx-grad-orange',
  'nx-grad-emerald',
  'nx-grad-violet',
];

function buildTrendBuckets(allEnrollments, courseMap, daysCount) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const buckets = [];
  const bucketByKey = {};

  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const item = {
      key,
      label: `${dd}/${mm}`,
      revenue: 0,
      count: 0,
    };
    buckets.push(item);
    bucketByKey[key] = item;
  }

  allEnrollments.forEach((enr) => {
    if (enr.status === 'CANCELLED' || !enr.enrolledAt) return;
    const dt = new Date(enr.enrolledAt);
    if (Number.isNaN(dt.getTime())) return;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const target = bucketByKey[key];
    if (target) {
      const price = Number(courseMap[enr.courseId]?.price ?? 0);
      target.revenue += price;
      target.count += 1;
    }
  });

  // Nếu dữ liệu seed nằm ở các ngày cũ hơn khoảng lọc, gom phân bổ theo ngày thực tế có phát sinh để biểu đồ luôn trực quan
  const hasAnyInWindow = buckets.some((b) => b.count > 0);
  if (!hasAnyInWindow && allEnrollments.length > 0) {
    const grouped = {};
    allEnrollments.forEach((enr) => {
      if (enr.status === 'CANCELLED' || !enr.enrolledAt) return;
      const dt = new Date(enr.enrolledAt);
      if (Number.isNaN(dt.getTime())) return;
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      if (!grouped[key]) {
        grouped[key] = { key, label: `${dd}/${mm}`, revenue: 0, count: 0 };
      }
      grouped[key].revenue += Number(courseMap[enr.courseId]?.price ?? 0);
      grouped[key].count += 1;
    });
    const sortedActual = Object.values(grouped)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-daysCount);
    if (sortedActual.length > 0) {
      return sortedActual;
    }
  }

  return buckets;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [userMap, setUserMap] = useState({});
  const [courseMap, setCourseMap] = useState({});
  const [chartRange, setChartRange] = useState(7);
  const [activePointIdx, setActivePointIdx] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    const [summaryRes, enrollmentsRes, coursesRes, usersRes, reviewsRes] = await Promise.all([
      client.get('/api/admin/dashboard/summary').then((r) => r.data),
      enrollmentApi.getAllEnrollments({ page: 0, size: 100 }).catch(() => ({ content: [] })),
      courseApi.getAdminCourses({ page: 0, size: 100 }).catch(() => ({ content: [] })),
      client
        .get('/api/admin/users')
        .then((r) => r.data)
        .catch(() => []),
      reviewApi.getAdminReviews({ page: 0, size: 6 }).catch(() => ({ content: [] })),
    ]);

    const enrollmentsList = enrollmentsRes?.content ?? [];
    const allCourses = coursesRes?.content ?? [];
    const allUsers = Array.isArray(usersRes) ? usersRes : usersRes?.content ?? [];
    const reviewsList = reviewsRes?.content ?? [];

    const uMap = {};
    allUsers.forEach((u) => {
      uMap[u.id] = u;
    });

    const cMap = {};
    allCourses.forEach((c) => {
      cMap[c.id] = c;
    });

    let revenueSum = 0;
    const countByCourse = {};
    enrollmentsList.forEach((enr) => {
      if (enr.status === 'CANCELLED') return;
      const c = cMap[enr.courseId];
      const price = Number(c?.price ?? 0);
      revenueSum += price;
      countByCourse[enr.courseId] = (countByCourse[enr.courseId] || 0) + 1;
    });

    const rankedCourses = allCourses
      .map((c) => ({
        id: c.id,
        title: c.title,
        price: Number(c.price ?? 0),
        sales: countByCourse[c.id] || 0,
      }))
      .sort((a, b) => b.sales - a.sales || b.price - a.price)
      .slice(0, 5);

    return {
      summary: summaryRes,
      allEnrollments: enrollmentsList,
      recentEnrollments: enrollmentsList.slice(0, 6),
      recentReviews: reviewsList.slice(0, 5),
      topCourses: rankedCourses,
      totalRevenue: revenueSum,
      userMap: uMap,
      courseMap: cMap,
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchDashboardData()
      .then((res) => {
        if (!active) return;
        setSummary(res.summary);
        setAllEnrollments(res.allEnrollments);
        setRecentEnrollments(res.recentEnrollments);
        setRecentReviews(res.recentReviews);
        setTopCourses(res.topCourses);
        setTotalRevenue(res.totalRevenue);
        setUserMap(res.userMap);
        setCourseMap(res.courseMap);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Không thể tải dữ liệu tổng quan hệ thống.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchDashboardData]);

  async function handleRefresh() {
    setRefreshing(true);
    setError('');
    try {
      const res = await fetchDashboardData();
      setSummary(res.summary);
      setAllEnrollments(res.allEnrollments);
      setRecentEnrollments(res.recentEnrollments);
      setRecentReviews(res.recentReviews);
      setTopCourses(res.topCourses);
      setTotalRevenue(res.totalRevenue);
      setUserMap(res.userMap);
      setCourseMap(res.courseMap);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể làm mới số liệu.');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleQuickApproveReview(reviewId) {
    setApprovingId(reviewId);
    try {
      await reviewApi.updateReviewStatus(reviewId, 'APPROVED');
      const res = await fetchDashboardData();
      setSummary(res.summary);
      setRecentReviews(res.recentReviews);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể duyệt đánh giá.');
    } finally {
      setApprovingId(null);
    }
  }

  const trendBuckets = useMemo(
    () => buildTrendBuckets(allEnrollments, courseMap, chartRange),
    [allEnrollments, courseMap, chartRange],
  );

  if (loading) return <AdminDashboardSkeleton />;

  const avgRating = Number(summary?.averageRating ?? 0).toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const statCards = [
    {
      label: 'Tổng doanh thu khóa học',
      val: formatPrice(totalRevenue),
      icon: 'wallet',
      trend: `${formatNumber(summary?.publishedCourses ?? 0)} khóa đang mở`,
      grad: 'nx-grad-emerald',
      href: '/admin/enrollments',
    },
    {
      label: 'Lượt đăng ký khóa học',
      val: formatNumber(summary?.totalEnrollments ?? 0),
      icon: 'shoppingBag',
      trend: `${formatNumber(summary?.completedEnrollments ?? 0)} hoàn thành`,
      grad: 'nx-grad-primary',
      href: '/admin/enrollments',
    },
    {
      label: 'Tổng tài khoản học viên',
      val: formatNumber(summary?.totalUsers ?? 0),
      icon: 'users',
      trend: `${formatNumber(summary?.activeUsers ?? 0)} hoạt động`,
      grad: 'nx-grad-orange',
      href: '/admin/users',
    },
    {
      label: 'Đánh giá & Chất lượng',
      val: formatNumber(summary?.totalReviews ?? 0),
      icon: 'star',
      trend: `★ ${avgRating} / 5.0`,
      grad: 'nx-grad-violet',
      href: '/admin/reviews',
    },
  ];

  const maxSales = Math.max(1, topCourses[0]?.sales || 1);
  const maxBucketRevenue = Math.max(1, ...trendBuckets.map((b) => b.revenue));
  const maxBucketCount = Math.max(1, ...trendBuckets.map((b) => b.count));
  const activeBucket =
    activePointIdx !== null && trendBuckets[activePointIdx]
      ? trendBuckets[activePointIdx]
      : trendBuckets[trendBuckets.length - 1];

  return (
    <div className="nx-dash-wrap">
      {/* Header */}
      <div className="nx-dash-header">
        <div>
          <h1 className="nx-dash-title">Tổng quan hệ thống</h1>
          <p className="nx-dash-subtitle">
            Theo dõi doanh thu, lượt ghi danh khóa học, hoạt động của học viên và chất lượng đào tạo theo thời gian thực.
          </p>
        </div>

        <div className="nx-dash-header-right">
          <div className="nx-dash-live-pill">
            <span className="nx-dash-live-dot" />
            <span>Dữ liệu trực tiếp · 30 ngày qua</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="nx-dash-refresh-btn"
          >
            <Icon name="trendingUp" size={16} />
            <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      <Alert variant="error">{error}</Alert>

      {/* 4 Stat Cards */}
      <div className="nx-dash-stats-grid">
        {statCards.map((stat) => (
          <Link to={stat.href} key={stat.label} className="nx-dash-stat-card">
            <div className="nx-dash-stat-glow" />
            <div className="nx-dash-stat-top">
              <div className={`nx-dash-stat-icon ${stat.grad}`}>
                <Icon name={stat.icon} size={20} />
              </div>
              <span className="nx-dash-stat-trend">{stat.trend}</span>
            </div>
            <div className="nx-dash-stat-body">
              <p className="nx-dash-stat-label">{stat.label}</p>
              <h3 className="nx-dash-stat-value">{stat.val}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Interactive Revenue & Enrollment Trend Chart */}
      <section className="nx-dash-panel nx-dash-chart-panel">
        <div className="nx-dash-panel-head">
          <div>
            <h2 className="nx-dash-panel-title">
              <span className="nx-dash-panel-icon nx-grad-emerald">
                <Icon name="chart" size={18} />
              </span>
              <span>Biểu đồ Doanh thu &amp; Lượt đăng ký</span>
            </h2>
            <p className="nx-dash-chart-sub">
              Di chuột vào từng cột mốc để xem chi tiết doanh thu và số lượt học viên ghi danh.
            </p>
          </div>

          <div className="nx-dash-chart-controls">
            {activeBucket && (
              <div className="nx-dash-chart-Callout">
                <span className="nx-dash-chart-callout-date">Ngày {activeBucket.label}:</span>
                <strong>{formatPrice(activeBucket.revenue)}</strong>
                <span className="nx-dash-chart-callout-sep">·</span>
                <span>{activeBucket.count} lượt ĐK</span>
              </div>
            )}
            <div className="nx-dash-range-tabs" role="tablist" aria-label="Khung thời gian biểu đồ">
              {[
                { val: 7, label: '7 mốc gần nhất' },
                { val: 14, label: '14 mốc' },
                { val: 30, label: '30 mốc' },
              ].map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => {
                    setChartRange(tab.val);
                    setActivePointIdx(null);
                  }}
                  className={`nx-dash-range-tab${chartRange === tab.val ? ' is-active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="nx-dash-chart-bars">
          {trendBuckets.map((bucket, idx) => {
            const heightPct =
              bucket.revenue > 0
                ? Math.max(14, Math.round((bucket.revenue / maxBucketRevenue) * 100))
                : bucket.count > 0
                  ? Math.max(14, Math.round((bucket.count / maxBucketCount) * 100))
                  : 6;
            const isHovered = activePointIdx === idx;

            return (
              <div
                key={bucket.key}
                className={`nx-dash-chart-col${isHovered ? ' is-active' : ''}`}
                onMouseEnter={() => setActivePointIdx(idx)}
                onFocus={() => setActivePointIdx(idx)}
                tabIndex={0}
              >
                <div className="nx-dash-chart-tooltip">
                  <strong>{formatPrice(bucket.revenue)}</strong>
                  <span>{bucket.count} học viên</span>
                </div>
                <div className="nx-dash-chart-bar-wrap">
                  <div
                    className={`nx-dash-chart-bar${bucket.count > 0 ? ' has-value' : ''}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="nx-dash-chart-label">{bucket.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main 3-Column Section: Recent Enrollments (2 cols) + Best Seller Courses (1 col) */}
      <div className="nx-dash-main-grid">
        {/* Left 2 Columns: Recent Enrollments */}
        <section className="nx-dash-panel nx-dash-panel-wide">
          <div className="nx-dash-panel-head">
            <h2 className="nx-dash-panel-title">
              <span className="nx-dash-panel-icon nx-grad-primary">
                <Icon name="trendingUp" size={18} />
              </span>
              <span>Đăng ký khóa học gần đây</span>
            </h2>
            <Link to="/admin/enrollments" className="nx-dash-view-all-btn">
              <span>Xem tất cả</span>
              <Icon name="arrowRight" size={15} />
            </Link>
          </div>

          <div className="nx-dash-table-wrap">
            <table className="nx-dash-table">
              <thead>
                <tr>
                  <th>Mã ĐK</th>
                  <th>Học viên</th>
                  <th>Khóa học</th>
                  <th>Học phí</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentEnrollments.map((item) => {
                  const student = userMap[item.userId];
                  const course = courseMap[item.courseId];
                  const price = Number(course?.price ?? 0);
                  const pct = Math.round(Number(item.progress ?? 0));
                  const st = STATUS_BADGE[item.status] || { label: item.status, cls: 'is-amber' };

                  return (
                    <tr key={item.id}>
                      <td className="nx-dash-code">#{item.id}</td>
                      <td>
                        <div className="nx-dash-cell-primary">
                          {student?.fullName || `Học viên #${item.userId}`}
                        </div>
                        <div className="nx-dash-cell-sub">
                          {student?.email || formatDate(item.enrolledAt)}
                        </div>
                      </td>
                      <td>
                        <div className="nx-dash-cell-course">
                          {item.title || course?.title || `Khóa học #${item.courseId}`}
                        </div>
                      </td>
                      <td className="nx-dash-price">{formatPrice(price)}</td>
                      <td>
                        <span className="nx-dash-pct">{pct}%</span>
                      </td>
                      <td>
                        <span className={`nx-dash-status-pill ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {recentEnrollments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="nx-dash-empty-row">
                      Chưa có lượt đăng ký khóa học nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right 1 Column: Best Sellers / Top Courses + Revenue Highlight */}
        <section className="nx-dash-panel nx-dash-panel-side">
          <h2 className="nx-dash-side-title">Khóa học nhiều học viên nhất</h2>

          <div className="nx-dash-bestsellers">
            {topCourses.length > 0 ? (
              topCourses.map((course, idx) => {
                const grad = BAR_GRADIENTS[idx % BAR_GRADIENTS.length];
                const widthPct =
                  course.sales > 0 ? Math.min(100, Math.round((course.sales / maxSales) * 100)) : 12;

                return (
                  <div key={course.id} className="nx-dash-bestseller-item">
                    <div className="nx-dash-bestseller-top">
                      <Link
                        to={`/admin/courses/${course.id}/edit`}
                        className="nx-dash-bestseller-name"
                      >
                        {course.title}
                      </Link>
                      <span className="nx-dash-bestseller-badge">{course.sales} học viên</span>
                    </div>
                    <div className="nx-dash-bar-track">
                      <div
                        className={`nx-dash-bar-fill ${grad}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="nx-dash-empty-side">
                <Icon name="package" size={32} />
                <p>Chưa có dữ liệu khóa học</p>
              </div>
            )}
          </div>

          <div className="nx-dash-revenue-box">
            <div className="nx-dash-revenue-icon">
              <Icon name="wallet" size={26} />
            </div>
            <div className="nx-dash-revenue-label">Tổng doanh thu ghi nhận</div>
            <div className="nx-dash-revenue-value">{formatPrice(totalRevenue)}</div>
          </div>
        </section>
      </div>

      {/* Recent Reviews & Quick Moderation Panel */}
      <section className="nx-dash-panel">
        <div className="nx-dash-panel-head">
          <h2 className="nx-dash-panel-title">
            <span className="nx-dash-panel-icon nx-grad-violet">
              <Icon name="star" size={18} />
            </span>
            <span>Đánh giá học viên mới nhất &amp; Duyệt nhanh</span>
          </h2>
          <Link to="/admin/reviews" className="nx-dash-view-all-btn">
            <span>Quản lý đánh giá</span>
            <Icon name="arrowRight" size={15} />
          </Link>
        </div>

        <div className="nx-dash-reviews-grid">
          {recentReviews.length > 0 ? (
            recentReviews.map((rev) => {
              const badge = REVIEW_BADGE[rev.status] || { label: rev.status, cls: 'is-amber' };
              return (
                <div key={rev.id} className="nx-dash-review-card">
                  <div className="nx-dash-review-top">
                    <div>
                      <div className="nx-dash-cell-primary">
                        {rev.fullName || `Học viên #${rev.userId}`}
                      </div>
                      <div className="nx-dash-cell-sub">
                        {rev.courseTitle || courseMap[rev.courseId]?.title || `Khóa học #${rev.courseId}`}
                      </div>
                    </div>
                    <span className={`nx-dash-status-pill ${badge.cls}`}>{badge.label}</span>
                  </div>

                  <div className="nx-dash-review-rating">
                    <StarRating value={Number(rev.rating || 0)} />
                    <span className="nx-dash-review-date">{formatDate(rev.createdAt)}</span>
                  </div>

                  <p className="nx-dash-review-comment">
                    {rev.comment || 'Học viên để lại đánh giá sao không kèm lời nhắn.'}
                  </p>

                  {rev.status !== 'APPROVED' && (
                    <div className="nx-dash-review-actions">
                      <button
                        type="button"
                        disabled={approvingId === rev.id}
                        onClick={() => handleQuickApproveReview(rev.id)}
                        className="nx-dash-quick-approve-btn"
                      >
                        <Icon name="check" size={14} />
                        <span>{approvingId === rev.id ? 'Đang duyệt...' : 'Duyệt hiển thị ngay'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="nx-dash-empty-row">Chưa có đánh giá nào từ học viên.</div>
          )}
        </div>
      </section>

      {/* Bottom Breakdown Cards (Users / Courses / Reviews status) */}
      <div className="nx-dash-breakdown-grid">
        <div className="nx-dash-panel">
          <div className="nx-dash-mini-head">
            <h3>Trạng thái Tài khoản</h3>
            <Link to="/admin/users">Quản lý →</Link>
          </div>
          <div className="admin-breakdown">
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot green" />
                Đang hoạt động
              </span>
              <strong>{formatNumber(summary?.activeUsers ?? 0)}</strong>
            </div>
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot red" />
                Đã khóa
              </span>
              <strong>{formatNumber(summary?.blockedUsers ?? 0)}</strong>
            </div>
          </div>
        </div>

        <div className="nx-dash-panel">
          <div className="nx-dash-mini-head">
            <h3>Khóa học &amp; Học tập</h3>
            <Link to="/admin/courses">Quản lý →</Link>
          </div>
          <div className="admin-breakdown">
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot green" />
                Khóa học đã xuất bản
              </span>
              <strong>{formatNumber(summary?.publishedCourses ?? 0)}</strong>
            </div>
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot amber" />
                Khóa học bản nháp
              </span>
              <strong>{formatNumber(summary?.draftCourses ?? 0)}</strong>
            </div>
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot blue" />
                Học viên đang học
              </span>
              <strong>{formatNumber(summary?.activeEnrollments ?? 0)}</strong>
            </div>
          </div>
        </div>

        <div className="nx-dash-panel">
          <div className="nx-dash-mini-head">
            <h3>Kiểm duyệt Đánh giá</h3>
            <Link to="/admin/reviews">Kiểm duyệt →</Link>
          </div>
          <div className="admin-breakdown">
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot green" />
                Đã duyệt hiển thị
              </span>
              <strong>{formatNumber(summary?.approvedReviews ?? 0)}</strong>
            </div>
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot amber" />
                Chờ xử lý
              </span>
              <strong>{formatNumber(summary?.pendingReviews ?? 0)}</strong>
            </div>
            <div className="admin-breakdown-row">
              <span>
                <i className="admin-dot red" />
                Đã ẩn
              </span>
              <strong>{formatNumber(summary?.hiddenReviews ?? 0)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
