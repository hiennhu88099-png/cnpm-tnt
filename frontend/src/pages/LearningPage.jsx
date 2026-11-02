import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { learningApi } from '../api/learningApi';
import { Alert, Badge, Button, Card, EmptyState, Icon, ProgressBar, Spinner } from '../components/ui';
import { formatDuration } from '../config/course';

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (parsed.pathname.startsWith('/embed/')) return url;
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default function LearningPage() {
  const { courseId } = useParams();

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [lessonData, progressData] = await Promise.all([
          learningApi.getLessons(courseId),
          learningApi.getProgress(courseId),
        ]);

        if (active) {
          setLessons(lessonData);
          const firstUnfinished = lessonData.find((l) => !l.completed) || lessonData[0] || null;
          setSelectedLesson(firstUnfinished);
          setProgress(progressData);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || 'Bạn cần đăng ký khóa học này trước khi vào phòng học.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [courseId]);

  async function handleComplete() {
    if (!selectedLesson || saving) return;

    setSaving(true);
    setError('');

    try {
      const result = await learningApi.completeLesson(selectedLesson.id);
      setProgress(result);

      setLessons((oldLessons) =>
        oldLessons.map((lesson) =>
          lesson.id === selectedLesson.id ? { ...lesson, completed: true } : lesson,
        ),
      );
      setSelectedLesson((old) => ({ ...old, completed: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật tiến độ bài học');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container section">
        <Spinner label="Đang tải phòng học trực tuyến..." />
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(selectedLesson?.videoUrl);
  const pct = Math.round(Number(progress?.progressPercentage ?? 0));

  return (
    <div className="container section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/my-courses" className="course-breadcrumb" style={{ margin: 0 }}>
          ← Quay lại Khóa học của tôi
        </Link>
        <Button variant="secondary" size="sm" to={`/courses/${courseId}`}>
          Trang thông tin khóa học & Đánh giá
        </Button>
      </div>

      <Alert variant="error">{error}</Alert>

      {progress && (
        <Card className="kit-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <strong>Tiến độ khóa học</strong>
            <span>
              Đã hoàn thành <strong>{progress.completedLessons}</strong> / {progress.totalLessons} bài học ({pct}%)
            </span>
          </div>
          <ProgressBar value={pct} />
        </Card>
      )}

      {lessons.length === 0 ? (
        <EmptyState
          icon="layers"
          title="Khóa học chưa có bài học"
          description="Giảng viên đang cập nhật nội dung video cho khóa học này."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <Card>
            {selectedLesson && (
              <div className="stack">
                {embedUrl ? (
                  <div style={{ position: 'relative', aspectRatio: '16 / 9', width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                    <iframe
                      key={selectedLesson.id}
                      src={embedUrl}
                      title={selectedLesson.title}
                      style={{ width: '100%', height: '100%', border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : selectedLesson.videoUrl ? (
                  <video
                    key={selectedLesson.id}
                    controls
                    preload="metadata"
                    playsInline
                    style={{ width: '100%', borderRadius: '12px', background: '#000', aspectRatio: '16 / 9' }}
                    src={selectedLesson.videoUrl}
                  >
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                ) : (
                  <EmptyState icon="play" title="Bài học chưa có video" />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <Badge variant={selectedLesson.completed ? 'success' : 'primary'}>
                      {selectedLesson.completed ? 'Đã hoàn thành' : `Bài ${selectedLesson.lessonOrder}`}
                    </Badge>
                    <h2 style={{ marginTop: '8px', marginBottom: '4px' }}>{selectedLesson.title}</h2>
                    {selectedLesson.duration > 0 && (
                      <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                        Thời lượng: {formatDuration(selectedLesson.duration)}
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant={selectedLesson.completed ? 'secondary' : 'primary'}
                    loading={saving}
                    disabled={saving || selectedLesson.completed}
                    onClick={handleComplete}
                  >
                    <Icon name="check" size={16} />
                    {selectedLesson.completed ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành'}
                  </Button>
                </div>

                {selectedLesson.description && (
                  <p className="prose" style={{ margin: 0 }}>
                    {selectedLesson.description}
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card title={`Danh sách bài học (${lessons.length})`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lessons.map((lesson, index) => {
                const isActive = selectedLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLesson(lesson)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 14px',
                      textAlign: 'left',
                      border: isActive ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: '10px',
                      background: isActive ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: isActive ? 700 : 600, fontSize: 'var(--text-sm)' }}>
                        {index + 1}. {lesson.title}
                      </div>
                      {lesson.duration > 0 && (
                        <div className="text-muted" style={{ fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                          {formatDuration(lesson.duration)}
                        </div>
                      )}
                    </div>
                    {lesson.completed && <Badge variant="success">✓ Xong</Badge>}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

