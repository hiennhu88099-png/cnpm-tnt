import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { courseApi } from '../api/courseApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { reviewApi } from '../api/reviewApi';
import { shopApi } from '../api/shopApi';
import { AdminDashboardSkeleton, Alert, Icon, StarRating } from '../components/ui';
import { formatDate, formatNumber, formatPrice } from '../utils/format';

const STATUS_BADGE = {
  COMPLETED: { label: 'Hoàn thành', cls: 'is-emerald' },
  ACTIVE: { label: 'Đang học', cls: 'is-blue' },
  CANCELLED: { label: 'Đã hủy', cls: 'is-red' },
};

const ORDER_STATUS_BADGE = {
  COMPLETED: { label: 'Đã thanh toán', cls: 'is-emerald' },
  PENDING: { label: 'Chờ thanh toán', cls: 'is-amber' },
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

const DONUT_COLORS = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
];

function buildTrendBuckets(allEnrollments, allOrders, courseMap, daysCount) {
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
      orders: 0,
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

  allOrders.forEach((ord) => {
    if (ord.status !== 'COMPLETED' || !ord.createdAt) return;
    const dt = new Date(ord.createdAt);
    if (Number.isNaN(dt.getTime())) return;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const target = bucketByKey[key];
    if (target) {
      target.orders += 1;
    }
  });

  const hasAnyInWindow = buckets.some((b) => b.count > 0 || b.revenue > 0);
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
        grouped[key] = { key, label: `${dd}/${mm}`, revenue: 0, count: 0, orders: 0 };
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

/**
 * Vẽ vòng biểu đồ SVG Donut nhiều phân đoạn
 */
function SvgDonutChart({ segments, centerLabel, centerValue, size = 168, strokeWidth = 22 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let accumulatedPct = 0;

  return (
    <div className="nx-donut-box" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="nx-donut-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments.map((seg) => {
            if (seg.value <= 0) return null;
            const pct = seg.value / total;
            const dashArray = `${pct * circumference} ${circumference}`;
            const dashOffset = -accumulatedPct * circumference;
            accumulatedPct += pct;
            return (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
      </svg>
      <div className="nx-donut-center">
        <strong className="nx-donut-center-val">{centerValue}</strong>
        <span className="nx-donut-center-lbl">{centerLabel}</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [topCourses, setTopCourses] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [userMap, setUserMap] = useState({});
  const [courseMap, setCourseMap] = useState({});
  const [chartRange, setChartRange] = useState(7);
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'enrollments'
  const [tableTab, setTableTab] = useState('enrollments'); // 'enrollments' | 'orders'
  const [activePointIdx, setActivePointIdx] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    const [summaryRes, enrollmentsRes, coursesRes, usersRes, reviewsRes, ordersRes] =
      await Promise.all([
        client.get('/api/admin/dashboard/summary').then((r) => r.data),
        enrollmentApi.getAllEnrollments({ page: 0, size: 200 }).catch(() => ({ content: [] })),
        courseApi.getAdminCourses({ page: 0, size: 100 }).catch(() => ({ content: [] })),
        client
          .get('/api/admin/users')
          .then((r) => r.data)
          .catch(() => []),
        reviewApi.getAdminReviews({ page: 0, size: 100 }).catch(() => ({ content: [] })),
        shopApi.getAdminOrders().catch(() => []),
      ]);

    const enrollmentsList = enrollmentsRes?.content ?? [];
    const coursesList = coursesRes?.content ?? [];
    const allUsers = Array.isArray(usersRes) ? usersRes : usersRes?.content ?? [];
    const reviewsList = reviewsRes?.content ?? [];
    const ordersList = Array.isArray(ordersRes) ? ordersRes : [];

    const uMap = {};
    allUsers.forEach((u) => {
      uMap[u.id] = u;
    });

    const cMap = {};
    coursesList.forEach((c) => {
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

    const rankedCourses = coursesList
      .map((c) => ({
        id: c.id,
        title: c.title,
        categoryName: c.categoryName || 'Chưa phân loại',
        price: Number(c.price ?? 0),
        sales: countByCourse[c.id] || 0,
        revenue: (countByCourse[c.id] || 0) * Number(c.price ?? 0),
      }))
      .sort((a, b) => b.sales - a.sales || b.revenue - a.revenue)
      .slice(0, 5);

    return {
      summary: summaryRes,
      allEnrollments: enrollmentsList,
      recentEnrollments: enrollmentsList.slice(0, 6),
      allOrders: ordersList,
      allReviews: reviewsList,
      recentReviews: reviewsList.slice(0, 4),
      allCourses: coursesList,
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
        setAllOrders(res.allOrders);
        setAllReviews(res.allReviews);
        setRecentReviews(res.recentReviews);
        setAllCourses(res.allCourses);
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
      setAllOrders(res.allOrders);
      setAllReviews(res.allReviews);
      setRecentReviews(res.recentReviews);
      setAllCourses(res.allCourses);
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
      setAllReviews(res.allReviews);
      setRecentReviews(res.recentReviews);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể duyệt đánh giá.');
    } finally {
      setApprovingId(null);
    }
  }

  const trendBuckets = useMemo(
    () => buildTrendBuckets(allEnrollments, allOrders, courseMap, chartRange),
    [allEnrollments, allOrders, courseMap, chartRange],
  );

  // Biểu đồ 2: Phân bổ học viên & doanh thu theo Danh mục (Donut Chart)
  const categoryStats = useMemo(() => {
    const map = {};
    allCourses.forEach((c) => {
      const cat = c.categoryName || 'Chưa phân loại';
      if (!map[cat]) {
        map[cat] = { label: cat, courses: 0, enrollments: 0, revenue: 0 };
      }
      map[cat].courses += 1;
    });

    allEnrollments.forEach((enr) => {
      if (enr.status === 'CANCELLED') return;
      const c = courseMap[enr.courseId];
      const cat = c?.categoryName || 'Chưa phân loại';
      if (!map[cat]) {
        map[cat] = { label: cat, courses: 0, enrollments: 0, revenue: 0 };
      }
      map[cat].enrollments += 1;
      map[cat].revenue += Number(c?.price ?? 0);
    });

    return Object.values(map)
      .sort((a, b) => b.enrollments - a.enrollments || b.courses - a.courses)
      .slice(0, 6)
      .map((item, idx) => ({
        ...item,
        value: Math.max(1, item.enrollments || item.courses),
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }));
  }, [allCourses, allEnrollments, courseMap]);

  // Biểu đồ 3: Trạng thái Học tập & Đơn hàng (Donut Chart + Order Funnel)
  const orderMetrics = useMemo(() => {
    const completed = allOrders.filter((o) => o.status === 'COMPLETED');
    const pending = allOrders.filter((o) => o.status === 'PENDING');
    const cancelled = allOrders.filter((o) => o.status === 'CANCELLED');
    const paidRevenue = completed.reduce((s, o) => s + Number(o.finalAmount || 0), 0);
    const voucherDiscount = completed.reduce((s, o) => s + Number(o.discountAmount || 0), 0);
    return {
      total: allOrders.length,
      completedCount: completed.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      paidRevenue,
      voucherDiscount,
    };
  }, [allOrders]);

  // Biểu đồ 4: Phân bố đánh giá 5★ -> 1★
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
      counts[star] = (counts[star] || 0) + 1;
    });
    const total = Math.max(1, allReviews.length);
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      pct: Math.round((counts[star] / total) * 100),
    }));
  }, [allReviews]);

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
      trend: `${orderMetrics.completedCount} đơn TT thành công`,
      grad: 'nx-grad-emerald',
      href: '/admin/enrollments',
    },
    {
      label: 'Lượt đăng ký khóa học',
      val: formatNumber(summary?.totalEnrollments ?? allEnrollments.length),
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
      val: formatNumber(summary?.totalReviews ?? allReviews.length),
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

  const activeEnrCount = Number(summary?.activeEnrollments ?? 0);
  const completedEnrCount = Number(summary?.completedEnrollments ?? 0);
  const cancelledEnrCount = Math.max(
    0,
    Number(summary?.totalEnrollments ?? allEnrollments.length) - activeEnrCount - completedEnrCount,
  );
  const completionRatePct =
    activeEnrCount + completedEnrCount > 0
      ? Math.round((completedEnrCount / (activeEnrCount + completedEnrCount)) * 100)
      : 0;

  const enrollmentSegments = [
    { label: 'Đã hoàn thành (100%)', value: completedEnrCount, color: '#10b981' },
    { label: 'Đang học tập', value: activeEnrCount, color: '#2563eb' },
    { label: 'Đã hủy', value: cancelledEnrCount, color: '#ef4444' },
  ];

  return (
    <div className="nx-dash-wrap">
      {/* Header */}
      <div className="nx-dash-header">
        <div>
          <h1 className="nx-dash-title">Tổng quan hệ thống</h1>
          <p className="nx-dash-subtitle">
            Theo dõi doanh thu, đối soát đơn hàng SePay, tỷ trọng danh mục, tiến độ học viên và chất lượng đào tạo theo thời gian thực.
          </p>
        </div>

        <div className="nx-dash-header-right">
          <div className="nx-dash-live-pill">
            <span className="nx-dash-live-dot" />
            <span>Dữ liệu trực tiếp · Thời gian thực</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="nx-dash-refresh-btn"
          >
            <Icon name="trendingUp" size={16} />
            <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới số liệu'}</span>
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

      {/* Quick Operational Strip (4 Secondary Metrics) */}
      <div className="nx-dash-ops-strip">
        <div className="nx-dash-ops-item">
          <div className="nx-dash-ops-icon is-blue">
            <Icon name="book" size={18} />
          </div>
          <div>
            <span className="nx-dash-ops-label">Khóa học đang mở bán</span>
            <strong className="nx-dash-ops-val">
              {formatNumber(summary?.publishedCourses ?? 0)} khóa · {formatNumber(summary?.draftCourses ?? 0)} nháp
            </strong>
          </div>
        </div>

        <div className="nx-dash-ops-item">
          <div className="nx-dash-ops-icon is-emerald">
            <Icon name="qrCode" size={18} />
          </div>
          <div>
            <span className="nx-dash-ops-label">Đơn thanh toán SePay / QR</span>
            <strong className="nx-dash-ops-val">
              {orderMetrics.completedCount} hoàn tất · {orderMetrics.pendingCount} chờ · {orderMetrics.cancelledCount} hủy
            </strong>
          </div>
        </div>

        <div className="nx-dash-ops-item">
          <div className="nx-dash-ops-icon is-amber">
            <Icon name="ticket" size={18} />
          </div>
          <div>
            <span className="nx-dash-ops-label">Tổng ưu đãi Voucher đã áp dụng</span>
            <strong className="nx-dash-ops-val">{formatPrice(orderMetrics.voucherDiscount)}</strong>
          </div>
        </div>

        <div className="nx-dash-ops-item">
          <div className="nx-dash-ops-icon is-violet">
            <Icon name="award" size={18} />
          </div>
          <div>
            <span className="nx-dash-ops-label">Tỷ lệ hoàn thành khóa học</span>
            <strong className="nx-dash-ops-val">{completionRatePct}% học viên hoàn tất</strong>
          </div>
        </div>
      </div>

      {/* CHART 1: Interactive Revenue & Enrollment Trend Chart */}
      <section className="nx-dash-panel nx-dash-chart-panel">
        <div className="nx-dash-panel-head">
          <div>
            <h2 className="nx-dash-panel-title">
              <span className="nx-dash-panel-icon nx-grad-emerald">
                <Icon name="chart" size={18} />
              </span>
              <span>Biểu đồ 1: Xu hướng Doanh thu &amp; Lượt ghi danh theo ngày</span>
            </h2>
            <p className="nx-dash-chart-sub">
              Di chuột vào từng cột mốc để đối chiếu doanh thu học phí và số lượng học viên đăng ký mới.
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

            <div className="nx-dash-range-tabs" role="tablist" aria-label="Chỉ số biểu đồ">
              {[
                { val: 'revenue', label: 'Theo Doanh thu' },
                { val: 'enrollments', label: 'Theo Lượt đăng ký' },
              ].map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => setChartMetric(m.val)}
                  className={`nx-dash-range-tab${chartMetric === m.val ? ' is-active' : ''}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="nx-dash-range-tabs" role="tablist" aria-label="Khung thời gian biểu đồ">
              {[
                { val: 7, label: '7 mốc' },
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
              chartMetric === 'revenue'
                ? bucket.revenue > 0
                  ? Math.max(14, Math.round((bucket.revenue / maxBucketRevenue) * 100))
                  : bucket.count > 0
                    ? 18
                    : 6
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
                  <span>{bucket.count} lượt ghi danh</span>
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

      {/* ANALYTICS CHARTS ROW: Chart 2 (Category Donut) + Chart 3 (Enrollment & Order Funnel) + Chart 4 (Rating Histogram) */}
      <div className="nx-dash-analytics-grid">
        {/* CHART 2: Category Distribution Donut */}
        <section className="nx-dash-panel">
          <div className="nx-dash-panel-head">
            <h2 className="nx-dash-panel-title">
              <span className="nx-dash-panel-icon nx-grad-primary">
                <Icon name="layers" size={17} />
              </span>
              <span>Biểu đồ 2: Tỷ trọng theo Danh mục</span>
            </h2>
            <Link to="/admin/categories" className="nx-dash-mini-link">
              Danh mục →
            </Link>
          </div>

          <div className="nx-dash-donut-layout">
            <SvgDonutChart
              segments={categoryStats}
              centerValue={formatNumber(allCourses.length)}
              centerLabel="Khóa học"
            />

            <div className="nx-dash-legend-list">
              {categoryStats.map((cat) => {
                const totalCatVal = Math.max(
                  1,
                  categoryStats.reduce((s, c) => s + c.value, 0),
                );
                const pct = Math.round((cat.value / totalCatVal) * 100);
                return (
                  <div key={cat.label} className="nx-dash-legend-row">
                    <div className="nx-dash-legend-left">
                      <span className="nx-dash-legend-dot" style={{ background: cat.color }} />
                      <span className="nx-dash-legend-name" title={cat.label}>
                        {cat.label}
                      </span>
                    </div>
                    <div className="nx-dash-legend-right">
                      <strong>{cat.enrollments} HV</strong>
                      <span className="nx-dash-legend-pct">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CHART 3: Learning Progress & Order Conversion Funnel */}
        <section className="nx-dash-panel">
          <div className="nx-dash-panel-head">
            <h2 className="nx-dash-panel-title">
              <span className="nx-dash-panel-icon nx-grad-cyan">
                <Icon name="award" size={17} />
              </span>
              <span>Biểu đồ 3: Tiến độ &amp; Đơn hàng</span>
            </h2>
            <Link to="/admin/enrollments" className="nx-dash-mini-link">
              Chi tiết →
            </Link>
          </div>

          <div className="nx-dash-donut-layout">
            <SvgDonutChart
              segments={enrollmentSegments}
              centerValue={`${completionRatePct}%`}
              centerLabel="Hoàn thành"
            />

            <div className="nx-dash-legend-list">
              {enrollmentSegments.map((seg) => (
                <div key={seg.label} className="nx-dash-legend-row">
                  <div className="nx-dash-legend-left">
                    <span className="nx-dash-legend-dot" style={{ background: seg.color }} />
                    <span className="nx-dash-legend-name">{seg.label}</span>
                  </div>
                  <div className="nx-dash-legend-right">
                    <strong>{formatNumber(seg.value)}</strong>
                  </div>
                </div>
              ))}

              <div className="nx-dash-order-mini-bars">
                <div className="nx-dash-order-mini-title">Tỷ lệ chuyển đổi đơn hàng SePay</div>
                <div className="nx-dash-stacked-bar">
                  <div
                    style={{
                      width: `${Math.max(10, Math.round((orderMetrics.completedCount / Math.max(1, orderMetrics.total)) * 100))}%`,
                      background: '#10b981',
                    }}
                    title={`Đã thanh toán: ${orderMetrics.completedCount}`}
                  />
                  <div
                    style={{
                      width: `${Math.round((orderMetrics.pendingCount / Math.max(1, orderMetrics.total)) * 100)}%`,
                      background: '#f59e0b',
                    }}
                    title={`Chờ thanh toán: ${orderMetrics.pendingCount}`}
                  />
                  <div
                    style={{
                      width: `${Math.round((orderMetrics.cancelledCount / Math.max(1, orderMetrics.total)) * 100)}%`,
                      background: '#ef4444',
                    }}
                    title={`Đã hủy: ${orderMetrics.cancelledCount}`}
                  />
                </div>
                <div className="nx-dash-order-mini-legend">
                  <span><i style={{ background: '#10b981' }} /> Thành công ({orderMetrics.completedCount})</span>
                  <span><i style={{ background: '#f59e0b' }} /> Chờ TT ({orderMetrics.pendingCount})</span>
                  <span><i style={{ background: '#ef4444' }} /> Đã hủy ({orderMetrics.cancelledCount})</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHART 4: Rating Star Distribution Histogram */}
        <section className="nx-dash-panel">
          <div className="nx-dash-panel-head">
            <h2 className="nx-dash-panel-title">
              <span className="nx-dash-panel-icon nx-grad-orange">
                <Icon name="star" size={17} />
              </span>
              <span>Biểu đồ 4: Phân bố Đánh giá sao</span>
            </h2>
            <Link to="/admin/reviews" className="nx-dash-mini-link">
              Kiểm duyệt →
            </Link>
          </div>

          <div className="nx-dash-rating-chart">
            <div className="nx-dash-rating-summary-box">
              <div className="nx-dash-rating-big">{avgRating}</div>
              <div>
                <StarRating value={Number(summary?.averageRating ?? 5)} />
                <div className="nx-dash-rating-count">
                  {formatNumber(summary?.totalReviews ?? allReviews.length)} nhận xét ·{' '}
                  <strong>{formatNumber(summary?.pendingReviews ?? 0)} chờ duyệt</strong>
                </div>
              </div>
            </div>

            <div className="nx-dash-rating-bars">
              {ratingDistribution.map((row) => (
                <div key={row.star} className="nx-dash-rating-bar-row">
                  <span className="nx-dash-rating-star-lbl">{row.star} ★</span>
                  <div className="nx-dash-rating-bar-track">
                    <div
                      className="nx-dash-rating-bar-fill"
                      style={{
                        width: `${row.count > 0 ? Math.max(8, row.pct) : 0}%`,
                        background:
                          row.star >= 4 ? '#f59e0b' : row.star === 3 ? '#3b82f6' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="nx-dash-rating-bar-val">
                    {row.count} ({row.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Main 3-Column Section: Recent Enrollments / SePay Orders (2 cols) + Best Seller Courses (1 col) */}
      <div className="nx-dash-main-grid">
        {/* Left 2 Columns: Tabbed Recent Enrollments & Recent Orders */}
        <section className="nx-dash-panel nx-dash-panel-wide">
          <div className="nx-dash-panel-head">
            <div className="nx-dash-table-tabs">
              <button
                type="button"
                onClick={() => setTableTab('enrollments')}
                className={`nx-dash-table-tab${tableTab === 'enrollments' ? ' is-active' : ''}`}
              >
                <Icon name="trendingUp" size={16} />
                <span>Ghi danh khóa học mới ({allEnrollments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTableTab('orders')}
                className={`nx-dash-table-tab${tableTab === 'orders' ? ' is-active' : ''}`}
              >
                <Icon name="qrCode" size={16} />
                <span>Giao dịch Đơn hàng SePay ({allOrders.length})</span>
              </button>
            </div>

            <Link to="/admin/enrollments" className="nx-dash-view-all-btn">
              <span>Xem tất cả</span>
              <Icon name="arrowRight" size={15} />
            </Link>
          </div>

          {tableTab === 'enrollments' ? (
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
                          <Link
                            to={`/admin/courses/${item.courseId}/edit`}
                            className="nx-dash-cell-course"
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            {item.title || course?.title || `Khóa học #${item.courseId}`}
                          </Link>
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
          ) : (
            <div className="nx-dash-table-wrap">
              <table className="nx-dash-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Học viên</th>
                    <th>Khóa học</th>
                    <th>Thanh toán</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.slice(0, 6).map((ord) => {
                    const st = ORDER_STATUS_BADGE[ord.status] || {
                      label: ord.status,
                      cls: 'is-amber',
                    };
                    return (
                      <tr key={ord.id || ord.orderCode}>
                        <td className="nx-dash-code">#{ord.orderCode}</td>
                        <td>
                          <div className="nx-dash-cell-primary">
                            {ord.userFullName || `Học viên #${ord.userId}`}
                          </div>
                          <div className="nx-dash-cell-sub">
                            {ord.userEmail || formatDate(ord.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div className="nx-dash-cell-course" title={ord.courseTitles}>
                            {ord.courseTitles}
                          </div>
                          {ord.voucherCode && (
                            <div className="nx-dash-cell-sub">
                              Voucher: <strong>{ord.voucherCode}</strong> (-{formatPrice(ord.discountAmount || 0)})
                            </div>
                          )}
                        </td>
                        <td className="nx-dash-price">{formatPrice(ord.finalAmount || 0)}</td>
                        <td>
                          <span className="nx-dash-pct">{ord.paymentMethod || 'SEPAY'}</span>
                        </td>
                        <td>
                          <span className={`nx-dash-status-pill ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {allOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="nx-dash-empty-row">
                        Chưa có đơn hàng thanh toán nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right 1 Column: Best Sellers / Top Courses + Revenue Highlight */}
        <section className="nx-dash-panel nx-dash-panel-side">
          <h2 className="nx-dash-side-title">Top Khóa học ăn khách nhất</h2>

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
                      <span className="nx-dash-bestseller-badge">{course.sales} HV</span>
                    </div>
                    <div className="nx-dash-bar-track">
                      <div
                        className={`nx-dash-bar-fill ${grad}`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="nx-dash-bestseller-meta">
                      <span>{course.categoryName}</span>
                      <strong>{formatPrice(course.revenue)}</strong>
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
            <div className="nx-dash-revenue-label">Tổng doanh thu khóa học</div>
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
