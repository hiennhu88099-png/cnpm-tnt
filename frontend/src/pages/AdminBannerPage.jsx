import { useEffect, useRef, useState } from 'react';
import FormField from '../components/FormField';
import { Alert, Badge, Button, Card, EmptyState, Icon, PageHeader, Skeleton } from '../components/ui';
import { formatNumber } from '../utils/format';
import { useShopStore } from '../utils/shopStore';

const BANNER_TYPE_OPTIONS = [
  { value: 'HomeMain', label: 'Trang chủ chính', hint: 'Banner lớn trên cùng (21:9)' },
  { value: 'Promo', label: 'Khuyến mãi', hint: 'Ô trái khối dưới (21:9)' },
  { value: 'Side', label: 'Cột phải nội dung', hint: 'Cột phải trong trang (21:9)' },
  { value: 'FloatLeft', label: 'Liễng trái', hint: 'Cạnh trái màn hình (3:4)' },
  { value: 'FloatRight', label: 'Liễng phải', hint: 'Cạnh phải màn hình (3:4)' },
];

const BANNER_PRESETS = [
  { label: 'Mẫu chính (21:9)', url: '/banners/hero-main-1.svg', type: 'HomeMain' },
  { label: 'Mẫu khuyến mãi (21:9)', url: '/banners/promo-left.svg', type: 'Promo' },
  { label: 'Mẫu cột phải (21:9)', url: '/banners/side-right-1.svg', type: 'Side' },
  { label: 'Mẫu liễng trái (3:4)', url: '/banners/float-left.svg', type: 'FloatLeft' },
  { label: 'Mẫu liễng phải (3:4)', url: '/banners/float-right.svg', type: 'FloatRight' },
];

const BANNER_TYPE_MAP = Object.fromEntries(
  BANNER_TYPE_OPTIONS.map((opt) => [opt.value, opt])
);

const INITIAL_FORM = {
  id: '',
  title: '',
  imageUrl: '/banners/hero-main-1.svg',
  link: '/courses',
  type: 'HomeMain',
  position: 1,
  active: true,
};

function readAndOptimizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl || file.type === 'image/svg+xml' || dataUrl.length < 250 * 1024) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 900;
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function BannerInlineEditor({
  form,
  setForm,
  formError,
  submitting,
  isCreating,
  onSubmit,
  onCancel,
}) {
  const fileInputRef = useRef(null);
  const isFloatPreview = form.type === 'FloatLeft' || form.type === 'FloatRight';

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'position') {
      setForm((prev) => ({ ...prev, position: Number(value) || 1 }));
    } else if (name === 'active') {
      setForm((prev) => ({ ...prev, active: value === 'true' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await readAndOptimizeImage(file);
      if (optimized) {
        setForm((prev) => ({ ...prev, imageUrl: optimized }));
      }
    } catch {
      // ignore
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-banner-inline-editor" noValidate>
      <div className="admin-banner-inline-head">
        <div>
          <h3 className="admin-banner-inline-title">
            {isCreating ? 'Thêm Banner mới' : `Đang chỉnh sửa: ${form.title || 'Banner'}`}
          </h3>
          <p className="admin-banner-inline-sub">
            Thay đổi hình ảnh, tiêu đề, liên kết đích và vị trí xuất hiện ngay tại đây.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
          <Icon name="x" size={16} /> Đóng
        </Button>
      </div>

      <Alert variant="error">{formError}</Alert>

      <div className="admin-banner-inline-grid">
        {/* Cột trái của khung sửa: Xem trước & Chọn mẫu / Tải ảnh */}
        <div className="admin-banner-inline-media">
          <label className="field-label">Xem trước &amp; Tải ảnh Banner *</label>
          <div
            className={`admin-banner-upload-preview${isFloatPreview ? ' is-float' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            title="Bấm để chọn ảnh từ máy tính"
          >
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="Xem trước banner" />
            ) : (
              <div className="admin-banner-upload-placeholder">
                <Icon name="image" size={26} />
                <span>Bấm để tải ảnh từ máy tính</span>
              </div>
            )}
            <span className="admin-banner-upload-hint">
              <Icon name="image" size={13} /> Đổi ảnh từ máy
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />

          <div className="admin-banner-preset-bar">
            <span className="admin-banner-preset-label">Chọn nhanh mẫu mặc định:</span>
            <div className="admin-banner-preset-chips">
              {BANNER_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      imageUrl: preset.url,
                      type: preset.type,
                    }))
                  }
                  className={`admin-banner-preset-chip${
                    form.imageUrl === preset.url ? ' is-active' : ''
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải của khung sửa: Các trường cấu hình */}
        <div className="admin-banner-inline-fields">
          <FormField
            label="Tiêu đề chương trình"
            name="title"
            placeholder="Ví dụ: Khai giảng lộ trình Fullstack 2026"
            value={form.title}
            onChange={handleChange}
            maxLength={160}
            required
          />

          <FormField
            label="Đường dẫn ảnh (URL)"
            name="imageUrl"
            placeholder="/banners/hero-main-1.svg hoặc https://..."
            value={form.imageUrl}
            onChange={handleChange}
            required
          />

          <div className="form-row">
            <FormField
              label="Liên kết khi bấm (Link)"
              name="link"
              placeholder="Ví dụ: /courses hoặc /cart"
              value={form.link}
              onChange={handleChange}
            />

            <FormField
              label="Vị trí xuất hiện"
              name="type"
              as="select"
              value={form.type}
              onChange={handleChange}
            >
              {BANNER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.hint}
                </option>
              ))}
            </FormField>
          </div>

          <div className="form-row">
            <FormField
              label="Thứ tự ưu tiên"
              name="position"
              type="number"
              min="1"
              value={form.position}
              onChange={handleChange}
              required
            />

            <FormField
              label="Trạng thái hiển thị"
              name="active"
              as="select"
              value={String(form.active)}
              onChange={handleChange}
            >
              <option value="true">Đang hiển thị</option>
              <option value="false">Tạm ẩn</option>
            </FormField>
          </div>

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" loading={submitting}>
              <Icon name="check" size={16} />
              {isCreating ? 'Xác nhận thêm Banner' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function AdminBannerPage() {
  const {
    banners,
    bannersLoading,
    saveBanner,
    toggleBannerActive,
    deleteBanner,
    syncShopFromBackend,
  } = useShopStore();
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [editingId, setEditingId] = useState(null); // null | 'NEW' | banner.id
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: 'success', text: '' });

  useEffect(() => {
    syncShopFromBackend(true);
  }, [syncShopFromBackend]);

  const activeCount = banners.filter((b) => b.active).length;
  const inactiveCount = banners.length - activeCount;

  const filteredBanners = banners.filter((b) => {
    if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;
    if (statusFilter === 'ACTIVE' && !b.active) return false;
    if (statusFilter === 'INACTIVE' && b.active) return false;
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      return (
        (b.title || '').toLowerCase().includes(q) ||
        (b.link || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  function openCreate() {
    const nextPos =
      banners.length > 0 ? Math.max(...banners.map((b) => Number(b.position) || 0)) + 1 : 1;
    setEditingId('NEW');
    setForm({ ...INITIAL_FORM, position: nextPos });
    setFormError('');
    setNotice({ type: 'success', text: '' });
  }

  function startEdit(banner) {
    setEditingId(banner.id);
    setForm({
      id: banner.id,
      title: banner.title || '',
      imageUrl: banner.imageUrl || '',
      link: banner.link || '/courses',
      type: banner.type || 'HomeMain',
      position: Number(banner.position) || 1,
      active: banner.active !== false,
    });
    setFormError('');
    setNotice({ type: 'success', text: '' });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề chương trình cho banner.');
      return;
    }
    if (!form.imageUrl.trim()) {
      setFormError('Vui lòng chọn hoặc nhập đường dẫn hình ảnh banner.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const isCreating = editingId === 'NEW';
      const titleText = form.title.trim();
      await saveBanner({
        ...form,
        id: isCreating ? '' : editingId,
        title: titleText,
        imageUrl: form.imageUrl.trim(),
        link: (form.link || '/courses').trim(),
      });
      setEditingId(null);
      setNotice({
        type: 'success',
        text: isCreating
          ? `Đã thêm banner mới “${titleText}”.`
          : `Đã cập nhật banner “${titleText}” thành công.`,
      });
    } catch {
      setFormError('Không thể lưu banner. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(banner) {
    await toggleBannerActive(banner.id);
    setNotice({
      type: 'success',
      text: `Đã ${banner.active ? 'tạm ẩn' : 'bật hiển thị'} banner “${banner.title}”.`,
    });
  }

  async function handleDelete(banner) {
    if (!window.confirm(`Xác nhận xóa vĩnh viễn banner “${banner.title}”?`)) return;
    await deleteBanner(banner.id);
    if (String(editingId) === String(banner.id)) {
      setEditingId(null);
    }
    setNotice({
      type: 'success',
      text: `Đã xóa banner “${banner.title}”.`,
    });
  }

  const hasFilters = typeFilter !== 'ALL' || statusFilter !== 'ALL' || Boolean(keyword.trim());

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Giao diện cửa hàng"
        title="Quản lý Banner Trang chủ"
        subtitle="Thiết lập hình ảnh quảng cáo, vị trí hiển thị và liễng hai bên trên Trang chủ."
        actions={
          editingId !== 'NEW' && (
            <Button onClick={openCreate}>
              <Icon name="plus" size={16} /> Thêm Banner mới
            </Button>
          )
        }
      />

      <Alert variant={notice.type}>{notice.text}</Alert>

      {/* Khung tạo mới mở trực tiếp trên trang (Không dùng popup nổi) */}
      {editingId === 'NEW' && (
        <Card className="admin-banner-create-card">
          <BannerInlineEditor
            form={form}
            setForm={setForm}
            formError={formError}
            submitting={submitting}
            isCreating
            onSubmit={handleSubmit}
            onCancel={cancelEdit}
          />
        </Card>
      )}

      {/* 3 Thẻ thống kê nhanh */}
      <div className="nx-dash-breakdown-grid">
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Tổng số Banner</div>
          <div className="nx-dash-stat-value">{formatNumber(banners.length)}</div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang hiển thị</div>
          <div className="nx-dash-stat-value" style={{ color: '#059669' }}>
            {formatNumber(activeCount)}
          </div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang tạm ẩn</div>
          <div className="nx-dash-stat-value" style={{ color: '#d97706' }}>
            {formatNumber(inactiveCount)}
          </div>
        </div>
      </div>

      <Card
        title="Danh sách Banner"
        subtitle={`Hiển thị ${filteredBanners.length} / ${banners.length} banner — Bấm "Sửa" trên thẻ để chỉnh sửa trực tiếp`}
      >
        <div className="nx-filter-pills" role="tablist" aria-label="Lọc theo vị trí banner">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`nx-filter-pill${typeFilter === 'ALL' ? ' is-active' : ''}`}
          >
            <span>Tất cả vị trí ({banners.length})</span>
          </button>
          {BANNER_TYPE_OPTIONS.map((opt) => {
            const count = banners.filter((b) => b.type === opt.value).length;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                className={`nx-filter-pill${typeFilter === opt.value ? ' is-active' : ''}`}
              >
                <span>
                  {opt.label} ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="admin-toolbar">
          <div className="catalog-search">
            <label htmlFor="admin-banner-search" className="sr-only">
              Tìm kiếm banner
            </label>
            <input
              id="admin-banner-search"
              className="input"
              type="search"
              placeholder="Tìm theo tên chương trình hoặc đường dẫn..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <label htmlFor="admin-banner-status" className="sr-only">
            Trạng thái hiển thị
          </label>
          <select
            id="admin-banner-status"
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hiển thị ({activeCount})</option>
            <option value="INACTIVE">Đang tạm ẩn ({inactiveCount})</option>
          </select>
        </div>

        {bannersLoading ? (
          <div className="admin-banner-cards-grid" aria-busy="true" aria-label="Đang tải banner">
            {[0, 1, 2, 3].map((idx) => (
              <article key={idx} className="admin-banner-item-card is-skeleton-card">
                <div className="admin-banner-item-thumb">
                  <Skeleton width="100%" height="100%" radius={0} />
                </div>
                <div className="admin-banner-item-body">
                  <Skeleton width="82%" height={18} radius={6} />
                  <div className="admin-banner-item-meta" style={{ marginTop: 10 }}>
                    <Skeleton width="65%" height={14} radius={4} />
                    <Skeleton width="52%" height={14} radius={4} />
                  </div>
                  <div className="admin-banner-card-foot" style={{ marginTop: 14 }}>
                    <div className="row-actions">
                      <Skeleton width={68} height={32} radius={8} />
                      <Skeleton width={68} height={32} radius={8} />
                      <Skeleton width={68} height={32} radius={8} />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : filteredBanners.length === 0 ? (
          <EmptyState
            icon="image"
            title={hasFilters ? 'Không tìm thấy banner phù hợp' : 'Chưa có banner nào'}
            description={
              hasFilters
                ? 'Thử chọn vị trí khác hoặc xóa từ khóa tìm kiếm.'
                : 'Thêm banner quảng cáo đầu tiên để hiển thị trên Trang chủ.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTypeFilter('ALL');
                    setStatusFilter('ALL');
                    setKeyword('');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : (
                <Button onClick={openCreate}>Thêm Banner mới</Button>
              )
            }
          />
        ) : (
          <div className="admin-banner-cards-grid">
            {filteredBanners.map((banner) => {
              const typeMeta = BANNER_TYPE_MAP[banner.type] || BANNER_TYPE_OPTIONS[0];
              const isFloat = banner.type === 'FloatLeft' || banner.type === 'FloatRight';
              const isEditingThis = String(editingId) === String(banner.id);

              if (isEditingThis) {
                return (
                  <article
                    key={banner.id}
                    className="admin-banner-item-card is-selected is-editing-inline"
                  >
                    <BannerInlineEditor
                      form={form}
                      setForm={setForm}
                      formError={formError}
                      submitting={submitting}
                      isCreating={false}
                      onSubmit={handleSubmit}
                      onCancel={cancelEdit}
                    />
                  </article>
                );
              }

              return (
                <article
                  key={banner.id}
                  className={`admin-banner-item-card${!banner.active ? ' is-inactive' : ''}`}
                >
                  <div className="admin-banner-card-top">
                    <div className="admin-banner-card-badges">
                      <span className="admin-banner-pos-chip">Thứ tự #{banner.position}</span>
                      <Badge variant="primary">{typeMeta.label}</Badge>
                    </div>
                    <Badge variant={banner.active ? 'success' : 'warning'}>
                      {banner.active ? 'Đang hiển thị' : 'Đang ẩn'}
                    </Badge>
                  </div>

                  <div className={`admin-banner-preview-box${isFloat ? ' is-float' : ''}`}>
                    <img src={banner.imageUrl} alt={banner.title} loading="lazy" />
                  </div>

                  <div className="admin-banner-item-body">
                    <h3 className="admin-banner-item-title" title={banner.title}>
                      {banner.title}
                    </h3>

                    <div className="admin-banner-item-meta">
                      <div className="admin-banner-meta-row">
                        <Icon name="layers" size={14} />
                        <span>
                          Vị trí: <strong>{typeMeta.label}</strong> ({typeMeta.hint})
                        </span>
                      </div>
                      <div className="admin-banner-meta-row">
                        <Icon name="globe" size={14} />
                        <span>
                          Liên kết đích: <code>{banner.link || '/courses'}</code>
                        </span>
                      </div>
                    </div>

                    <div className="admin-banner-card-foot">
                      <div className="row-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(banner)}
                          className="nx-action-btn is-edit"
                        >
                          <Icon name="pen" size={14} />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(banner)}
                          className={`nx-action-btn ${banner.active ? 'is-warning' : 'is-success'}`}
                        >
                          <Icon name="power" size={14} />
                          <span>{banner.active ? 'Tắt' : 'Bật'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(banner)}
                          className="nx-action-btn is-danger"
                        >
                          <Icon name="trash" size={14} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
