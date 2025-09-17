// app/admin/components/CourseFetch.tsx

'use client';

import { useState, useEffect } from 'react';

// --- UPDATED TYPES TO MATCH THE NEW MODULE-BASED API RESPONSE ---
type FileAttachment = {
    name: string;
    url: string;
};

type ModuleItem = {
    id: number;
    title: string;
    type: 'File' | 'Page' | 'Assignment' | 'Quiz' | 'ExternalUrl' | 'Discussion' | 'SubHeader';
    url?: string;
    page_content_files?: FileAttachment[];
};

type Module = {
    id: number;
    name: string;
    items: ModuleItem[];
};

type CourseWithModules = {
    id: number;
    name: string;
    course_code: string;
    modules: Module[];
};

// Helper to render an icon based on item type
const ItemIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'File': return <span>📎</span>;
        case 'Page': return <span>📄</span>;
        case 'Assignment': return <span>📝</span>;
        case 'ExternalUrl': return <span>🔗</span>;
        case 'Quiz': return <span>❓</span>;
        case 'Discussion': return <span>💬</span>;
        default: return <span>-</span>;
    }
};

const CourseFetch = () => {
    const [courses, setCourses] = useState<CourseWithModules[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openCourseId, setOpenCourseId] = useState<number | null>(null);
    const [openModuleIds, setOpenModuleIds] = useState<number[]>([]); // Handles multiple open modules

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/courses');
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch data');
                }
                const data = await response.json();
                setCourses(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const toggleCourse = (courseId: number) => {
        setOpenCourseId(openCourseId === courseId ? null : courseId);
    };

    const toggleModule = (moduleId: number) => {
        setOpenModuleIds(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        );
    };

    if (loading) return <p>Fetching all course content... This may take a moment.</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '2rem auto' }}>
            <h1>Canvas Course Content</h1>
            {courses.map(course => (
                <div key={course.id} className="course-container">
                    <div onClick={() => toggleCourse(course.id)} className="course-header">
                        <h3>{course.name} ({course.course_code})</h3>
                        <span>{openCourseId === course.id ? '▲' : '▼'}</span>
                    </div>

                    {openCourseId === course.id && (
                        <div className="course-content">
                            {course.modules.length > 0 ? course.modules.map(module => (
                                <div key={module.id} className="module-container">
                                    <div onClick={() => toggleModule(module.id)} className="module-header">
                                        <h4>{module.name}</h4>
                                        <span>{openModuleIds.includes(module.id) ? '▲' : '▼'}</span>
                                    </div>
                                    {openModuleIds.includes(module.id) && (
                                        <ul className="module-items-list">
                                            {module.items.map(item => (
                                                <li key={item.id} className="module-item">
                                                    <ItemIcon type={item.type} />
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                                                    {/* If it was a page and we found files inside it, list them too */}
                                                    {item.page_content_files && item.page_content_files.length > 0 && (
                                                        <ul className="embedded-files-list">
                                                            {item.page_content_files.map((file, index) => (
                                                                <li key={index}>
                                                                    <span>↳</span> <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )) : <p>No modules found for this course.</p>}
                        </div>
                    )}
                </div>
            ))}
            {/* Add some basic CSS for clarity */}
            <style jsx>{`
                .course-container { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; }
                .course-header { background-color: #f0f2f5; padding: 1rem; cursor: pointer; display: flex; justify-content: space-between; }
                .course-content { padding: 0.5rem 1rem 1rem; }
                .module-container { border-top: 1px solid #eee; margin-top: 0.5rem; }
                .module-header { background-color: #f9f9f9; padding: 0.75rem; cursor: pointer; display: flex; justify-content: space-between; }
                .module-items-list { list-style: none; padding-left: 0; margin-top: 0.5rem; }
                .module-item { padding: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
                .module-item a { text-decoration: none; color: #0056d2; }
                .module-item a:hover { text-decoration: underline; }
                .embedded-files-list { list-style: none; padding-left: 2rem; font-size: 0.9em; }
            `}</style>
        </div>
    );
};

export default CourseFetch;