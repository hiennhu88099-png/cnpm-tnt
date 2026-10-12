import Icon from './Icon';

const ICONS = { success: 'checkCircle', error: 'xCircle', warning: 'warning', info: 'info' };

// variant: success | error | warning | info. Không có nội dung thì không render gì.
export default function Alert({ variant = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon name={ICONS[variant]} size={18} />
      <div>{children}</div>
    </div>
  );
}
