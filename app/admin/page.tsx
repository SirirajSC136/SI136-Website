// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Task, Subject } from '@/types';
import { Loader2, AlertCircle, BookOpen, ClipboardList, Trash2 } from 'lucide-react';
import SubjectCreation from './components/SubjectCreation';
import TaskCreation from './components/TaskCreation';
import TaskList from './components/TaskList';

const AdminPage = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const [tasksRes, subjectsRes] = await Promise.all([
                    fetch('/api/tasks'),
                    fetch('/api/subjects'),
                ]);

                if (!tasksRes.ok) throw new Error(`Failed to fetch tasks: ${tasksRes.statusText}`);
                if (!subjectsRes.ok) throw new Error(`Failed to fetch subjects: ${subjectsRes.statusText}`);

                const tasksData = await tasksRes.json();
                const subjectsData = await subjectsRes.json();

                setTasks(tasksData);
                setSubjects(subjectsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubjectCreated = (newSubject: Subject) => {
        setSubjects(prev => [newSubject, ...prev]);
    };

    const handleTaskCreated = (newTask: Task) => {
        setTasks(prev => [newTask, ...prev]);
    };

    const handleTaskDeleted = (taskId: string) => {
        setTasks(prev => prev.filter(task => task._id !== taskId));
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-12 w-12 text-slate-500" /></div>;
    if (error) return <div className="text-red-600 bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-4 container mx-auto mt-10"><AlertCircle /> {error}</div>;

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-12">Admin Panel</h1>

                <section id="subjects" className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center gap-3"><BookOpen /> Manage Subjects</h2>
                    <SubjectCreation onSubjectCreated={handleSubjectCreated} />
                    <div className="bg-white p-6 rounded-xl shadow-md mt-8">
                        <h3 className="text-xl font-semibold mb-4 text-slate-600">Existing Subjects ({subjects.length})</h3>
                        <div className="space-y-2">
                            {subjects.map(subject => (
                                <div key={subject._id} className="border p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800">{subject.courseCode}: {subject.title}</p>
                                        <p className="text-sm text-slate-500">Year {subject.year}, Semester {subject.semester}</p>
                                    </div>
                                    <button disabled className="text-slate-300 p-2 cursor-not-allowed"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="tasks">
                    <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center gap-3"><ClipboardList /> Manage Tasks</h2>
                    <TaskCreation subjects={subjects} onTaskCreated={handleTaskCreated} />
                    <TaskList tasks={tasks} onTaskDeleted={handleTaskDeleted} />
                </section>
            </div>
        </div>
    );
};

export default AdminPage;