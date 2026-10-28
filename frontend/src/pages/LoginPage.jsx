import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { parseApiError } from '../api/apiError';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';
import { Alert, Button, Icon } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState({ message: '', fieldErrors: {} });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError({ message: '', fieldErrors: {} });
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      variant="login"
      title="Chào Mừng Trở Lại"
      subtitle="Vui lòng nhập thông tin để đăng nhập."
      footer={
        <p className="auth-switch-text">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-switch-link">
            Đăng Ký Ngay
          </Link>
        </p>
      }
    >
      <Alert variant="success">{location.state?.notice}</Alert>
      {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <FormField
          label="Địa Chỉ Email"
          name="email"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="ban@example.com"
          value={form.email}
          onChange={handleChange}
          error={error.fieldErrors.email}
          autoFocus={!location.state?.email}
          required
        />
        <FormField
          label="Mật Khẩu"
          name="password"
          type="password"
          icon="lock"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          value={form.password}
          onChange={handleChange}
          error={error.fieldErrors.password}
          autoFocus={Boolean(location.state?.email)}
          required
        />

        <Button type="submit" size="lg" block loading={submitting} className="auth-submit-btn">
          <span>{submitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}</span>
          {!submitting && <Icon name="arrowRight" size={16} />}
        </Button>
      </form>
    </AuthCard>
  );
}
