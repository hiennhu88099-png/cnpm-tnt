// Bộ khung xương (Skeleton Loading) đồng bộ cho toàn bộ trang Frontend EduHub

export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  className = '',
  style,
}) {
  return (
    <span
      className={`skeleton-box${className ? ` ${className}` : ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Khung xương cho cụm Banner Trang chủ (Banner 21:9 trên cùng + cụm Banner Khuyến mãi chia 2 cột)
 */
export function BannerSkeleton({ showSubBanners = true }) {
  return (
    <div aria-hidden="true">
      <section className="store-banner-top-section">
        <div className="container">
          <div className="store-banner-card is-primary is-skeleton" />
        </div>
      </section>

      {showSubBanners && (
        <section className="store-banner-sub-section">
          <div className="container">
            <div className="store-banner-grid is-split">
              <div className="store-banner-card is-skeleton" style={{ aspectRatio: '16 / 9' }} />
              <div className="store-banner-side-stack">
                <div className="store-banner-card is-skeleton" style={{ aspectRatio: '16 / 9' }} />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Khung xương cho Ví Mã Giảm Giá Chớp Nhoáng (4 thẻ vé coupon)
 */
export function VoucherStripSkeleton({ count = 4 }) {
  return (
    <div className="store-voucher-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="store-ticket-card is-skeleton-card">
          <div className="store-ticket-stub is-skeleton-stub">
            <Skeleton width={24} height={68} radius={6} />
          </div>
          <div className="store-ticket-body">
            <Skeleton width="55%" height={18} radius={6} />
            <Skeleton width="42%" height={20} radius={6} style={{ marginTop: 6 }} />
            <Skeleton width="88%" height={12} radius={4} style={{ marginTop: 8 }} />
            <div className="store-ticket-foot" style={{ marginTop: 12 }}>
              <Skeleton width={85} height={12} radius={4} />
              <Skeleton width={68} height={28} radius={6} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Khung xương cho lưới Danh mục Khóa học trên Trang chủ
 */
export function CategoryGridSkeleton({ count = 6 }) {
  return (
    <div className="category-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="category-tile is-skeleton-tile">
          <Skeleton width={44} height={44} radius={10} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="72%" height={15} radius={6} />
            <Skeleton width="45%" height={12} radius={4} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Khung xương cho 1 Thẻ Khóa học (CourseCard)
 */
export function CourseCardSkeleton() {
  return (
    <article className="course-card is-skeleton-card" aria-hidden="true">
      <div className="course-card-thumb">
        <Skeleton width="100%" height="100%" radius={0} />
      </div>
      <div className="course-card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton width="92%" height={17} radius={6} />
          <Skeleton width="68%" height={17} radius={6} />
        </div>

        <div className="course-card-subrow" style={{ marginTop: 4 }}>
          <Skeleton width={110} height={13} radius={4} />
          <Skeleton width={64} height={20} radius={999} />
        </div>

        <div className="course-card-footer">
          <div className="course-card-price-row">
            <Skeleton width={96} height={22} radius={6} />
            <Skeleton width={88} height={32} radius={8} />
          </div>
          <div className="course-card-bottom-meta">
            <Skeleton width={84} height={13} radius={4} />
            <Skeleton width={68} height={20} radius={6} />
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Khung xương cho danh sách lưới nhiều Khóa học
 */
export function CourseGridSkeleton({ count = 6 }) {
  return (
    <div className="course-grid" aria-busy="true" aria-label="Đang tải danh sách khóa học">
      {Array.from({ length: count }).map((_, idx) => (
        <CourseCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * Khung xương cho trang Khóa học của tôi (MyCoursesPage)
 */
export function MyCoursesGridSkeleton({ count = 3 }) {
  return (
    <div className="course-grid" aria-busy="true" aria-label="Đang tải khóa học của bạn">
      {Array.from({ length: count }).map((_, idx) => (
        <article key={idx} className="course-card is-skeleton-card" aria-hidden="true">
          <div className="course-card-thumb">
            <Skeleton width="100%" height="100%" radius={0} />
          </div>
          <div className="course-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width={90} height={14} radius={4} />
              <Skeleton width={64} height={20} radius={999} />
            </div>
            <Skeleton width="88%" height={18} radius={6} />
            <Skeleton width="55%" height={14} radius={4} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Skeleton width={110} height={12} radius={4} />
                <Skeleton width={32} height={12} radius={4} />
              </div>
              <Skeleton width="100%" height={8} radius={999} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
              <Skeleton width="68%" height={38} radius={8} />
              <Skeleton width="32%" height={38} radius={8} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * Khung xương cho trang Chi tiết Khóa học (CourseDetailPage)
 */
export function CourseDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải chi tiết khóa học">
      <section className="course-hero">
        <div className="container course-hero-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Skeleton width={72} height={14} radius={4} />
              <Skeleton width={110} height={14} radius={4} />
            </div>
            <Skeleton width="88%" height={34} radius={8} />
            <Skeleton width="62%" height={34} radius={8} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
              <Skeleton width={140} height={18} radius={6} />
              <Skeleton width={96} height={18} radius={6} />
              <Skeleton width={96} height={18} radius={6} />
              <Skeleton width={110} height={18} radius={6} />
            </div>
          </div>

          <aside className="enroll-card">
            <div className="enroll-card-thumb">
              <Skeleton width="100%" height="100%" radius={0} />
            </div>
            <div className="enroll-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton width="52%" height={28} radius={6} />
              <Skeleton width="100%" height={44} radius={10} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Skeleton width="100%" height={38} radius={8} />
                <Skeleton width="100%" height={38} radius={8} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
                <Skeleton width="65%" height={15} radius={4} />
                <Skeleton width="75%" height={15} radius={4} />
                <Skeleton width="80%" height={15} radius={4} />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="container section">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <Skeleton width={110} height={38} radius={8} />
          <Skeleton width={140} height={38} radius={8} />
          <Skeleton width={150} height={38} radius={8} />
        </div>
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton width="32%" height={22} radius={6} />
          <Skeleton width="96%" height={15} radius={4} />
          <Skeleton width="92%" height={15} radius={4} />
          <Skeleton width="86%" height={15} radius={4} />
          <Skeleton width="68%" height={15} radius={4} />
        </div>
      </section>
    </div>
  );
}

/**
 * Khung xương cho trang Phòng học Video (LearningPage)
 */
export function LearningPageSkeleton() {
  return (
    <div className="container section" aria-busy="true" aria-label="Đang tải bài học">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '55%' }}>
          <Skeleton width={120} height={14} radius={4} />
          <Skeleton width="80%" height={26} radius={6} />
        </div>
        <Skeleton width={180} height={36} radius={8} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton width="100%" height={0} radius={12} style={{ paddingTop: '56.25%' }} />
          <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="55%" height={22} radius={6} />
            <Skeleton width="92%" height={15} radius={4} />
            <Skeleton width="84%" height={15} radius={4} />
          </div>
        </div>

        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton width="65%" height={20} radius={6} />
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <Skeleton width={28} height={28} radius={999} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton width="85%" height={14} radius={4} />
                <Skeleton width="42%" height={11} radius={4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Khung xương cho bảng dữ liệu Quản trị viên (Admin Table Skeleton)
 */
export function AdminTableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }} aria-busy="true" aria-label="Đang tải dữ liệu bảng">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 16,
          padding: '14px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {Array.from({ length: cols }).map((_, cIdx) => (
          <Skeleton key={cIdx} width="65%" height={13} radius={4} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: 16,
            padding: '16px 20px',
            borderBottom: rIdx < rows - 1 ? '1px solid #f1f5f9' : 'none',
            alignItems: 'center',
          }}
        >
          {Array.from({ length: cols }).map((__, cIdx) => (
            <Skeleton
              key={cIdx}
              width={cIdx === 0 ? '85%' : cIdx === cols - 1 ? '55%' : '72%'}
              height={15}
              radius={6}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Khung xương cho trang Tổng quan Quản trị (AdminDashboardPage)
 */
export function AdminDashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} aria-busy="true" aria-label="Đang tải bảng điều khiển">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="52%" height={14} radius={4} />
              <Skeleton width={38} height={38} radius={10} />
            </div>
            <Skeleton width="68%" height={28} radius={6} />
            <Skeleton width="45%" height={12} radius={4} />
          </div>
        ))}
      </div>

      <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={220} height={20} radius={6} />
          <Skeleton width={160} height={32} radius={8} />
        </div>
        <Skeleton width="100%" height={240} radius={12} />
      </div>

      <AdminTableSkeleton rows={5} cols={4} />
    </div>
  );
}

