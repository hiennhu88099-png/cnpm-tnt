import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { userApi } from '../api/authApi';
import { parseApiError } from '../api/apiError';
import FormField from '../components/FormField';
import { Alert, Avatar, Badge, Button, Card } from '../components/ui';
import { ROLE_LABELS } from '../config/site';
import { formatDate } from '../utils/format';

const toForm = (user) => ({ fullName: user.fullName, phone: user.phone || '', avatar: user.avatar || '' });

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(() => toForm(user));
  const [error, setError] = useState({ message: '', fieldErrors: {} });
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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

  return (
    <div className="stack">
      <Card>
        <div className="profile-summary">
          <Avatar src={user.avatar} name={user.fullName} size={80} />
          <div>
            <h2 className="profile-summary-name">{user.fullName}</h2>
            <div className="text-muted">{user.email}</div>
            <div className="profile-summary-meta">
              <Badge variant="primary">{ROLE_LABELS[user.role] || user.role}</Badge>
              <span>Tham gia từ {formatDate(user.createdAt)}</span>
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
          <FormField
            label="Ảnh đại diện (URL)"
            name="avatar"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={form.avatar}
            onChange={handleChange}
            error={error.fieldErrors.avatar}
            hint="Dán đường dẫn ảnh công khai; để trống sẽ dùng chữ cái đầu của tên."
          />

          <div className="form-actions">
            <Button type="submit" loading={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
