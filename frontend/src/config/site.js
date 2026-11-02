// Cấu hình chung của giao diện: đổi tên thương hiệu, menu ở một chỗ duy nhất.

export const SITE = {
  name: 'EduHub',
  tagline: 'Nền tảng học trực tuyến',
  description: 'Học kỹ năng mới mỗi ngày với các khóa học được thiết kế bài bản, theo dõi tiến độ và đánh giá sau mỗi khóa.',
};

// Menu chính trên header.
export const MAIN_NAV = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/courses', label: 'Khóa học' },
  { to: '/my-courses', label: 'Khóa học của tôi', auth: true },
];

// Menu bên trái trang "Tài khoản" (AccountLayout)
export const ACCOUNT_NAV = [
  { to: '/profile', label: 'Hồ sơ cá nhân', icon: 'user' },
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
