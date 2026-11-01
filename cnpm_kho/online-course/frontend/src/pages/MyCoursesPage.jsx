import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { enrollmentApi } from '../api/enrollmentApi';

export default function MyCoursesPage() {

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function loadCourses() {
            try {
                const data = await enrollmentApi.getMyCourses();

                if (active) {
                    setCourses(
                        Array.isArray(data)
                            ? data
                            : data?.content ?? []
                    );
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.response?.data?.message ||
                        'Khong the tai khoa hoc'
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadCourses();

        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="container section">
                <p>Đang tải khóa học...</p>
            </div>
        );
    }

    return (
        <div className="container section">

            <h1>Khóa học của tôi</h1>

            <p>
                Danh sách các khóa học bạn đã đăng ký.
            </p>

            {error && (
                <p role="alert" style={{ color: 'red' }}>
                    {error}
                </p>
            )}

            {!error && courses.length === 0 && (
                <div>
                    <p>Bạn chưa đăng ký khóa học nào.</p>

                    <Link to="/courses">
                        Khám phá khóa học
                    </Link>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gap: '20px',
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(250px, 1fr))'
                }}
            >
                {courses.map(course => {

                    const courseId = course.courseId;
                    const progress = Number(
                        course.progressPercentage ??
                        course.progressPercent ??
                        0
                    );

                    return (
                        <article
                            key={course.id}
                            style={{
                                border: '1px solid #ddd',
                                borderRadius: '10px',
                                padding: '20px'
                            }}
                        >
                            <h3>
                                {course.courseTitle ||
                                    `Khóa học #${courseId}`}
                            </h3>

                            <p>
                                Trạng thái: {course.status}
                            </p>

                            <p>
                                Tiến độ: {progress}%
                            </p>

                            <progress
                                value={progress}
                                max="100"
                                style={{ width: '100%' }}
                            />

                            <div style={{ marginTop: '15px' }}>
                                <Link to={`/learning/${courseId}`}>
                                    Vào học
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
