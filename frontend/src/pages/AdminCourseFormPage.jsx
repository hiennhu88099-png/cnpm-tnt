import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import useApiQuery from '../hooks/useApiQuery';
import FormField from '../components/FormField';
import { Alert, Button, Card, EmptyState, Icon, PageHeader, PageLoading } from '../components/ui';
import { COURSE_LEVELS, COURSE_STATUSES } from '../config/course';

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

// Một trang dùng cho cả tạo mới (/admin/courses/new) và chỉnh sửa (/admin/courses/:id/edit)
export default function AdminCourseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [formSource, setFormSource] = useState(null);
  const [error, setError] = useState(NO_ERROR);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(
    () =>
      Promise.all([courseApi.getAdminCategories(), isEdit ? courseApi.getAdminCourseById(id) : null]).then(
        ([categories, course]) => ({ categories, course }),
      ),
    [id, isEdit],
  );
  const { data, error: loadError, loading } = useApiQuery(fetchData);

  // Có dữ liệu mới (mở trang / đổi khóa học) thì đổ vào form một lần
  if (data && !loading && formSource !== data) {
    setFormSource(data);
    setForm(data.course ? toForm(data.course) : EMPTY_FORM);
    setError(NO_ERROR);
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
        // Tạo xong chuyển thẳng sang trang bài học để thêm nội dung
        navigate(`/admin/lessons?courseId=${created.id}`, {
          state: { notice: `Đã tạo khóa học “${payload.title}”. Hãy thêm bài học đầu tiên.` },
        });
      }
    } catch (err) {
      setError(parseApiError(err));
      setSubmitting(false);
    }
  };

  if (loading || (data && formSource !== data)) return <PageLoading text="Đang tải..." />;

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

  // Danh mục đang dùng của khóa học có thể đã bị ngừng: vẫn hiện để không mất giá trị khi sửa
  const activeCategories = data.categories.filter(
    (category) => category.status === 'ACTIVE' || String(category.id) === form.categoryId,
  );

  return (
    <div className="stack">
      <div>
        <Link to="/admin/courses" className="back-link">
          <Icon name="arrowRight" size={16} />
          Danh sách khóa học
        </Link>
        <PageHeader
          eyebrow="Quản trị"
          title={isEdit ? 'Sửa khóa học' : 'Thêm khóa học'}
          subtitle={
            isEdit
              ? 'Thay đổi sẽ hiển thị ngay với học viên nếu khóa học đã xuất bản.'
              : 'Khóa học mới nên để ở trạng thái Bản nháp cho tới khi có đủ bài học.'
          }
        />
      </div>

      <Card>
        {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

        {activeCategories.length === 0 && (
          <Alert variant="warning">
            Chưa có danh mục nào đang hoạt động. <Link to="/admin/categories" className="text-link">Tạo danh mục</Link>{' '}
            trước khi thêm khóa học.
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Tên khóa học"
            name="title"
            placeholder="Ví dụ: Lập trình React từ cơ bản đến nâng cao"
            value={form.title}
            onChange={handleChange}
            error={error.fieldErrors.title}
            maxLength={200}
            required
          />

          <div className="form-row">
            <FormField
              label="Danh mục"
              name="categoryId"
              as="select"
              value={form.categoryId}
              onChange={handleChange}
              error={error.fieldErrors.categoryId}
              required
            >
              <option value="">Chọn danh mục</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </FormField>
            <FormField
              label="Trình độ"
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
              label="Giá (VND)"
              name="price"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              placeholder="399000"
              value={form.price}
              onChange={handleChange}
              error={error.fieldErrors.price}
              hint="Nhập 0 nếu khóa học miễn phí."
              required
            />
            <FormField
              label="Giá gốc (VND)"
              name="originalPrice"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              placeholder="599000"
              value={form.originalPrice}
              onChange={handleChange}
              error={error.fieldErrors.originalPrice}
              hint="Không bắt buộc. Hiển thị gạch ngang khi lớn hơn giá bán."
            />
          </div>

          <div className="form-row">
            <FormField
              label="Giảng viên"
              name="instructorName"
              placeholder="Nguyễn Văn A"
              value={form.instructorName}
              onChange={handleChange}
              error={error.fieldErrors.instructorName}
              maxLength={150}
            />
            <FormField
              label="Thời lượng (phút)"
              name="duration"
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="600"
              value={form.duration}
              onChange={handleChange}
              error={error.fieldErrors.duration}
            />
          </div>

          <FormField
            label="Trạng thái"
            name="status"
            as="select"
            value={form.status}
            onChange={handleChange}
            error={error.fieldErrors.status}
            hint="Chỉ khóa học Đã xuất bản mới hiện ở trang công khai."
          >
            {COURSE_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </FormField>

          <FormField
            label="Ảnh bìa (URL)"
            name="thumbnail"
            type="url"
            placeholder="https://example.com/thumbnail.jpg"
            value={form.thumbnail}
            onChange={handleChange}
            error={error.fieldErrors.thumbnail}
            maxLength={500}
          />

          <FormField
            label="Mô tả"
            name="description"
            as="textarea"
            rows={6}
            placeholder="Khóa học này dành cho ai, học xong sẽ làm được gì..."
            value={form.description}
            onChange={handleChange}
            error={error.fieldErrors.description}
          />

          <div className="form-actions">
            <Button variant="ghost" to="/admin/courses">Hủy</Button>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo khóa học'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
