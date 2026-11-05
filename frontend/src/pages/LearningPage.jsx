import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { learningApi } from '../api/learningApi';

// Nguồn video dự phòng tốc độ cao (Fastly CDN của Video.js)
const FALLBACK_VIDEO_URL = 'https://vjs.zencdn.net/v/oceans.mp4';

/**
 * Trích xuất ID YouTube nếu có
 */
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(
        /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    if (!match) return null;
    // Sử dụng no-cookie domain để hạn chế tối đa lỗi "Video unavailable"
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`;
}

/**
 * Trình phát video chuẩn HTML5 đa năng, tự động fallback nếu link lỗi
 */
function LessonVideoPlayer({ url, title }) {
    const [videoSrc, setVideoSrc] = useState(url);
    const [hasError, setHasError] = useState(false);
    const ytEmbedUrl = getYouTubeEmbedUrl(url);

    if (!url) {
        return (
            <div
                style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: '#f1f5f9',
                    borderRadius: '12px',
                    color: '#64748b'
                }}
            >
                <p style={{ margin: 0 }}>Bài học này chưa được gắn video bài giảng.</p>
            </div>
        );
    }

    // Nếu người dùng nhập link YouTube
    if (ytEmbedUrl) {
        return (
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <iframe
                    key={ytEmbedUrl}
                    src={ytEmbedUrl}
                    title={title || 'Video bài giảng'}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            </div>
        );
    }

    // Mặc định: Trình phát MP4 chuẩn HTML5 với cơ chế tự động chuyển nguồn dự phòng nếu lỗi
    return (
        <div
            style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
        >
            <video
                key={videoSrc}
                controls
                playsInline
                preload="metadata"
                onError={() => {
                    if (videoSrc !== FALLBACK_VIDEO_URL) {
                        setVideoSrc(FALLBACK_VIDEO_URL);
                    } else {
                        setHasError(true);
                    }
                }}
                style={{
                    width: '100%',
                    display: 'block',
                    aspectRatio: '16/9',
                    background: '#000'
                }}
                src={videoSrc}
            >
                Trình duyệt không hỗ trợ xem video trực tiếp.
            </video>

            {hasError && (
                <div
                    style={{
                        padding: '12px 16px',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}
                >
                    Không thể phát trực tiếp video từ nguồn này.{' '}
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'underline' }}
                    >
                        Bấm vào đây để mở video ở tab mới ↗
                    </a>
                </div>
            )}
        </div>
    );
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
                const [lessonData, progressData] =
                    await Promise.all([
                        learningApi.getLessons(courseId),
                        learningApi.getProgress(courseId)
                    ]);

                if (active) {
                    setLessons(lessonData);
                    setSelectedLesson(lessonData[0] || null);
                    setProgress(progressData);
                }

            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        'Không thể tải nội dung bài học'
                    );
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
        if (!selectedLesson || saving) {
            return;
        }

        setSaving(true);
        setError('');

        try {
            const result = await learningApi.completeLesson(
                selectedLesson.id
            );

            setProgress(result);

            setLessons(oldLessons =>
                oldLessons.map(item =>
                    item.id === selectedLesson.id
                        ? { ...item, completed: true }
                        : item
                )
            );

            setSelectedLesson(old => ({
                ...old,
                completed: true
            }));

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Không thể cập nhật tiến độ'
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="container section">
                <p>Đang tải phòng học...</p>
            </div>
        );
    }

    return (
        <div className="container section">
            <div style={{ marginBottom: '16px' }}>
                <Link
                    to="/my-courses"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--color-primary, #4f46e5)',
                        textDecoration: 'none',
                        fontWeight: 600
                    }}
                >
                    ← Quay lại khóa học của tôi
                </Link>
            </div>

            <h1 style={{ marginBottom: '16px' }}>Phòng học trực tuyến</h1>

            {error && (
                <div
                    role="alert"
                    style={{
                        padding: '12px 16px',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}
                >
                    {error}
                </div>
            )}

            {progress && (
                <div
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        marginBottom: '24px'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '15px' }}>Tiến độ học tập</strong>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary, #4f46e5)' }}>
                            {Math.round(progress.progressPercentage ?? 0)}%
                        </span>
                    </div>

                    <progress
                        value={progress.progressPercentage ?? 0}
                        max="100"
                        style={{ width: '100%', height: '10px', borderRadius: '5px' }}
                    />

                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                        Đã hoàn thành {progress.completedLessons} / {progress.totalLessons} bài học
                    </p>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)',
                    gap: '24px',
                    alignItems: 'start'
                }}
            >
                <main>
                    {selectedLesson ? (
                        <>
                            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
                                {selectedLesson.title}
                            </h2>

                            <LessonVideoPlayer
                                key={selectedLesson.id || selectedLesson.videoUrl}
                                url={selectedLesson.videoUrl}
                                title={selectedLesson.title}
                            />

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                    marginTop: '20px',
                                    paddingBottom: '20px',
                                    borderBottom: '1px solid #e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>
                                        Thời lượng: ~{selectedLesson.duration ?? 15} phút
                                    </span>
                                    {selectedLesson.videoUrl && (
                                        <a
                                            href={selectedLesson.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#4f46e5', fontSize: '13px', textDecoration: 'none' }}
                                        >
                                            Mở video trong tab mới ↗
                                        </a>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={saving || selectedLesson.completed}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: selectedLesson.completed
                                            ? '#16a34a'
                                            : 'var(--color-primary, #4f46e5)',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        cursor: selectedLesson.completed || saving ? 'default' : 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {selectedLesson.completed
                                        ? '✓ Đã hoàn thành'
                                        : saving
                                            ? 'Đang lưu...'
                                            : 'Đánh dấu hoàn thành'}
                                </button>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Mô tả bài học</h3>
                                <p style={{ color: '#334155', lineHeight: '1.6', margin: 0 }}>
                                    {selectedLesson.description || 'Không có mô tả bổ sung cho bài học này.'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <p>Khóa học chưa có bài học.</p>
                    )}
                </main>

                <aside
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}
                >
                    <h3 style={{ fontSize: '16px', marginBottom: '14px' }}>Danh sách bài học</h3>

                    {lessons.map((lesson, index) => {
                        const isSelected = selectedLesson?.id === lesson.id;
                        return (
                            <button
                                key={lesson.id}
                                type="button"
                                onClick={() => setSelectedLesson(lesson)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    padding: '12px 14px',
                                    marginBottom: '8px',
                                    textAlign: 'left',
                                    border: isSelected ? '1.5px solid var(--color-primary, #4f46e5)' : '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    background: isSelected ? '#eef2ff' : '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: isSelected ? 600 : 500,
                                        color: isSelected ? 'var(--color-primary, #4f46e5)' : '#1e293b'
                                    }}
                                >
                                    {index + 1}. {lesson.title}
                                </span>

                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: lesson.completed ? '#dcfce7' : '#f1f5f9',
                                        color: lesson.completed ? '#16a34a' : '#94a3b8',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        marginLeft: '8px'
                                    }}
                                >
                                    {lesson.completed ? '✓' : ''}
                                </span>
                            </button>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
}
