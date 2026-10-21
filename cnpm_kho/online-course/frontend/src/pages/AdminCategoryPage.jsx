import { useState } from 'react';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import useApiQuery from '../hooks/useApiQuery';
import FormField from '../components/FormField';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, PageLoading } from '../components/ui';
import { CATEGORY_STATUSES, statusOption } from '../config/course';
import { formatDate } from '../utils/format';

const EMPTY_FORM = { name: '', description: '', image: '', status: 'ACTIVE' };
const NO_ERROR = { message: '', fieldErrors: {} };

const toForm = (category) => ({
  name: category.name,
  description: category.description || '',
  image: category.image || '',
  status: category.status,
});

// Chuỗi rỗng -> null để backend không phải validate URL rỗng
const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  image: form.image.trim() || null,
  status: form.status,
});

export default function AdminCategoryPage() {
  // courseApi.getAdminCategories là hàm cố định của module nên chỉ gọi lại khi reload()
  const { data, error: loadError, loading, reload } = useApiQuery(courseApi.getAdminCategories);
  const categories = data ?? [];

  const [editing, setEditing] = useState(null); // null = đang tạo mới
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(NO_ERROR);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: 'success', text: '' });
  const [busyId, setBusyId] = useState(null);

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(NO_ERROR);
  };

  const startEdit = (category) => {
    setEditing(category);
    setForm(toForm(category));
    setError(NO_ERROR);
    setNotice({ type: 'success', text: '' });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(NO_ERROR);
    setNotice({ type: 'success', text: '' });
    try {
      if (editing) {
        await courseApi.updateCategory(editing.id, toPayload(form));
        setNotice({ type: 'success', text: `Đã cập nhật danh mục “${form.name.trim()}”.` });
      } else {
        await courseApi.createCategory(toPayload(form));
        setNotice({ type: 'success', text: `Đã thêm danh mục “${form.name.trim()}”.` });
      }
      resetForm();
      reload();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const runRowAction = async (category, action, doneText) => {
    setBusyId(category.id);
    setNotice({ type: 'success', text: '' });
    try {
      await action();
      setNotice({ type: 'success', text: `${doneText} danh mục “${category.name}”.` });
      if (editing?.id === category.id) resetForm();
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: parseApiError(err).message });
    } finally {
      setBusyId(null);
    }
  };

  // Xóa mềm: danh mục chuyển sang INACTIVE, khóa học bên trong sẽ không còn hiện ở trang công khai
  const handleDeactivate = async (category) => {
    const ok = window.confirm(
      `Ngừng sử dụng danh mục “${category.name}”?\nCác khóa học thuộc danh mục này sẽ bị ẩn khỏi trang công khai.`,
    );
    if (!ok) return;
    await runRowAction(category, () => courseApi.deleteCategory(category.id), 'Đã ngừng sử dụng');
  };

  const handleReactivate = (category) =>
    runRowAction(
      category,
      () => courseApi.updateCategory(category.id, { ...toPayload(toForm(category)), status: 'ACTIVE' }),
      'Đã kích hoạt lại',
    );

  if (loading && !data) return <PageLoading text="Đang tải danh mục..." />;

  return (
    <div className="stack">
      <PageHeader eyebrow="Quản trị" title="Danh mục" subtitle="Nhóm các khóa học theo chủ đề để học viên dễ tìm kiếm." />

      <Alert variant={notice.type}>{notice.text}</Alert>

      <div className="admin-grid">
        <Card
          className="admin-form-card"
          title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
          subtitle={editing ? `Đang sửa: ${editing.name}` : 'Tên danh mục không được trùng nhau.'}
        >
          {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Tên danh mục"
              name="name"
              placeholder="Ví dụ: Lập trình Web"
              value={form.name}
              onChange={handleChange}
              error={error.fieldErrors.name}
              maxLength={150}
              required
            />
            <FormField
              label="Mô tả"
              name="description"
              as="textarea"
              rows={3}
              placeholder="Giới thiệu ngắn về chủ đề này"
              value={form.description}
              onChange={handleChange}
              error={error.fieldErrors.description}
            />
            <FormField
              label="Ảnh (URL)"
              name="image"
              type="url"
              placeholder="https://example.com/category.jpg"
              value={form.image}
              onChange={handleChange}
              error={error.fieldErrors.image}
            />
            <FormField
              label="Trạng thái"
              name="status"
              as="select"
              value={form.status}
              onChange={handleChange}
              error={error.fieldErrors.status}
            >
              {CATEGORY_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </FormField>

            <div className="form-actions">
              {editing && (
                <Button variant="ghost" onClick={resetForm} disabled={submitting}>Hủy</Button>
              )}
              <Button type="submit" loading={submitting}>
                {submitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Tất cả danh mục" subtitle={`${categories.length} danh mục`}>
          {loadError ? (
            <Alert variant="error">
              {loadError.message}{' '}
              <button type="button" className="text-link" onClick={reload}>Thử lại</button>
            </Alert>
          ) : categories.length === 0 ? (
            <EmptyState
              icon="layers"
              title="Chưa có danh mục nào"
              description="Tạo danh mục đầu tiên ở khung bên cạnh, sau đó thêm khóa học vào danh mục."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Tên danh mục</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Ngày tạo</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const status = statusOption(CATEGORY_STATUSES, category.status);
                    const busy = busyId === category.id;
                    return (
                      <tr key={category.id} className={editing?.id === category.id ? 'is-selected' : undefined}>
                        <td className="text-muted">#{category.id}</td>
                        <td>
                          <div className="cell-title">{category.name}</div>
                          {category.description && (
                            <div className="cell-sub cell-truncate">{category.description}</div>
                          )}
                        </td>
                        <td><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td>{formatDate(category.createdAt)}</td>
                        <td>
                          <div className="row-actions">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(category)} disabled={busy}>
                              Sửa
                            </Button>
                            {category.status === 'ACTIVE' ? (
                              <Button variant="ghost" size="sm" onClick={() => handleDeactivate(category)} loading={busy}>
                                Ngừng dùng
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleReactivate(category)} loading={busy}>
                                Kích hoạt lại
                              </Button>
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
        </Card>
      </div>
    </div>
  );
}
