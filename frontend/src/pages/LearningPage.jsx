import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { learningApi } from '../api/learningApi';
import { LearningPageSkeleton } from '../components/ui';

// Nguồn video dự phòng tốc độ cao (Fastly CDN của Video.js)
const FALLBACK_VIDEO_URL = 'https://vjs.zencdn.net/v/oceans.mp4';
const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatSeconds(sec) {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
}

function getSavedPositionKey(lessonId) {
    return `eduhub_video_pos_${lessonId}`;
}

/**
 * Trích xuất ID YouTube nếu có
 */
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(
        /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    );
    if (!match) return null;
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`;
}

/**
 * Trình phát video thông minh:
 * - Lưu & khôi phục vị trí đang xem (Resume Playback)
 * - Tự động đánh dấu hoàn thành bài học khi xem đạt >= 80% thời lượng
 * - Chỉnh tốc độ phát (0.75x -> 2x), nút tua -10s / +10s và phím tắt Space / Mũi tên trái phải
 */
function LessonVideoPlayer({ lessonId, url, title, isCompleted, initialPosition = 0, onAutoComplete, onSavePosition }) {
    const videoRef = useRef(null);
    const lastSavedTimeRef = useRef(0);
    const lastServerSyncedRef = useRef(0);
    const autoCompletedRef = useRef(false);

    const [videoSrc, setVideoSrc] = useState(url);
    const [hasError, setHasError] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [watchedPercent, setWatchedPercent] = useState(0);
    const [resumedFrom, setResumedFrom] = useState(null);
    const [autoCompleteToast, setAutoCompleteToast] = useState(false);

    const ytEmbedUrl = getYouTubeEmbedUrl(url);

    useEffect(() => {
        autoCompletedRef.current = Boolean(isCompleted);
    }, [isCompleted, lessonId]);

    const seekBy = useCallback((deltaSeconds) => {
        const video = videoRef.current;
        if (!video) return;
        const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
        video.currentTime = Math.min(duration, Math.max(0, video.currentTime + deltaSeconds));
    }, []);

    const changeSpeed = (rate) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
    };

    const restartFromBeginning = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
        }
        setResumedFrom(null);
    };

    // Phím tắt bàn phím: Space (Play/Pause), ArrowLeft (-10s), ArrowRight (+10s)
    useEffect(() => {
        if (ytEmbedUrl) return undefined;

        const handleKeyDown = (e) => {
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') {
                return;
            }
            const video = videoRef.current;
            if (!video) return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (video.paused) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                seekBy(-10);
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                seekBy(10);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [seekBy, ytEmbedUrl]);

    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = playbackRate;

        if (!lessonId) return;
        try {
            const localSec = Number(localStorage.getItem(getSavedPositionKey(lessonId)) || 0);
            const dbSec = Number(initialPosition || 0);
            const savedSec = Math.max(localSec, dbSec);
            if (savedSec > 3 && Number.isFinite(video.duration) && savedSec < video.duration - 5) {
                video.currentTime = savedSec;
                setResumedFrom(savedSec);
            }
        } catch {
            // ignore
        }
    };

    const saveCurrentPosition = (currentTime, forceServerSync = true) => {
        if (!lessonId || !Number.isFinite(currentTime)) return;
        const floored = Math.floor(currentTime);
        try {
            localStorage.setItem(getSavedPositionKey(lessonId), String(floored));
        } catch {
            // ignore
        }
        if (onSavePosition && (forceServerSync || Math.abs(floored - lastServerSyncedRef.current) >= 10)) {
            lastServerSyncedRef.current = floored;
            onSavePosition(floored);
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

        const current = video.currentTime;
        const pct = Math.min(100, Math.round((current / video.duration) * 100));
        setWatchedPercent(pct);

        // Định kỳ lưu vị trí mỗi 5 giây (localStorage) và 10 giây (Database)
        if (Math.abs(current - lastSavedTimeRef.current) >= 5) {
            lastSavedTimeRef.current = current;
            saveCurrentPosition(current, false);
        }

        // Tự động hoàn thành bài học khi xem đạt >= 80% thời lượng
        if (pct >= 80 && !autoCompletedRef.current && onAutoComplete) {
            autoCompletedRef.current = true;
            setAutoCompleteToast(true);
            onAutoComplete();
        }
    };

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

    // Mặc định: Trình phát MP4 chuẩn HTML5 kèm điều khiển thông minh
    return (
        <div>
            <div
                style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <video
                    ref={videoRef}
                    key={videoSrc}
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPause={() => videoRef.current && saveCurrentPosition(videoRef.current.currentTime)}
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

            {/* Thông báo khôi phục vị trí xem hoặc tự động hoàn thành >= 80% */}
            {(resumedFrom !== null || autoCompleteToast) && (
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        marginTop: '10px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: autoCompleteToast ? '#ecfdf5' : '#eff6ff',
                        border: `1px solid ${autoCompleteToast ? '#a7f3d0' : '#bfdbfe'}`,
                        color: autoCompleteToast ? '#047857' : '#1d4ed8',
                        fontSize: '13px',
                        fontWeight: 600
                    }}
                >
                    {autoCompleteToast ? (
                        <span>✓ Bạn đã xem đạt 80% thời lượng — Hệ thống đã tự động đánh dấu hoàn thành bài học!</span>
                    ) : (
                        <>
                            <span>▶ Đang phát tiếp từ vị trí lần trước ({formatSeconds(resumedFrom)})</span>
                            <button
                                type="button"
                                onClick={restartFromBeginning}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#1d4ed8',
                                    textDecoration: 'underline',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Xem lại từ đầu
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Thanh điều khiển thông minh: Tua nhanh -10s/+10s, Tốc độ phát & Phím tắt */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => seekBy(-10)}
                        title="Phím tắt: Mũi tên trái (←)"
                        style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        ⟲ -10s
                    </button>
                    <button
                        type="button"
                        onClick={() => seekBy(10)}
                        title="Phím tắt: Mũi tên phải (→)"
                        style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        +10s ⟳
                    </button>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                        Đã xem: <strong style={{ color: '#0f172a' }}>{watchedPercent}%</strong> (Tự hoàn thành ở 80%)
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tốc độ:</span>
                    {PLAYBACK_SPEEDS.map((spd) => {
                        const active = playbackRate === spd;
                        return (
                            <button
                                key={spd}
                                type="button"
                                onClick={() => changeSpeed(spd)}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
                                    background: active ? '#2563eb' : '#ffffff',
                                    color: active ? '#ffffff' : '#334155',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                {spd}x
                            </button>
                        );
                    })}
                </div>
            </div>
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

    const handleComplete = useCallback(async () => {
        if (!selectedLesson || saving || selectedLesson.completed) {
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

            setSelectedLesson(old => (
                old && old.id === selectedLesson.id
                    ? { ...old, completed: true }
                    : old
            ));

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Không thể cập nhật tiến độ'
            );
        } finally {
            setSaving(false);
        }
    }, [saving, selectedLesson]);

    const handleSaveWatchPosition = useCallback((lessonId, second) => {
        if (!lessonId) return;
        learningApi.saveWatchPosition(lessonId, second).catch(() => {});
        setLessons(oldLessons =>
            oldLessons.map(item =>
                item.id === lessonId
                    ? { ...item, lastWatchedSecond: second }
                    : item
            )
        );
    }, []);

    if (loading) {
        return <LearningPageSkeleton />;
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

            <div className="learning-room-grid">
                <main style={{ minWidth: 0 }}>
                    {selectedLesson ? (
                        <>
                            <h2 style={{ fontSize: 'clamp(1.05rem, 2.2vw, 1.25rem)', marginBottom: '16px', lineHeight: 1.4 }}>
                                {selectedLesson.title}
                            </h2>

                            <LessonVideoPlayer
                                key={selectedLesson.id || selectedLesson.videoUrl}
                                lessonId={selectedLesson.id}
                                url={selectedLesson.videoUrl}
                                title={selectedLesson.title}
                                isCompleted={selectedLesson.completed}
                                initialPosition={selectedLesson.lastWatchedSecond ?? 0}
                                onAutoComplete={handleComplete}
                                onSavePosition={(sec) => handleSaveWatchPosition(selectedLesson.id, sec)}
                            />

                            <div className="learning-lesson-actions">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
                                    className="learning-complete-btn"
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

                <aside className="learning-playlist-card">
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
