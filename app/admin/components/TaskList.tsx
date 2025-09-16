// app/admin/components/TaskList.tsx
'use client';

import { Task } from '@/types';
import { Trash2 } from 'lucide-react';

type TaskListProps = {
    tasks: Task[];
    onTaskDeleted: (taskId: string) => void;
};

const TaskList = ({ tasks, onTaskDeleted }: TaskListProps) => {
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete task');
            onTaskDeleted(taskId); // Notify parent to update state
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-slate-700">Existing Tasks ({tasks.length})</h2>
            <div className="space-y-4">
                {tasks.map(task => (
                    <div key={task._id} className="border p-4 rounded-lg flex justify-between items-start hover:bg-slate-50 transition-colors">
                        <div>
                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${task.type === 'assignment' ? 'bg-amber-200 text-amber-800' : 'bg-rose-200 text-rose-800'}`}>{task.type}</span>
                            <p className="text-lg font-bold mt-2 text-slate-800">{task.courseCode}: {task.title}</p>
                            <p className="text-sm text-gray-600">Deadline: {new Date(task.deadline).toLocaleString('en-GB')}</p>
                            {task.resources.length > 0 && (
                                <div className="mt-2 space-y-1 border-l-2 border-slate-200 pl-3">
                                    {task.resources.map((res, i) => <a href={res.url} target="_blank" rel="noopener noreferrer" key={i} className="block text-xs text-blue-600 hover:underline">Resource: {res.title} ({res.type})</a>)}
                                </div>
                            )}
                        </div>
                        <button onClick={() => handleDeleteTask(task._id!)} className="text-slate-400 hover:text-red-600 p-2 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskList;