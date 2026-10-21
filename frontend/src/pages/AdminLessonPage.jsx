import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { courseApi } from '../api/courseApi';
import { parseApiError } from '../api/apiError';
import useApiQuery from '../hooks/useApiQuery';
import FormField from '../components/FormField';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, PageLoading } from '../components/ui';
import { COURSE_STATUSES, LESSON_STATUSES, formatDuration, statusOption } from '../config/course';

const NO_ERROR = { message: '', fieldErrors: {} };

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

// Gợi ý thứ tự cho bài học tiếp theo = thứ tự lớn nhất + 1
const nextOrderOf = (lessons) => lessons.reduce((max, lesson) => Math.max(max, lesson.lessonOrder), 0) + 1;

// Danh sách khóa học cho ô chọn (backend giới hạn tối đa 50 bản ghi mỗi trang)
const PICKER_SIZE = 50;

// Trang /admin/lessons: chọn khóa học rồi quản lý bài học. Khóa học đã chọn nằm trên URL (?courseId=)
// để trang danh sách khóa học / form tạo khóa học có thể mở thẳng đúng khóa.
export default function AdminLessonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') ?? '';

  const fetchCourses = useCallback(() => courseApi.getAdminCourses({ size: PICKER_SIZE, sort: 'title,asc' }), []);
  const coursesQuery = useApiQuery(fetchCourses);
  const courses = coursesQuery.data?.content ?? [];
  // Khóa học mở từ link có thể nằm ngoài 50 khóa đầu tiên: vẫn giữ lựa chọn đó trong ô chọn
  const selectedMissing = courseId && !courses.some((course) => String(course.id) === courseId);

  const handleSelect = (e) => setSearchParams(e.target.value ? { courseId: e.target.value } : {});

  return (
    <div className="stack">
      <PageHeader eyebrow="Quản trị" title="Quản lý bài học" subtitle="Chọn khóa học để xem, thêm và sửa bài học." />

      <Card>
        <FormField
          label="Khóa học"
          name="courseId"
          as="select"
          value={courseId}
          onChange={handleSelect}
          disabled={coursesQuery.loading && !coursesQuery.data}
        >
          <option value="">{coursesQuery.loading && !coursesQuery.data ? 'Đang tải...' : 'Chọn khóa học'}</option>
          {selectedMissing && <option value={courseId}>Khóa học #{courseId}</option>}
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
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
        // key: đổi khóa học thì dựng lại toàn bộ form/trạng thái của khóa cũ
        <CourseLessonsManager key={courseId} courseId={courseId} />
      ) : (
        <EmptyState
          icon="layers"
          title="Chưa chọn khóa học"
          description="Chọn một khóa học ở ô bên trên để quản lý chương trình học."
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

  // Lần đầu có danh sách bài học của khóa này: gợi ý thứ tự cho bài tiếp theo
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
      // Danh sách sau khi lưu (để gợi ý thứ tự mới ngay, không phải chờ tải lại)
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

  // Xóa mềm: bài học chuyển sang INACTIVE và biến mất khỏi trang chi tiết khóa học
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

  return (
    <div className="stack">
      <Card title={course.title} subtitle={`${course.categoryName} · ${lessons.length} bài học`}>
        <div className="row-actions">
          <Badge variant={courseStatus.variant}>{courseStatus.label}</Badge>
          <Button variant="secondary" size="sm" to={`/admin/courses/${course.id}/edit`}>Sửa khóa học</Button>
        </div>
      </Card>

      <Alert variant={notice.type}>{notice.text}</Alert>

      <div className="admin-grid">
        <Card
          className="admin-form-card"
          title={editing ? 'Sửa bài học' : 'Thêm bài học'}
          subtitle={editing ? `Đang sửa: ${editing.title}` : 'Thứ tự bài học không được trùng nhau.'}
        >
          {!Object.keys(error.fieldErrors).length && <Alert variant="error">{error.message}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Tên bài học"
              name="title"
              placeholder="Ví dụ: Giới thiệu khóa học"
              value={form.title}
              onChange={handleChange}
              error={error.fieldErrors.title}
              maxLength={200}
              required
            />
            <div className="form-row">
              <FormField
                label="Thứ tự"
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
              label="Video (URL)"
              name="videoUrl"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.videoUrl}
              onChange={handleChange}
              error={error.fieldErrors.videoUrl}
              hint="Chỉ học viên đã đăng ký mới xem được video."
              maxLength={500}
            />
            <FormField
              label="Mô tả"
              name="description"
              as="textarea"
              rows={3}
              placeholder="Nội dung chính của bài học"
              value={form.description}
              onChange={handleChange}
              error={error.fieldErrors.description}
            />
            <FormField
              label="Trạng thái"
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
                <Button variant="ghost" onClick={cancelEdit} disabled={submitting}>Hủy</Button>
              )}
              <Button type="submit" loading={submitting}>
                {submitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm bài học'}
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Chương trình học" subtitle="Sắp xếp theo thứ tự bài học.">
          {lessons.length === 0 ? (
            <EmptyState
              icon="play"
              title="Chưa có bài học nào"
              description="Thêm bài học đầu tiên ở khung bên cạnh."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Bài học</th>
                    <th scope="col">Thời lượng</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => {
                    const status = statusOption(LESSON_STATUSES, lesson.status);
                    const busy = busyId === lesson.id;
                    return (
                      <tr key={lesson.id} className={editing?.id === lesson.id ? 'is-selected' : undefined}>
                        <td>{lesson.lessonOrder}</td>
                        <td>
                          <div className="cell-title cell-truncate">{lesson.title}</div>
                          <div className="cell-sub cell-truncate">{lesson.videoUrl || 'Chưa có video'}</div>
                        </td>
                        <td>{formatDuration(lesson.duration) || '—'}</td>
                        <td><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td>
                          <div className="row-actions">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(lesson)} disabled={busy}>
                              Sửa
                            </Button>
                            {lesson.status === 'ACTIVE' ? (
                              <Button variant="ghost" size="sm" onClick={() => handleHide(lesson)} loading={busy}>
                                Ẩn
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleShow(lesson)} loading={busy}>
                                Hiện lại
                              </Button>
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
