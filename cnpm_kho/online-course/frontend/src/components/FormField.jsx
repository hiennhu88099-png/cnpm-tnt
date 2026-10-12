/**
 * Ô nhập liệu có label + thông báo lỗi.
 *   as:    'input' (mặc định) | 'textarea' | 'select' (truyền <option> qua children)
 *   error: thông báo lỗi của field, thường lấy từ parseApiError(err).fieldErrors[name]
 *   hint:  dòng gợi ý nhỏ bên dưới (ẩn khi đang có lỗi)
 */
export default function FormField({ label, name, error, hint, as: Control = 'input', required, children, ...inputProps }) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;

  return (
    <div className="field">
      {label && (
        <label htmlFor={name} className="field-label">
          {label}
          {required && <span className="field-required" aria-hidden="true">*</span>}
        </label>
      )}
      <Control
        id={name}
        name={name}
        className="input"
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...inputProps}
      >
        {children}
      </Control>
      {error ? (
        <p id={`${name}-error`} className="field-error">{error}</p>
      ) : (
        hint && <p id={`${name}-hint`} className="field-hint">{hint}</p>
      )}
    </div>
  );
}
