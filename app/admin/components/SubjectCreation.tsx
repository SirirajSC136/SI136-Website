// app/admin/components/SubjectCreation.tsx
'use client';

import { useState, FormEvent } from 'react';
import { Subject } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';

// ... (props and types remain the same)

const SubjectCreation = ({ onSubjectCreated }: { onSubjectCreated: (newSubject: Subject) => void; }) => {
    const [newSubject, setNewSubject] = useState<Omit<Subject, '_id' | 'topics'>>({
        courseCode: '',
        title: '',
        year: 1,
        semester: 1,
        imageUrl: '',
        canvasUrl: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ... (handleInputChange and handleSubmit logic remains the same)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setNewSubject(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) : value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newSubject, topics: [] }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create subject');
            }
            const createdSubject: Subject = await res.json();
            onSubjectCreated(createdSubject);
            setNewSubject({ courseCode: '', title: '', year: 1, semester: 1, imageUrl: '', canvasUrl: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-slate-700">Create New Subject</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... (other form fields for courseCode, title, etc. remain the same) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">Course Code</label>
                        <input type="text" name="courseCode" value={newSubject.courseCode} onChange={handleInputChange} required placeholder="e.g., SI-101" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Subject Title</label>
                        <input type="text" name="title" value={newSubject.title} onChange={handleInputChange} required placeholder="e.g., Human Anatomy I" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                        <input type="number" name="year" value={newSubject.year} onChange={handleInputChange} required min="1" max="6" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                    <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700">Semester</label>
                        <input type="number" name="semester" value={newSubject.semester} onChange={handleInputChange} required min="1" max="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                    </div>
                </div>
                <div>
                    {/* --- FIX IS HERE --- */}
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image Path</label>
                    <input
                        type="text"
                        name="imageUrl"
                        value={newSubject.imageUrl}
                        onChange={handleInputChange}
                        required
                        placeholder="/images/subjects/anatomy.jpg"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                    />
                </div>
                <div>
                    <label htmlFor="canvasUrl" className="block text-sm font-medium text-gray-700">Canvas URL (Optional)</label>
                    <input type="url" name="canvasUrl" value={newSubject.canvasUrl ?? ''} onChange={handleInputChange} placeholder="https://canvas.example.com/..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                </div>

                {error && (
                    <div className="text-red-600 bg-red-50 p-3 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center items-center rounded-md border border-transparent bg-sky-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:bg-sky-300">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Creating...' : 'Create Subject'}
                </button>
            </form>
        </div>
    );
};

export default SubjectCreation;