// DỮ LIỆU MẪU cho trang chủ khi backend chưa có API khóa học.
// TV2: khi có GET /api/categories và GET /api/courses, thay bằng courseApi.getCategories() / courseApi.getAllCourses()
// và xóa file này. Tên field ở đây chính là gợi ý cho CourseResponse / CategoryResponse.

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Lập trình', icon: 'code', courseCount: 24 },
  { id: 2, name: 'Trí tuệ nhân tạo', icon: 'cpu', courseCount: 12 },
  { id: 3, name: 'Khoa học dữ liệu', icon: 'chart', courseCount: 9 },
  { id: 4, name: 'Thiết kế UI/UX', icon: 'pen', courseCount: 15 },
  { id: 5, name: 'Kinh doanh', icon: 'briefcase', courseCount: 11 },
  { id: 6, name: 'Ngoại ngữ', icon: 'globe', courseCount: 18 },
];

export const MOCK_COURSES = [
  {
    id: 1,
    title: 'Spring Boot từ cơ bản đến xây dựng REST API hoàn chỉnh',
    instructorName: 'Nguyễn Minh Khoa',
    categoryName: 'Lập trình',
    thumbnail: null,
    price: 499000,
    originalPrice: 899000,
    averageRating: 4.8,
    reviewCount: 312,
    lessonCount: 48,
    level: 'Cơ bản',
  },
  {
    id: 2,
    title: 'React 19 thực chiến: xây dựng ứng dụng web hiện đại',
    instructorName: 'Trần Thu Hà',
    categoryName: 'Lập trình',
    thumbnail: null,
    price: 399000,
    originalPrice: 699000,
    averageRating: 4.7,
    reviewCount: 198,
    lessonCount: 36,
    level: 'Trung cấp',
  },
  {
    id: 3,
    title: 'Nhập môn Machine Learning với Python',
    instructorName: 'Lê Quang Huy',
    categoryName: 'Trí tuệ nhân tạo',
    thumbnail: null,
    price: 0,
    originalPrice: null,
    averageRating: 4.5,
    reviewCount: 87,
    lessonCount: 22,
    level: 'Cơ bản',
  },
  {
    id: 4,
    title: 'Thiết kế giao diện với Figma cho người mới bắt đầu',
    instructorName: 'Phạm Ngọc Anh',
    categoryName: 'Thiết kế UI/UX',
    thumbnail: null,
    price: 299000,
    originalPrice: 499000,
    averageRating: 4.9,
    reviewCount: 145,
    lessonCount: 28,
    level: 'Cơ bản',
  },
];
