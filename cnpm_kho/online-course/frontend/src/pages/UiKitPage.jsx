import { useState } from 'react';
import FormField from '../components/FormField';
import {
  Alert, Avatar, Badge, Button, Card, CourseCard, EmptyState, PageHeader, ProgressBar, Spinner, StarRating,
} from '../components/ui';
import { MOCK_COURSES } from '../data/mockData';

// Trang tham khảo cho cả nhóm: xem mọi component có sẵn và cách dùng.
// Truy cập: http://localhost:5173/ui-kit

const COLORS = [
  ['--color-primary', 'Màu chính'],
  ['--color-text', 'Chữ chính'],
  ['--color-text-muted', 'Chữ phụ'],
  ['--color-border', 'Viền'],
  ['--color-bg', 'Nền trang'],
  ['--color-success', 'Thành công'],
  ['--color-warning', 'Cảnh báo'],
  ['--color-danger', 'Lỗi'],
];

function Code({ children }) {
  return <code className="kit-code">{children}</code>;
}

export default function UiKitPage() {
  const [loading, setLoading] = useState(false);

  const fakeSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="container section">
      <PageHeader
        eyebrow="Dành cho nhóm phát triển"
        title="Bộ giao diện mẫu"
        subtitle="Các component dùng chung trong src/components/ui. Trang mới hãy dùng lại những thứ ở đây thay vì tự viết style."
      />

      <Card title="Màu sắc" subtitle="Khai báo trong src/styles/tokens.css — luôn dùng var(--...) thay vì mã màu." className="kit-section">
        <div className="kit-swatches">
          {COLORS.map(([token, label]) => (
            <div key={token} className="kit-swatch">
              <div className="kit-swatch-color" style={{ background: `var(${token})` }} />
              <div className="kit-swatch-label">
                <div>{label}</div>
                <code>{token}</code>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Button" className="kit-section">
        <div className="kit-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button loading={loading} onClick={fakeSubmit}>{loading ? 'Đang lưu...' : 'Bấm thử loading'}</Button>
        </div>
        <Code>{`<Button onClick={save} loading={submitting}>Lưu</Button>
<Button variant="secondary" to="/courses">Xem khóa học</Button>   // "to" => render <Link>`}</Code>
      </Card>

      <Card title="Form" className="kit-section">
        <div className="form-row">
          <FormField label="Tên khóa học" name="kit-title" placeholder="Ví dụ: Spring Boot cơ bản" required />
          <FormField label="Giá (VNĐ)" name="kit-price" type="number" placeholder="0 = miễn phí" hint="Nhập 0 nếu khóa học miễn phí." />
        </div>
        <div className="form-row">
          <FormField label="Danh mục" name="kit-category" as="select" defaultValue="">
            <option value="" disabled>Chọn danh mục</option>
            <option>Lập trình</option>
            <option>Thiết kế</option>
          </FormField>
          <FormField label="Trường bị lỗi" name="kit-error" defaultValue="abc" error="Giá trị không hợp lệ" />
        </div>
        <FormField label="Mô tả" name="kit-desc" as="textarea" placeholder="Giới thiệu ngắn về khóa học" />
        <Code>{`<FormField label="Tên khóa học" name="title" value={form.title} onChange={handleChange}
           error={error.fieldErrors.title} required />
<FormField as="textarea" ... />      <FormField as="select" ...><option>...</option></FormField>
<div className="form-row"> 2 field trên một hàng </div>`}</Code>
      </Card>

      <Card title="Thông báo, nhãn, trạng thái" className="kit-section">
        <Alert variant="success">Lưu khóa học thành công.</Alert>
        <Alert variant="error">Không kết nối được tới server.</Alert>
        <Alert variant="warning">Khóa học chưa có bài học nào.</Alert>
        <Alert variant="info">Bạn đã đăng ký khóa học này.</Alert>
        <div className="kit-row">
          <Badge variant="primary">Đã xuất bản</Badge>
          <Badge variant="success">Hoàn thành</Badge>
          <Badge variant="warning">Bản nháp</Badge>
          <Badge variant="danger">Đã khóa</Badge>
          <Badge>Mặc định</Badge>
          <StarRating value={4.6} count={128} />
          <Avatar name="Nguyễn Văn A" />
          <Spinner />
        </div>
        <div style={{ maxWidth: 360, marginTop: 'var(--space-5)' }}>
          <ProgressBar value={45} />
        </div>
        <Code>{`<Alert variant="error">{error.message}</Alert>      // không có nội dung => tự ẩn
<Badge variant="success">Hoàn thành</Badge>   <StarRating value={4.6} count={128} />
<ProgressBar value={45} />   <PageLoading />   <Spinner size="sm" />`}</Code>
      </Card>

      <Card title="Thẻ khóa học" subtitle="Dùng chung cho danh sách khóa học (TV2) và khóa học của tôi (TV3)." className="kit-section">
        <div className="course-grid">
          <CourseCard course={MOCK_COURSES[0]} />
          <CourseCard course={MOCK_COURSES[2]} />
          <CourseCard course={MOCK_COURSES[1]} footer={<ProgressBar value={72} />} />
        </div>
        <Code>{`<div className="course-grid">
  {courses.map((c) => <CourseCard key={c.id} course={c} to={\`/courses/\${c.id}\`} />)}
</div>
<CourseCard course={c} footer={<ProgressBar value={c.progress} />} />   // thay giá bằng tiến độ`}</Code>
      </Card>

      <Card title="Trạng thái rỗng" className="kit-section">
        <EmptyState
          icon="book"
          title="Bạn chưa đăng ký khóa học nào"
          description="Khám phá danh sách khóa học và bắt đầu học ngay hôm nay."
          action={<Button to="/">Khám phá khóa học</Button>}
        />
      </Card>
    </div>
  );
}
