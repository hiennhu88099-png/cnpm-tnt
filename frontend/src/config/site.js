export const SITE = {
  name: 'EduHub',
  tagline: 'Nền tảng học trực tuyến',
  description: 'Học kỹ năng mới mỗi ngày với các khóa học được thiết kế bài bản, theo dõi tiến độ và đánh giá sau mỗi khóa.',
  supportEmail: import.meta.env?.VITE_SUPPORT_EMAIL || 'support@eduhub.vn',
  supportPhone: import.meta.env?.VITE_SUPPORT_PHONE || '1900 6868',
  supportHours: 'Hỗ trợ trực tuyến 08:00 – 22:00 (T2 – CN)',
};

export const MAIN_NAV = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/courses', label: 'Khóa học' },
  { to: '/my-courses', label: 'Khóa học của tôi', auth: true },
];

export const ACCOUNT_NAV = [
  { to: '/profile', label: 'Hồ sơ cá nhân', icon: 'user' },
  { to: '/my-courses', label: 'Khóa học của tôi', icon: 'graduation' },
  { to: '/orders', label: 'Lịch sử giao dịch', icon: 'wallet' },
  { to: '/change-password', label: 'Bảo mật & mật khẩu', icon: 'lock' },
];

export const ROLE_LABELS = {
  USER: 'Học viên',
  ADMIN: 'Quản trị viên',
};

export const COURSE_LEVEL_LABELS = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};
