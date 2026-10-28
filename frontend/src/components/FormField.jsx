import { useState } from 'react';
import { Icon } from './ui';

/**
 * Ô nhập liệu có label + thông báo lỗi.
 *   as:    'input' (mặc định) | 'textarea' | 'select' (truyền <option> qua children)
 *   icon:  tên icon hiển thị bên trái ô input (tùy chọn)
 *   error: thông báo lỗi của field, thường lấy từ parseApiError(err).fieldErrors[name]
 *   hint:  dòng gợi ý nhỏ bên dưới (ẩn khi đang có lỗi)
 */
export default function FormField({ label, name, icon, error, hint, as: Control = 'input', type, required, children, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = Control === 'input' && type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  const hasWrap = isPassword || Boolean(icon);

  const inputClassName = [
    'input',
    icon ? 'has-leading-icon' : '',
    isPassword ? 'has-trailing-toggle' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const controlEl = (
    <Control
      id={name}
      name={name}
      type={resolvedType}
      className={inputClassName}
      required={required}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      {...inputProps}
    >
      {children}
    </Control>
  );

  return (
    <div className="field">
      {label && (
        <label htmlFor={name} className="field-label">
          {label}
          {required && <span className="field-required" aria-hidden="true">*</span>}
        </label>
      )}
      {hasWrap ? (
        <div className="input-password-wrap">
          {icon && (
            <span className="input-leading-icon" aria-hidden="true">
              <Icon name={icon} size={16} />
            </span>
          )}
          {controlEl}
          {isPassword && (
            <button
              type="button"
              className="input-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
            </button>
          )}
        </div>
      ) : (
        controlEl
      )}
      {error ? (
        <p id={`${name}-error`} className="field-error">{error}</p>
      ) : (
        hint && <p id={`${name}-hint`} className="field-hint">{hint}</p>
      )}
    </div>
  );
}
