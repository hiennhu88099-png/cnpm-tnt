import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { parseApiError } from '../api/apiError';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';
import { Alert, Button } from '../components/ui';
import { SITE } from '../config/site';

const EMPTY_FORM = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState({ message: '', fieldErrors: {} });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError({ message: '', fieldErrors: { confirmPassword: 'Mật khẩu xác nhận không khớp' } });
      return;
    }

    setSubmitting(true);
    setError({ message: '', fieldErrors: {} });
    try {
      const { confirmPassword: _, ...payload } = form;
      await authApi.register(payload);
      navigate('/login', { state: { email: form.email, notice: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.' } });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Tạo tài khoản mới"
      subtitle="Miễn phí và chỉ mất chưa tới một phút."
      footer={<>Đã có tài khoản? <Link to="/login" className="text-link">Đăng nhập</Link></>}
    >
      {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Họ và tên"
          name="fullName"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          value={form.fullName}
          onChange={handleChange}
          error={error.fieldErrors.fullName}
          required
        />
        <div className="form-row">
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ban@example.com"
            value={form.email}
            onChange={handleChange}
            error={error.fieldErrors.email}
            required
          />
          <FormField
            label="Số điện thoại"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0987654321"
            value={form.phone}
            onChange={handleChange}
            error={error.fieldErrors.phone}
          />
        </div>
        <div className="form-row">
          <FormField
            label="Mật khẩu"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
            value={form.password}
            onChange={handleChange}
            error={error.fieldErrors.password}
            required
          />
          <FormField
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            value={form.confirmPassword}
            onChange={handleChange}
            error={error.fieldErrors.confirmPassword}
            required
          />
        </div>

        <p className="auth-terms">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của {SITE.name}.
        </p>

        <Button type="submit" size="lg" block loading={submitting}>
          {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>
      </form>
    </AuthCard>
  );
}
