// Nhãn tiếng Việt cho các giá trị enum của Category / Course / Lesson (TV2).
// Badge variant: primary | success | warning | danger | neutral
import { COURSE_LEVEL_LABELS } from './site';

// Nhãn cấp độ dùng chung với CourseCard (định nghĩa trong config/site.js)
export const COURSE_LEVELS = Object.entries(COURSE_LEVEL_LABELS).map(([value, label]) => ({ value, label }));

export const COURSE_STATUSES = [
  { value: 'DRAFT', label: 'Bản nháp', variant: 'warning' },
  { value: 'PUBLISHED', label: 'Đã xuất bản', variant: 'success' },
  { value: 'INACTIVE', label: 'Đã ẩn', variant: 'neutral' },
];

export const CATEGORY_STATUSES = [
  { value: 'ACTIVE', label: 'Đang hoạt động', variant: 'success' },
  { value: 'INACTIVE', label: 'Ngừng sử dụng', variant: 'neutral' },
];

export const LESSON_STATUSES = [
  { value: 'ACTIVE', label: 'Hiển thị', variant: 'success' },
  { value: 'INACTIVE', label: 'Đã ẩn', variant: 'neutral' },
];

// Các kiểu sắp xếp mà backend cho phép (createdAt | price | title)
export const COURSE_SORTS = [
  { value: 'createdAt,desc', label: 'Mới nhất' },
  { value: 'price,asc', label: 'Giá thấp đến cao' },
  { value: 'price,desc', label: 'Giá cao đến thấp' },
  { value: 'title,asc', label: 'Tên A-Z' },
];

const findOption = (options, value) => options.find((option) => option.value === value);

export const levelLabel = (value) => COURSE_LEVEL_LABELS[value] ?? value;
export const statusOption = (options, value) => findOption(options, value) ?? { label: value, variant: 'neutral' };

// 95 -> "1 giờ 35 phút", 40 -> "40 phút"
export function formatDuration(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} phút`;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}
