import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import useApiQuery from '../hooks/useApiQuery';
import FormField from '../components/FormField';
import { Alert, Badge, Button, Card, EmptyState, Icon, PageHeader, PageLoading } from '../components/ui';
import { COURSE_LEVELS, COURSE_STATUSES, formatDuration, levelLabel, statusOption } from '../config/course';
import { formatPrice } from '../utils/format';

const EMPTY_FORM = {
  title: '',
  categoryId: '',
  price: '',
  originalPrice: '',
  level: 'BEGINNER',
  instructorName: '',
  duration: '',
  thumbnail: '',
  status: 'DRAFT',
  description: '',
};
const NO_ERROR = { message: '', fieldErrors: {} };

const PRICE_PRESETS = [
  { label: 'Miễn phí (0đ)', price: 0, originalPrice: 0 },
  { label: '299.000đ', price: 299000, originalPrice: 499000 },
  { label: '490.000đ', price: 490000, originalPrice: 790000 },
  { label: '590.000đ', price: 590000, originalPrice: 950000 },
  { label: '690.000đ', price: 690000, originalPrice: 1150000 },
  { label: '790.000đ', price: 790000, originalPrice: 1290000 },
];

const THUMBNAIL_PRESETS = [
  {
    label: 'Lập trình Web',
    url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Backend & Cloud',
    url: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'AI & Data',
    url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Thiết kế UI/UX',
    url: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=900&q=80',
  },
];

const toForm = (course) => ({
  title: course.title,
  categoryId: String(course.categoryId),
  price: course.price ?? '',
  originalPrice: course.originalPrice ?? '',
  level: course.level,
  instructorName: course.instructorName || '',
  duration: course.duration ?? '',
  thumbnail: course.thumbnail || '',
  status: course.status,
  description: course.description || '',
});

const toNumber = (value) => (value === '' || value == null ? null : Number(value));
const toText = (value) => value.trim() || null;

const toPayload = (form) => ({
  title: form.title.trim(),
  categoryId: toNumber(form.categoryId),
  price: toNumber(form.price),
  originalPrice: toNumber(form.originalPrice),
  level: form.level,
  instructorName: toText(form.instructorName),
  duration: toNumber(form.duration),
  thumbnail: toText(form.thumbnail),
  status: form.status,
  description: toText(form.description),
});

