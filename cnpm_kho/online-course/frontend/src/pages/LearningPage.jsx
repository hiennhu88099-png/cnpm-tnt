import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { learningApi } from '../api/learningApi';

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
                oldLessons.map(lesson =>
                    lesson.id === selectedLesson.id
                        ? { ...lesson, completed: true }
                        : lesson
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

            <Link to="/my-courses">
                Quay lại khóa học của tôi
            </Link>

            <h1>Phòng học trực tuyến</h1>

            {error && (
                <p role="alert" style={{ color: 'red' }}>
                    {error}
                </p>
            )}

            {progress && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>Tiến độ học tập</h3>

                    <progress
                        value={progress.progressPercentage}
                        max="100"
                        style={{ width: '100%' }}
                    />

                    <p>
                        Đã hoàn thành {progress.completedLessons}
                        /{progress.totalLessons} bài học
                        ({progress.progressPercentage}%)
                    </p>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px'
                }}
            >
                <main>
                    {selectedLesson ? (
                        <>
                            <h2>{selectedLesson.title}</h2>

                            {selectedLesson.videoUrl ? (
                                <video
                                    key={selectedLesson.id}
                                    controls
                                    preload="metadata"
                                    playsInline
                                    style={{ width: '100%' }}
                                    src={selectedLesson.videoUrl}
                                >
                                    Trình duyệt không hỗ trợ video.
                                </video>
                            ) : (
                                <p>Bài học chưa có video.</p>
                            )}

                            <p>{selectedLesson.description}</p>

                            <button
                                type="button"
                                onClick={handleComplete}
                                disabled={
                                    saving ||
                                    selectedLesson.completed
                                }
                            >
                                {selectedLesson.completed
                                    ? 'Đã hoàn thành'
                                    : saving
                                        ? 'Đang lưu...'
                                        : 'Đánh dấu hoàn thành'}
                            </button>
                        </>
                    ) : (
                        <p>Khóa học chưa có bài học.</p>
                    )}
                </main>

                <aside>
                    <h3>Danh sách bài học</h3>

                    {lessons.map((lesson, index) => (
                        <button
                            key={lesson.id}
                            type="button"
                            onClick={() => setSelectedLesson(lesson)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '12px',
                                marginBottom: '10px',
                                textAlign: 'left',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                background:
                                    selectedLesson?.id === lesson.id
                                        ? '#eef5ff'
                                        : '#fff'
                            }}
                        >
                            {index + 1}. {lesson.title}

                            <span style={{ marginLeft: '8px' }}>
                                {lesson.completed ? '✓' : ''}
                            </span>
                        </button>
                    ))}
                </aside>
            </div>
        </div>
    );
}
