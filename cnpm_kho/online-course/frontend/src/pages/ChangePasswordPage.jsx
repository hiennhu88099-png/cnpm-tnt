import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { userApi } from '../api/authApi';
import { parseApiError } from '../api/apiError';
import FormField from '../components/FormField';
import { Alert, Button, Card } from '../components/ui';

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState({ message: '', fieldErrors: {} });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError({ message: '', fieldErrors: {} });
    try {
      await userApi.changePassword(form);
      const email = user.email;
      logout();
      navigate('/login', { replace: true, state: { email, notice: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.' } });
    } catch (err) {
      setError(parseApiError(err));
      setSubmitting(false);
    }
  };

  return (
    <Card title="Đổi mật khẩu" subtitle="Sau khi đổi, mọi phiên đăng nhập cũ trên các thiết bị khác sẽ bị đăng xuất.">
      {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Mật khẩu hiện tại"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={handleChange}
          error={error.fieldErrors.currentPassword}
          required
        />
        <div className="form-row">
          <FormField
            label="Mật khẩu mới"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
            value={form.newPassword}
            onChange={handleChange}
            error={error.fieldErrors.newPassword}
            required
          />
          <FormField
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            value={form.confirmPassword}
            onChange={handleChange}
            error={error.fieldErrors.confirmPassword}
            required
          />
        </div>

        <div className="form-actions">
          <Button type="submit" loading={submitting}>
            {submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
