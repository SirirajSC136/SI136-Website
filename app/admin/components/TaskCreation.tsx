// app/admin/components/TaskCreation.tsx
'use client';

import { useState, FormEvent } from 'react';
import { Task, Subject, Resource } from '@/types';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';

// --- Component Props ---
type TaskCreationProps = {
    subjects: Subject[];
    onTaskCreated: (newTask: Task) => void;
};

// --- Helper Types for Form State ---
type NewTask = Omit<Task, '_id' | 'deadline'> & { deadline: string };
type NewResource = Omit<Resource, 'id'>;

const TaskCreation = ({ subjects, onTaskCreated }: TaskCreationProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newTask, setNewTask] = useState<NewTask>({
        title: '',
        courseCode: subjects[0]?.courseCode || '',
        type: 'assignment',
        deadline: '',
        resources: [],
    });

    // --- Form Handlers ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const handleResourceChange = (index: number, field: keyof NewResource, value: string) => {
        const updatedResources = [...newTask.resources];
        updatedResources[index][field] = value as any;
        setNewTask(prev => ({ ...prev, resources: updatedResources }));
    };

    const addResource = () => {
        setNewTask(prev => ({
            ...prev,
            resources: [...prev.resources, { title: '', type: 'Link', url: '' }],
        }));
    };

    const removeResource = (index: number) => {
        setNewTask(prev => ({
            ...prev,
            resources: prev.resources.filter((_, i) => i !== index),
        }));
    };

    // --- API Submission Handler ---
    const handleAddTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!newTask.courseCode && subjects.length > 0) {
            setError("Please select a course.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create task');
            }
            const createdTask = await res.json();
            onTaskCreated(createdTask); // Notify parent component
            setNewTask({ title: '', courseCode: subjects[0]?.courseCode || '', type: 'assignment', deadline: '', resources: [] });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-slate-700">Add New Task</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Task Type</label>
                        <select id="type" name="type" value={newTask.type} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                            <option value="assignment">Assignment</option>
                            <option value="examination">Examination</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700">Course</label>
                        <select id="courseCode" name="courseCode" value={newTask.courseCode} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2">
                            {/* --- FIX IS HERE --- */}
                            {/* Changed key from s.id to s._id, which comes from MongoDB */}
                            {subjects.map(s => <option key={s._id} value={s.courseCode}>{s.courseCode} - {s.title}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" id="title" name="title" value={newTask.title} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                </div>
                <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Deadline</label>
                    <input type="datetime-local" id="deadline" name="deadline" value={newTask.deadline} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Resources</h3>
                    <div className="space-y-3">
                        {newTask.resources.map((res, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-md bg-slate-50">
                                <input type="text" placeholder="Title" value={res.title} onChange={(e) => handleResourceChange(index, 'title', e.target.value)} required className="md:col-span-1 p-2" />
                                <select value={res.type} onChange={(e) => handleResourceChange(index, 'type', e.target.value)} className="md:col-span-1 p-2">
                                    <option value="Link">Link</option><option value="PDF">PDF</option><option value="Video">Video</option><option value="Slides">Slides</option>
                                </select>
                                <input type="url" placeholder="URL" value={res.url} onChange={(e) => handleResourceChange(index, 'url', e.target.value)} required className="md:col-span-2 p-2" />
                                <button type="button" onClick={() => removeResource(index)} className="text-red-500 hover:text-red-700 text-sm md:col-span-4 justify-self-end font-semibold">Remove Resource</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addResource} className="mt-3 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                        <PlusCircle size={16} /> Add Resource
                    </button>
                </div>
                {error && <div className="text-red-600 bg-red-50 p-3 rounded-md flex items-center gap-2 text-sm"><AlertCircle size={16} /> {error}</div>}
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
            </form>
        </div>
    );
};

export default TaskCreation;