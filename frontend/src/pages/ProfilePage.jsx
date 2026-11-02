import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { userApi } from '../api/authApi';
import { enrollmentApi } from '../api/enrollmentApi';
import { parseApiError } from '../api/apiError';
import FormField from '../components/FormField';
import { Alert, Avatar, Badge, Button, Card, EmptyState, ProgressBar } from '../components/ui';
import { ROLE_LABELS } from '../config/site';
import { formatDate } from '../utils/format';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const toForm = (user) => ({ fullName: user.fullName, phone: user.phone || '', avatar: user.avatar || '' });

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(() => toForm(user));
  const [error, setError] = useState({ message: '', fieldErrors: {} });
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [myCourses, setMyCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    enrollmentApi
      .getMyCourses()
      .then((data) => {
        if (active) {
          setMyCourses(Array.isArray(data) ? data : data?.content ?? []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCourses(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isDirty =
    form.fullName !== user.fullName ||
    form.phone !== (user.phone || '') ||
    form.avatar !== (user.avatar || '');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setError((prev) => ({
        ...prev,
        fieldErrors: { ...prev.fieldErrors, avatar: 'Kích thước ảnh không được vượt quá 5MB.' },
      }));
      return;
    }

    setUploading(true);
    setError((prev) => ({ ...prev, message: '', fieldErrors: { ...prev.fieldErrors, avatar: undefined } }));
    setSuccess('');
    try {
      const { url } = await userApi.uploadAvatar(file);
      setForm((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      const parsed = parseApiError(err);
      setError((prev) => ({
        ...prev,
        fieldErrors: {
          ...prev.fieldErrors,
          avatar: parsed.fieldErrors?.avatar || parsed.message || 'Không thể tải ảnh lên.',
        },
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({ ...prev, avatar: '' }));
    setError((prev) => ({ ...prev, fieldErrors: { ...prev.fieldErrors, avatar: undefined } }));
  };

  const handleReset = () => {
    setForm(toForm(user));
    setError({ message: '', fieldErrors: {} });
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError({ message: '', fieldErrors: {} });
    setSuccess('');
    try {
      const updated = await userApi.updateProfile(form);
      setUser(updated);
      setForm(toForm(updated));
      setSuccess('Cập nhật hồ sơ thành công.');
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = myCourses.filter(
    (c) => c.status === 'COMPLETED' || Number(c.progress ?? 0) >= 100,
  ).length;

  return (
    <div className="stack">
      <Card>
        <div className="profile-summary" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <Avatar src={form.avatar || user.avatar} name={user.fullName} size={80} />
            <div>
              <h2 className="profile-summary-name">{user.fullName}</h2>
              <div className="text-muted">{user.email}</div>
              <div className="profile-summary-meta">
                <Badge variant="primary">{ROLE_LABELS[user.role] || user.role}</Badge>
                <Badge variant="success">Đang hoạt động</Badge>
                <span>Tham gia từ {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {myCourses.length}
              </div>
              <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                Đã đăng ký
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                {completedCount}
              </div>
              <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                Đã hoàn thành
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Thông tin cá nhân" subtitle="Thông tin này hiển thị cho giảng viên và học viên khác.">
        <Alert variant="success">{success}</Alert>
        {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Họ và tên"
            name="fullName"
            placeholder="Họ và tên của bạn"
            value={form.fullName}
            onChange={handleChange}
            error={error.fieldErrors.fullName}
            required
          />
          <div className="form-row">
            <FormField label="Email" name="email" value={user.email} disabled hint="Email đăng nhập không thể thay đổi." />
            <FormField
              label="Số điện thoại"
              name="phone"
              type="tel"
              placeholder="0987654321"
              value={form.phone}
              onChange={handleChange}
              error={error.fieldErrors.phone}
            />
          </div>

          <div className="field">
            <label className="field-label">Ảnh đại diện</label>
            <div className="avatar-upload-box">
              <Avatar src={form.avatar} name={form.fullName || user.fullName} size={64} />
              <div className="avatar-upload-body">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  hidden
                />
                <div className="avatar-upload-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
                  </Button>
                  {form.avatar && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={uploading}>
                      Xóa ảnh
                    </Button>
                  )}
                </div>
                {error.fieldErrors.avatar ? (
                  <span className="field-error" role="alert">
                    {error.fieldErrors.avatar}
                  </span>
                ) : (
                  <span className="field-hint">
                    Hỗ trợ JPG, PNG, WEBP hoặc GIF (tối đa 5MB). Để trống sẽ dùng chữ cái đầu của tên.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
            <Button type="submit" loading={submitting} disabled={uploading || !isDirty}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            {isDirty && (
              <Button type="button" variant="ghost" onClick={handleReset} disabled={submitting || uploading}>
                Khôi phục
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card
        title="Khóa học đã đăng ký"
        subtitle="Danh sách các khóa học bạn đang theo học và đã hoàn thành."
        actions={
          <Button variant="secondary" size="sm" to="/my-courses">
            Xem tất cả
          </Button>
        }
      >
        {loadingCourses ? (
          <p className="text-muted">Đang tải khóa học của bạn...</p>
        ) : myCourses.length === 0 ? (
          <EmptyState
            icon="book"
            title="Chưa đăng ký khóa học nào"
            description="Khám phá các khóa học phù hợp để bắt đầu học ngay hôm nay."
            action={<Button to="/courses">Khám phá khóa học</Button>}
          />
        ) : (
          <div className="stack" style={{ gap: '12px' }}>
            {myCourses.map((course) => {
              const pct = Math.round(Number(course.progress ?? 0));
              const isDone = course.status === 'COMPLETED' || pct >= 100;
              return (
                <div
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '14px 16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong>{course.title || `Khóa học #${course.courseId}`}</strong>
                      <Badge variant={isDone ? 'success' : 'primary'}>
                        {isDone ? 'Đã hoàn thành' : 'Đang học'}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <div style={{ flex: 1, maxWidth: '240px' }}>
                        <ProgressBar value={pct} />
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{pct}%</span>
                    </div>
                  </div>
                  <Button size="sm" to={`/learning/${course.courseId}`}>
                    {pct > 0 ? 'Tiếp tục học' : 'Vào học'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