function readAndOptimizeCourseThumb(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl || file.type === 'image/svg+xml' || dataUrl.length < 180 * 1024) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxWidth = 960;
        const maxHeight = 540;
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
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// Một trang Studio dùng cho cả tạo mới (/admin/courses/new) và chỉnh sửa (/admin/courses/:id/edit)
export default function AdminCourseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formSource, setFormSource] = useState(null);
  const [error, setError] = useState(NO_ERROR);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(
    () =>
      Promise.all([
        courseApi.getAdminCategories(),
        isEdit ? courseApi.getAdminCourseById(id) : null,
        isEdit ? courseApi.getAdminCourseLessons(id).catch(() => []) : [],
      ]).then(([categories, course, lessons]) => ({ categories, course, lessons })),
    [id, isEdit],
  );
  const { data, error: loadError, loading } = useApiQuery(fetchData);

  if (data && !loading && formSource !== data) {
    setFormSource(data);
    setForm(data.course ? toForm(data.course) : EMPTY_FORM);
    setError(NO_ERROR);
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await readAndOptimizeCourseThumb(file);
      if (optimized && optimized.length <= 500) {
        setForm((prev) => ({ ...prev, thumbnail: optimized }));
      }
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(NO_ERROR);
    try {
      const payload = toPayload(form);
      if (isEdit) {
        await courseApi.updateCourse(id, payload);
        navigate('/admin/courses', { state: { notice: `Đã cập nhật khóa học “${payload.title}”.` } });
      } else {
        const created = await courseApi.createCourse(payload);
        navigate(`/admin/lessons?courseId=${created.id}`, {
          state: { notice: `Đã tạo khóa học “${payload.title}”. Hãy thêm bài học đầu tiên.` },
        });
      }
    } catch (err) {
      setError(parseApiError(err));
      setSubmitting(false);
    }
  };

  if (loading || (data && formSource !== data)) return <PageLoading text="Đang tải thông tin khóa học..." />;

  if (loadError) {
    return (
      <EmptyState
        icon="warning"
        title="Không tải được khóa học"
        description={loadError.message}
        action={<Button variant="secondary" to="/admin/courses">Về danh sách khóa học</Button>}
      />
    );
  }

  const activeCategories = data.categories.filter(
    (category) => category.status === 'ACTIVE' || String(category.id) === form.categoryId,
  );
  const lessonsCount = Array.isArray(data.lessons) ? data.lessons.length : 0;
  const selectedCategoryName =
    activeCategories.find((c) => String(c.id) === String(form.categoryId))?.name || 'Chưa chọn danh mục';

  const priceNum = Number(form.price || 0);
  const origNum = Number(form.originalPrice || 0);
  const discountPct =
    origNum > priceNum && origNum > 0 ? Math.round(((origNum - priceNum) / origNum) * 100) : 0;
  const statusInfo = statusOption(COURSE_STATUSES, form.status);

  const checklist = [
    { label: 'Đã nhập tên khóa học rõ ràng', ok: form.title.trim().length >= 5 },
    { label: 'Đã gán danh mục chủ đề', ok: Boolean(form.categoryId) },
    { label: 'Đã thiết lập học phí & giảng viên', ok: form.price !== '' && Boolean(form.instructorName.trim()) },
    { label: 'Đã có ảnh bìa & mô tả chi tiết', ok: Boolean(form.thumbnail.trim()) && form.description.trim().length >= 20 },
  ];
  const readyCount = checklist.filter((c) => c.ok).length;

  return (
    <div className="stack">
      {/* Top Header with Breadcrumb & Quick Actions */}
      <div className="nx-course-studio-top">
        <div>
          <Link to="/admin/courses" className="back-link">
            <Icon name="arrowLeft" size={16} />
            <span>Quay lại danh sách khóa học</span>
          </Link>
          <PageHeader
            eyebrow={isEdit ? `Chỉnh sửa khóa học #${id}` : 'Khởi tạo khóa học mới'}
            title={isEdit ? form.title || 'Sửa khóa học' : 'Thiết kế Khóa học mới'}
            subtitle={
              isEdit
                ? 'Cập nhật nội dung, chính sách học phí, ảnh bìa và trạng thái xuất bản trực tiếp.'
                : 'Điền thông tin khóa học ở cột trái và kiểm tra thẻ hiển thị thực tế ở cột phải.'
            }
            actions={
              <div className="row-actions">
                {isEdit && (
                  <>
                    <Button variant="secondary" to={`/courses/${id}`}>
                      <Icon name="eye" size={16} /> Xem trang công khai
                    </Button>
                    <Button variant="secondary" to={`/admin/lessons?courseId=${id}`}>
                      <Icon name="layers" size={16} /> Quản lý bài học ({lessonsCount})
                    </Button>
                  </>
                )}
              </div>
            }
          />
        </div>
      </div>

      {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

      {activeCategories.length === 0 && (
        <Alert variant="warning">
          Chưa có danh mục nào đang hoạt động. <Link to="/admin/categories" className="text-link">Tạo danh mục</Link>{' '}
          trước khi thêm khóa học.
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="nx-course-studio-grid">
        {/* LEFT COLUMN: 3 Structured Studio Cards */}
        <div className="nx-course-studio-main">
          {/* Card 1: Core Info */}
          <Card
            title="1. Thông tin cơ bản & Giảng dạy"
            subtitle="Tên khóa học, chủ đề phân loại, cấp độ học viên và nội dung giới thiệu."
          >
            <FormField
              label="Tên khóa học"
              name="title"
              placeholder="Ví dụ: Kiến Trúc Microservices Với Spring Boot 3, Kafka & Docker"
              value={form.title}
              onChange={handleChange}
              error={error.fieldErrors.title}
              hint={`${form.title.length}/200 ký tự`}
              maxLength={200}
              required
            />

            <div className="form-row">
              <FormField
                label="Danh mục khóa học"
                name="categoryId"
                as="select"
                value={form.categoryId}
                onChange={handleChange}
                error={error.fieldErrors.categoryId}
                required
              >
                <option value="">Chọn danh mục chủ đề</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </FormField>

              <FormField
                label="Trình độ đào tạo"
                name="level"
                as="select"
                value={form.level}
                onChange={handleChange}
                error={error.fieldErrors.level}
                required
              >
                {COURSE_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </FormField>
            </div>

            <div className="form-row">
              <FormField
                label="Giảng viên phụ trách"
                name="instructorName"
                placeholder="Ví dụ: TS. Nguyễn Minh Tuấn"
                value={form.instructorName}
                onChange={handleChange}
                error={error.fieldErrors.instructorName}
                maxLength={150}
              />

              <FormField
                label="Tổng thời lượng dự kiến (phút)"
                name="duration"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Ví dụ: 900"
                value={form.duration}
                onChange={handleChange}
                error={error.fieldErrors.duration}
                hint={
                  Number(form.duration) > 0
                    ? `Tương đương: ${formatDuration(Number(form.duration))}`
                    : 'Nhập số phút tổng cộng của khóa học.'
                }
              />
            </div>

            <FormField
              label="Mô tả chi tiết khóa học"
              name="description"
              as="textarea"
              rows={6}
              placeholder="Trình bày lộ trình học, đối tượng phù hợp và kỹ năng học viên đạt được sau khóa học..."
              value={form.description}
              onChange={handleChange}
              error={error.fieldErrors.description}
            />
          </Card>

          {/* Card 2: Pricing & Discount */}
          <Card
            title="2. Chính sách Học phí & Ưu đãi"
            subtitle="Thiết lập học phí bán thực tế và giá gốc niêm yết để tự động hiển thị phần trăm giảm giá."
          >
            <div className="nx-studio-preset-bar">
              <span className="nx-studio-preset-label">Chọn nhanh mức học phí phổ biến:</span>
              <div className="nx-studio-preset-chips">
                {PRICE_PRESETS.map((preset) => {
                  const isActive = Number(form.price) === preset.price && form.price !== '';
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          price: String(preset.price),
                          originalPrice: preset.originalPrice > 0 ? String(preset.originalPrice) : '',
                        }))
                      }
                      className={`nx-studio-preset-chip${isActive ? ' is-active' : ''}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-row">
              <FormField
                label="Giá bán thực tế (VND)"
                name="price"
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                placeholder="399000"
                value={form.price}
                onChange={handleChange}
                error={error.fieldErrors.price}
                hint="Nhập 0 nếu là khóa học Miễn phí."
                required
              />

              <FormField
                label="Giá gốc niêm yết (VND)"
                name="originalPrice"
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                placeholder="690000"
                value={form.originalPrice}
                onChange={handleChange}
                error={error.fieldErrors.originalPrice}
                hint="Hiển thị gạch ngang khi lớn hơn giá bán."
              />
            </div>

            <div className="nx-studio-price-summary">
              <div className="nx-studio-price-item">
                <span>Học phí áp dụng</span>
                <strong className="is-primary">
                  {priceNum === 0 && form.price !== '' ? 'Miễn phí (0 ₫)' : formatPrice(priceNum)}
                </strong>
              </div>
              <div className="nx-studio-price-item">
                <span>Giá niêm yết</span>
                <strong>{origNum > 0 ? formatPrice(origNum) : 'Không đặt giá gốc'}</strong>
              </div>
              <div className="nx-studio-price-item">
                <span>Mức tiết kiệm cho học viên</span>
                {discountPct > 0 ? (
                  <strong className="is-emerald">
                    Giảm {discountPct}% (-{formatPrice(origNum - priceNum)})
                  </strong>
                ) : (
                  <strong className="text-muted">0%</strong>
                )}
              </div>
            </div>
          </Card>

          {/* Card 3: Thumbnail & Visuals */}
          <Card
            title="3. Ảnh bìa & Nhận diện khóa học"
            subtitle="Dán liên kết ảnh bìa chất lượng cao (tỷ lệ 16:9) hoặc chọn mẫu ảnh công nghệ có sẵn."
          >
            <FormField
              label="Đường dẫn ảnh bìa (Thumbnail URL)"
              name="thumbnail"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={form.thumbnail}
              onChange={handleChange}
              error={error.fieldErrors.thumbnail}
              maxLength={500}
            />

            <div className="nx-studio-preset-bar" style={{ marginTop: 10 }}>
              <span className="nx-studio-preset-label">Chọn nhanh ảnh bìa mẫu theo chủ đề:</span>
              <div className="nx-studio-preset-chips">
                {THUMBNAIL_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, thumbnail: preset.url }))}
                    className={`nx-studio-preset-chip${form.thumbnail === preset.url ? ' is-active' : ''}`}
                  >
                    <Icon name="image" size={13} />
                    <span>{preset.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="nx-studio-preset-chip"
                >
                  <Icon name="plus" size={13} />
                  <span>Chọn file ảnh nhỏ</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sticky Publishing Panel & Live Course Card Preview */}
        <aside className="nx-course-studio-side">
          {/* Publishing & Status Box */}
          <Card
            title="Xuất bản & Trạng thái"
            subtitle="Kiểm soát khả năng hiển thị của khóa học trên cổng học viên."
          >
            <div className="nx-studio-status-banner">
              <span>Trạng thái hiện tại:</span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            <FormField
              label="Chế độ hiển thị"
              name="status"
              as="select"
              value={form.status}
              onChange={handleChange}
              error={error.fieldErrors.status}
              hint="Chỉ khóa học Đã xuất bản mới hiển thị ngoài trang chủ và danh sách."
            >
              {COURSE_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </FormField>

            <div className="nx-studio-checklist">
              <div className="nx-studio-checklist-head">
                <span>Mức độ hoàn thiện thông tin</span>
                <strong>{readyCount}/4 tiêu chí</strong>
              </div>
              {checklist.map((item) => (
                <div key={item.label} className={`nx-studio-check-row${item.ok ? ' is-ok' : ''}`}>
                  <Icon name={item.ok ? 'checkCircle' : 'clock'} size={15} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="nx-studio-submit-stack">
              <Button type="submit" loading={submitting} className="w-full">
                <Icon name="check" size={16} />
                <span>{submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi khóa học' : 'Tạo khóa học & Thêm bài học'}</span>
              </Button>
              <Button variant="ghost" to="/admin/courses" className="w-full">
                Hủy bỏ & Quay lại
              </Button>
            </div>
          </Card>

          {/* Live Course Card Preview */}
          <Card
            title="Xem trước Thẻ khóa học"
            subtitle="Giao diện hiển thị thực tế với học viên ngoài trang chủ."
          >
            <div className="nx-studio-preview-card">
              <div className="nx-studio-preview-thumb">
                {form.thumbnail ? (
                  <img src={form.thumbnail} alt={form.title || 'Preview'} />
                ) : (
                  <div className="nx-studio-preview-placeholder">
                    <Icon name="image" size={32} />
                    <span>Chưa có ảnh bìa</span>
                  </div>
                )}

                {priceNum === 0 && form.price !== '' ? (
                  <span className="nx-studio-preview-badge is-free">MIỄN PHÍ</span>
                ) : discountPct > 0 ? (
                  <span className="nx-studio-preview-badge is-sale">-{discountPct}%</span>
                ) : null}

                <span className="nx-studio-preview-cat">{selectedCategoryName}</span>
              </div>

              <div className="nx-studio-preview-body">
                <h4 className="nx-studio-preview-title">
                  {form.title.trim() || 'Tên khóa học sẽ hiển thị tại đây...'}
                </h4>

                <div className="nx-studio-preview-meta">
                  <span>
                    <Icon name="user" size={13} /> {form.instructorName.trim() || 'Giảng viên EduHub'}
                  </span>
                  <span className="nx-studio-preview-level">{levelLabel(form.level)}</span>
                </div>

                <div className="nx-studio-preview-price-row">
                  <div>
                    <div className="nx-studio-preview-price">
                      {priceNum === 0 && form.price !== '' ? 'Miễn phí' : formatPrice(priceNum)}
                    </div>
                    {origNum > priceNum && (
                      <div className="nx-studio-preview-orig">{formatPrice(origNum)}</div>
                    )}
                  </div>
                  <span className="nx-studio-preview-cta">
                    {isEdit ? `${lessonsCount} bài giảng` : 'Xem chi tiết'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </form>
    </div>
  );
}
