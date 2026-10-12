import Icon from './Icon';

// Dùng khi danh sách rỗng / không tìm thấy dữ liệu
export default function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
