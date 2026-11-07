import { useState } from 'react';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import useApiQuery from '../hooks/useApiQuery';
import FormField from '../components/FormField';
import { Alert, Badge, Button, Card, EmptyState, Icon, PageHeader, PageLoading } from '../components/ui';
import { CATEGORY_STATUSES, statusOption } from '../config/course';
import { formatDate, formatNumber } from '../utils/format';

const EMPTY_FORM = { name: '', description: '', image: '', status: 'ACTIVE' };
const NO_ERROR = { message: '', fieldErrors: {} };

const toForm = (category) => ({
  name: category.name,
  description: category.description || '',
  image: category.image || '',
  status: category.status,
});

const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  image: form.image.trim() || null,
  status: form.status,
});

export default function AdminCategoryPage() {
  const { data, error: loadError, loading, reload } = useApiQuery(courseApi.getAdminCategories);
  const categories = data ?? [];

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  const activeCount = categories.filter((c) => c.status === 'ACTIVE').length;
  const inactiveCount = categories.length - activeCount;
  const filteredCategories =
    statusFilter === 'ALL'
      ? categories
      : categories.filter((c) => c.status === statusFilter);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị cấu trúc đào tạo"
        title="Danh mục Khóa học"
        subtitle="Phân nhóm các khóa học theo lĩnh vực chuyên môn để hiển thị trên thanh điều hướng và bộ lọc."
      />

      <Alert variant={notice.type}>{notice.text}</Alert>

      <div className="nx-dash-breakdown-grid">
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Tổng danh mục đào tạo</div>
          <div className="nx-dash-stat-value">{formatNumber(categories.length)}</div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang hoạt động công khai</div>
          <div className="nx-dash-stat-value" style={{ color: '#059669' }}>
            {formatNumber(activeCount)}
          </div>
        </div>
        <div className="nx-dash-panel">
          <div className="nx-dash-stat-label">Đang ngừng sử dụng</div>
          <div className="nx-dash-stat-value" style={{ color: '#d97706' }}>
            {formatNumber(inactiveCount)}
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <Card
          className="admin-form-card"
          title={editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          subtitle={editing ? `Đang chỉnh sửa: ${editing.name}` : 'Tên danh mục hiển thị trực tiếp ở trang chủ & bộ lọc.'}
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
              label="Mô tả lĩnh vực"
              name="description"
              as="textarea"
              rows={3}
              placeholder="Giới thiệu ngắn về chủ đề đào tạo này"
              value={form.description}
              onChange={handleChange}
              error={error.fieldErrors.description}
            />
            <FormField
              label="Ảnh đại diện (URL)"
              name="image"
              type="url"
              placeholder="https://images.unsplash.com/..."
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
                <Button variant="ghost" onClick={resetForm} disabled={submitting}>Hủy sửa</Button>
              )}
              <Button type="submit" loading={submitting}>
                <Icon name="check" size={15} />
                <span>{submitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm danh mục'}</span>
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Tất cả danh mục" subtitle={`${filteredCategories.length} / ${categories.length} danh mục`}>
          <div className="nx-filter-pills" role="tablist" aria-label="Lọc danh mục">
            {[
              { value: 'ALL', label: `Tất cả (${categories.length})` },
              { value: 'ACTIVE', label: `Đang hoạt động (${activeCount})` },
              { value: 'INACTIVE', label: `Ngừng dùng (${inactiveCount})` },
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

          {loadError ? (
            <Alert variant="error">
              {loadError.message}{' '}
              <button type="button" className="text-link" onClick={reload}>Thử lại</button>
            </Alert>
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              icon="layers"
              title="Chưa có danh mục phù hợp"
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
                    <th scope="col" className="nx-th-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => {
                    const status = statusOption(CATEGORY_STATUSES, category.status);
                    const busy = busyId === category.id;
                    return (
                      <tr key={category.id} className={editing?.id === category.id ? 'is-selected' : undefined}>
                        <td className="nx-dash-code">#{category.id}</td>
                        <td>
                          <div className="nx-course-cell">
                            <div className="nx-course-thumb">
                              {category.image ? (
                                <img src={category.image} alt="" loading="lazy" />
                              ) : (
                                <Icon name="layers" size={18} />
                              )}
                            </div>
                            <div className="nx-course-meta">
                              <div className="cell-title">{category.name}</div>
                              {category.description && (
                                <div className="cell-sub cell-truncate">{category.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td>{formatDate(category.createdAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              disabled={busy}
                              className="nx-action-btn is-edit"
                            >
                              <Icon name="pen" size={14} />
                              <span>Sửa</span>
                            </button>
                            {category.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(category)}
                                disabled={busy}
                                className="nx-action-btn is-warning"
                              >
                                <Icon name="eyeOff" size={14} />
                                <span>{busy ? '...' : 'Ngừng dùng'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReactivate(category)}
                                disabled={busy}
                                className="nx-action-btn is-success"
                              >
                                <Icon name="checkCircle" size={14} />
                                <span>{busy ? '...' : 'Kích hoạt'}</span>
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
        </Card>
      </div>
    </div>
  );
}
