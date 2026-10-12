import { Link } from 'react-router-dom';
import Spinner from './Spinner';

/**
 * Nút bấm chuẩn của dự án.
 *   variant: primary | secondary | ghost | danger | white
 *   size:    sm | md | lg
 *   to:      truyền vào thì render thành <Link> (điều hướng nội bộ)
 *   loading: hiện spinner + khóa nút khi đang gọi API
 */
export default function Button({ variant = 'primary', size = 'md', block, to, loading, className = '', children, ...props }) {
  const classes = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return <Link to={to} className={classes} {...props}>{children}</Link>;
  }

  return (
    <button type="button" className={classes} {...props} disabled={loading || props.disabled}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
