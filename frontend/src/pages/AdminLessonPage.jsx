import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import useApiQuery from '../hooks/useApiQuery';
import FormField from '../components/FormField';
import { Alert, Badge, Button, Card, EmptyState, Icon, PageHeader, PageLoading } from '../components/ui';
import { COURSE_STATUSES, LESSON_STATUSES, formatDuration, levelLabel, statusOption } from '../config/course';
import { formatNumber, formatPrice } from '../utils/format';

const NO_ERROR = { message: '', fieldErrors: {} };

const SAMPLE_VIDEOS = [
  { label: 'Video mẫu MP4 HD #1', url: 'https://vjs.zencdn.net/v/oceans.mp4', duration: 18 },
  { label: 'Video mẫu MP4 HD #2', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: 25 },
  { label: 'Video mẫu MP4 HD #3', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: 20 },
];

const emptyForm = (nextOrder) => ({
  title: '',
  description: '',
  videoUrl: '',
  duration: '',
  lessonOrder: String(nextOrder),
  status: 'ACTIVE',
});

const toForm = (lesson) => ({
  title: lesson.title,
  description: lesson.description || '',
  videoUrl: lesson.videoUrl || '',
  duration: lesson.duration ?? '',
  lessonOrder: String(lesson.lessonOrder),
  status: lesson.status,
});

const toNumber = (value) => (value === '' || value == null ? null : Number(value));

const toPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim() || null,
  videoUrl: form.videoUrl.trim() || null,
  duration: toNumber(form.duration),
  lessonOrder: toNumber(form.lessonOrder),
  status: form.status,
});

const nextOrderOf = (lessons) => lessons.reduce((max, lesson) => Math.max(max, lesson.lessonOrder), 0) + 1;
const PICKER_SIZE = 50;

export default function AdminLessonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') ?? '';

  const fetchCourses = useCallback(() => courseApi.getAdminCourses({ size: PICKER_SIZE, sort: 'title,asc' }), []);
  const coursesQuery = useApiQuery(fetchCourses);
  const courses = coursesQuery.data?.content ?? [];
  const selectedMissing = courseId && !courses.some((course) => String(course.id) === courseId);

  const handleSelect = (e) => setSearchParams(e.target.value ? { courseId: e.target.value } : {});

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Quản trị chương trình đào tạo"
        title="Quản lý Bài học & Video"
        subtitle="Chọn khóa học để biên soạn giáo trình, thứ tự bài giảng, thời lượng và đường dẫn video học tập."
        actions={
          <Button variant="secondary" to="/admin/courses">
            <Icon name="arrowLeft" size={16} /> Danh sách khóa học
          </Button>
        }
      />

      <Card title="Chọn khóa học cần biên soạn" subtitle="Tự động tải danh sách bài giảng theo khóa học được chọn.">
        <FormField
          label="Khóa học"
          name="courseId"
          as="select"
          value={courseId}
          onChange={handleSelect}
          disabled={coursesQuery.loading && !coursesQuery.data}
        >
          <option value="">
            {coursesQuery.loading && !coursesQuery.data
              ? 'Đang tải danh sách khóa học...'
              : '— Chọn khóa học để quản lý bài giảng —'}
          </option>
          {selectedMissing && <option value={courseId}>Khóa học #{courseId}</option>}
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              #{course.id} · {course.title} ({course.categoryName || 'Chưa phân loại'})
            </option>
          ))}
        </FormField>
        {coursesQuery.error && (
          <Alert variant="error">
            {coursesQuery.error.message}{' '}
            <button type="button" className="text-link" onClick={coursesQuery.reload}>Thử lại</button>
          </Alert>
        )}
      </Card>

      {courseId ? (
        <CourseLessonsManager key={courseId} courseId={courseId} />
      ) : (
        <EmptyState
          icon="layers"
          title="Chưa chọn khóa học"
          description="Chọn một khóa học ở khung bên trên để xem, thêm mới hoặc chỉnh sửa danh sách bài học."
          action={<Button variant="secondary" to="/admin/courses">Về danh sách khóa học</Button>}
        />
      )}
    </div>
  );
}

