import { Button, EmptyState } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="container section">
      <EmptyState
        icon="warning"
        title="Không tìm thấy trang"
        description="Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi."
        action={<Button to="/">Về trang chủ</Button>}
      />
    </div>
  );
}
