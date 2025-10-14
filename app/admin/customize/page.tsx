"use client";

import { useState, useEffect } from 'react';
import { Subject } from '@/types';
import Link from 'next/link';
// UPDATED: Added Trash2 icon for the delete button
import { Edit, PlusCircle, Save, X, Book, Globe, Trash2 } from 'lucide-react';

// --- NewCourseForm component remains the same ---
const NewCourseForm = ({ onSave, onCancel }: { onSave: Function, onCancel: Function }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const courseData = {
            courseCode: formData.get('courseCode'),
            title: formData.get('title'),
            year: parseInt(formData.get('year') as string, 10),
            semester: parseInt(formData.get('semester') as string, 10),
        };
        onSave(courseData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 my-4 border rounded-lg bg-slate-50">
            <h3 className="text-lg font-bold mb-3">Create New Custom Course</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="courseCode" placeholder="Course Code (e.g., CUS101)" required className="p-2 border rounded" />
                <input name="title" placeholder="Course Title" required className="p-2 border rounded" />
                <input name="year" type="number" placeholder="Year (e.g., 2024)" required className="p-2 border rounded" />
                <input name="semester" type="number" placeholder="Semester (e.g., 1)" required className="p-2 border rounded" />
            </div>
            <div className="flex gap-2 mt-4">
                <button type="submit" className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"><Save size={16} /> Create Course</button>
                <button type="button" onClick={() => onCancel()} className="flex items-center gap-1 px-3 py-1 bg-slate-500 text-white rounded hover:bg-slate-600"><X size={16} /> Cancel</button>
            </div>
        </form>
    );
};


export default function AdminCustomizeLandingPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewCourseForm, setShowNewCourseForm] = useState(false);

    const fetchSubjects = () => {
        setLoading(true);
        fetch('/api/subjects', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setSubjects(data);
                setLoading(false);
            });
    };

    useEffect(fetchSubjects, []);

    const handleCreateCourse = async (courseData: any) => {
        const response = await fetch('/api/admin/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData),
        });

        if (response.ok) {
            setShowNewCourseForm(false);
            fetchSubjects();
        } else {
            const { error } = await response.json();
            alert(`Error: ${error}`);
        }
    };

    // --- NEW: Function to handle course deletion ---
    const handleDeleteCourse = async (courseId: string, courseCode: string) => {
        if (window.confirm(`Are you sure you want to delete the course "${courseCode}"? This action cannot be undone.`)) {
            const response = await fetch(`/api/admin/courses?id=${courseId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchSubjects(); // Refresh the list after successful deletion
            } else {
                const { error } = await response.json();
                alert(`Error: ${error}`);
            }
        }
    };

    if (loading) return <div className="text-center p-8">Loading subjects...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Customize Courses</h1>
                        <p className="mt-2 text-slate-600">Select a subject to manage its materials, or create a new custom course.</p>
                    </div>
                    <button onClick={() => setShowNewCourseForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                        <PlusCircle size={18} /> Create Custom Course
                    </button>
                </div>

                {showNewCourseForm && <NewCourseForm onSave={handleCreateCourse} onCancel={() => setShowNewCourseForm(false)} />}

                <div className="rounded-xl border bg-white shadow-sm">
                    <ul className="divide-y divide-slate-200">
                        {subjects.map(subject => (
                            // UPDATED: Restructured the list item for better interaction
                            <li key={subject._id} className="group flex items-center justify-between p-4 transition-colors hover:bg-slate-50">
                                <Link href={`/admin/customize/${subject._id}`} className="flex-grow flex items-center gap-4">
                                    {subject.canvasUrl ? <Globe size={20} className="text-slate-400" /> : <Book size={20} className="text-purple-500" />}
                                    <div>
                                        <p className="font-bold text-slate-800 group-hover:text-emerald-600">{subject.courseCode} - {subject.title}</p>
                                        <p className="text-sm text-slate-500">Year {subject.year} &middot; Semester {subject.semester}</p>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2 pl-4">
                                    <Link href={`/admin/customize/${subject._id}`} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
                                        <span className="text-sm font-semibold">Customize</span>
                                        <Edit size={16} />
                                    </Link>
                                    {/* NEW: Delete button only for custom courses */}
                                    {!subject.canvasUrl && (
                                        <button
                                            onClick={() => handleDeleteCourse(subject._id, subject.courseCode)}
                                            className="p-2 text-red-500 rounded-md hover:bg-red-100 hover:text-red-700"
                                            title={`Delete course ${subject.courseCode}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
}