function CourseLessonsManager({ courseId }) {
  const location = useLocation();
  const navigate = useNavigate();

  const fetchCourse = useCallback(() => courseApi.getAdminCourseById(courseId), [courseId]);
  const fetchLessons = useCallback(() => courseApi.getAdminCourseLessons(courseId), [courseId]);
  const courseQuery = useApiQuery(fetchCourse);
  const lessonsQuery = useApiQuery(fetchLessons);
  const course = courseQuery.data;
  const lessons = lessonsQuery.data ?? [];

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm(1));
  const [formCourseId, setFormCourseId] = useState(null);
  const [error, setError] = useState(NO_ERROR);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState({ type: 'success', text: location.state?.notice ?? '' });

  useEffect(() => {
    if (location.state?.notice) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  if (lessonsQuery.data && !lessonsQuery.loading && formCourseId !== courseId) {
    setFormCourseId(courseId);
    setEditing(null);
    setForm(emptyForm(nextOrderOf(lessonsQuery.data)));
    setError(NO_ERROR);
  }

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm(nextOrderOf(lessons)));
    setError(NO_ERROR);
  };

  const startEdit = (lesson) => {
    setEditing(lesson);
    setForm(toForm(lesson));
    setError(NO_ERROR);
    setNotice({ type: 'success', text: '' });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(NO_ERROR);
    setNotice({ type: 'success', text: '' });
    try {
      const payload = toPayload(form);
      let updatedLessons;
      if (editing) {
        const saved = await courseApi.updateLesson(editing.id, payload);
        updatedLessons = lessons.map((lesson) => (lesson.id === saved.id ? saved : lesson));
        setNotice({ type: 'success', text: `Đã cập nhật bài học “${payload.title}”.` });
      } else {
        const saved = await courseApi.createLesson(courseId, payload);
        updatedLessons = [...lessons, saved];
        setNotice({ type: 'success', text: `Đã thêm bài học “${payload.title}”.` });
      }
      setEditing(null);
      setForm(emptyForm(nextOrderOf(updatedLessons)));
      lessonsQuery.reload();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const runRowAction = async (lesson, action, doneText) => {
    setBusyId(lesson.id);
    setNotice({ type: 'success', text: '' });
    try {
      await action();
      setNotice({ type: 'success', text: `${doneText} bài học “${lesson.title}”.` });
      if (editing?.id === lesson.id) cancelEdit();
      lessonsQuery.reload();
    } catch (err) {
      setNotice({ type: 'error', text: parseApiError(err).message });
    } finally {
      setBusyId(null);
    }
  };

  const handleHide = (lesson) => {
    if (!window.confirm(`Ẩn bài học “${lesson.title}”?`)) return;
    runRowAction(lesson, () => courseApi.deleteLesson(lesson.id), 'Đã ẩn');
  };

  const handleShow = (lesson) =>
    runRowAction(
      lesson,
      () => courseApi.updateLesson(lesson.id, { ...toPayload(toForm(lesson)), status: 'ACTIVE' }),
      'Đã hiện lại',
    );

  const loadError = courseQuery.error ?? (lessonsQuery.data ? null : lessonsQuery.error);

  if (loadError) {
    return (
      <EmptyState
        icon="warning"
        title="Không tải được khóa học"
        description={loadError.message}
        action={<Button variant="secondary" to="/admin/courses">Về danh sách khóa học</Button>}
      />
    );
  }

  if (courseQuery.loading || formCourseId !== courseId) return <PageLoading text="Đang tải bài học..." />;

  const courseStatus = statusOption(COURSE_STATUSES, course.status);
  const activeLessonsCount = lessons.filter((l) => l.status === 'ACTIVE').length;
  const totalMinutes = lessons.reduce((sum, l) => sum + Number(l.duration || 0), 0);

  return (
    <div className="stack">
      {/* Course Context Hero Card */}
      <div className="nx-lesson-course-hero">
        <div className="nx-lesson-course-left">
          <div className="nx-lesson-course-thumb">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} />
            ) : (
              <Icon name="book" size={26} />
            )}
          </div>
          <div className="nx-lesson-course-info">
            <div className="nx-lesson-course-badges">
              <Badge variant={courseStatus.variant}>{courseStatus.label}</Badge>
              <span className="nx-lesson-course-cat">{course.categoryName}</span>
              <span className="nx-lesson-course-cat">{levelLabel(course.level)}</span>
            </div>
            <h3 className="nx-lesson-course-title">{course.title}</h3>
            <p className="nx-lesson-course-meta">
              Giảng viên: <strong>{course.instructorName || 'EduHub'}</strong> · Học phí:{' '}
              <strong>{Number(course.price) === 0 ? 'Miễn phí' : formatPrice(course.price)}</strong> · Tổng bài giảng:{' '}
              <strong>{formatNumber(lessons.length)} bài ({activeLessonsCount} đang hiển thị)</strong> · Thời lượng:{' '}
              <strong>{formatDuration(totalMinutes) || '0 phút'}</strong>
            </p>
          </div>
        </div>

        <div className="row-actions">
          <Button variant="secondary" size="sm" to={`/courses/${course.id}`}>
            <Icon name="eye" size={15} /> Xem khóa học
          </Button>
          <Button variant="secondary" size="sm" to={`/admin/courses/${course.id}/edit`}>
            <Icon name="pen" size={15} /> Sửa thông tin khóa học
          </Button>
        </div>
      </div>

      <Alert variant={notice.type}>{notice.text}</Alert>

      <div className="admin-grid">
        <Card
          className="admin-form-card"
          title={editing ? `Sửa bài học #${editing.lessonOrder}` : 'Thêm bài học mới'}
          subtitle={editing ? `Đang sửa: ${editing.title}` : 'Thứ tự bài học được gợi ý tự động nối tiếp.'}
        >
          {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Tên bài học"
              name="title"
              placeholder="Ví dụ: Bài 1: Tổng quan Kiến trúc & Cài đặt môi trường"
              value={form.title}
              onChange={handleChange}
              error={error.fieldErrors.title}
              maxLength={200}
              required
            />
            <div className="form-row">
              <FormField
                label="Thứ tự bài"
                name="lessonOrder"
                type="number"
                min="1"
                inputMode="numeric"
                value={form.lessonOrder}
                onChange={handleChange}
                error={error.fieldErrors.lessonOrder}
                required
              />
              <FormField
                label="Thời lượng (phút)"
                name="duration"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="15"
                value={form.duration}
                onChange={handleChange}
                error={error.fieldErrors.duration}
              />
            </div>

            <FormField
              label="Đường dẫn Video (MP4 / YouTube URL)"
              name="videoUrl"
              type="url"
              placeholder="https://vjs.zencdn.net/v/oceans.mp4"
              value={form.videoUrl}
              onChange={handleChange}
              error={error.fieldErrors.videoUrl}
              hint="Hỗ trợ cả link MP4 trực tiếp (có lưu vị trí giây đang xem) và YouTube."
              maxLength={500}
            />

            <div className="nx-studio-preset-bar" style={{ marginBottom: 14 }}>
              <span className="nx-studio-preset-label">Chọn nhanh video mẫu thử nghiệm:</span>
              <div className="nx-studio-preset-chips">
                {SAMPLE_VIDEOS.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        videoUrl: v.url,
                        duration: prev.duration || String(v.duration),
                      }))
                    }
                    className={`nx-studio-preset-chip${form.videoUrl === v.url ? ' is-active' : ''}`}
                  >
                    <Icon name="play" size={12} />
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <FormField
              label="Tóm tắt nội dung bài giảng"
              name="description"
              as="textarea"
              rows={3}
              placeholder="Ghi chú nội dung chính, tài liệu đính kèm hoặc bài tập thực hành..."
              value={form.description}
              onChange={handleChange}
              error={error.fieldErrors.description}
            />

            <FormField
              label="Trạng thái hiển thị"
              name="status"
              as="select"
              value={form.status}
              onChange={handleChange}
              error={error.fieldErrors.status}
            >
              {LESSON_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </FormField>

            <div className="form-actions">
              {editing && (
                <Button variant="ghost" onClick={cancelEdit} disabled={submitting}>Hủy sửa</Button>
              )}
              <Button type="submit" loading={submitting}>
                <Icon name="check" size={15} />
                <span>{submitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm bài học'}</span>
              </Button>
            </div>
          </form>
        </Card>

        <Card
          title="Danh sách Chương trình học"
          subtitle={`${lessons.length} bài giảng · Tổng thời lượng ${formatDuration(totalMinutes) || '0 phút'}`}
        >
          {lessons.length === 0 ? (
            <EmptyState
              icon="play"
              title="Chưa có bài học nào"
              description="Thêm bài học đầu tiên ở biểu mẫu bên trái để hoàn thiện chương trình đào tạo."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Thứ tự</th>
                    <th scope="col">Nội dung bài giảng</th>
                    <th scope="col">Thời lượng</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col" className="nx-th-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => {
                    const status = statusOption(LESSON_STATUSES, lesson.status);
                    const busy = busyId === lesson.id;
                    return (
                      <tr key={lesson.id} className={editing?.id === lesson.id ? 'is-selected' : undefined}>
                        <td>
                          <span className="nx-lesson-order-pill">Bài {lesson.lessonOrder}</span>
                        </td>
                        <td>
                          <div className="cell-title cell-truncate">{lesson.title}</div>
                          <div className="cell-sub cell-truncate">
                            {lesson.description || lesson.videoUrl || 'Chưa có mô tả'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatDuration(lesson.duration) || '—'}</td>
                        <td><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              onClick={() => startEdit(lesson)}
                              disabled={busy}
                              className="nx-action-btn is-edit"
                            >
                              <Icon name="pen" size={14} />
                              <span>Sửa</span>
                            </button>
                            {lesson.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => handleHide(lesson)}
                                disabled={busy}
                                className="nx-action-btn is-warning"
                              >
                                <Icon name="eyeOff" size={14} />
                                <span>{busy ? '...' : 'Ẩn'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleShow(lesson)}
                                disabled={busy}
                                className="nx-action-btn is-success"
                              >
                                <Icon name="eye" size={14} />
                                <span>{busy ? '...' : 'Hiện lại'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
