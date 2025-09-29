"use client";

import { useState, useEffect } from 'react';
import { Subject, TopicItemData } from '@/types';
import { useParams } from 'next/navigation';
import { File as FileIcon, Link as LinkIcon, Edit, Trash, PlusCircle, Save, X } from 'lucide-react';

/**
 * A simplified form for adding/editing items. It now only handles URL inputs.
 */
const ItemForm = ({ topic, itemToEdit, onSave, onCancel }: any) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [type, setType] = useState(itemToEdit?.type || 'Link');
    const [url, setUrl] = useState(itemToEdit?.url || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newItemData = { title, type, url };
        onSave(newItemData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 my-2 border rounded-lg bg-slate-50">
            <h4 className="font-bold mb-2">{itemToEdit ? 'Edit Item' : 'Add New Item'}</h4>

            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Item Title" required className="block w-full p-2 border rounded mb-3" />

            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="block w-full p-2 border rounded mb-3">
                <option value="Link">Link (e.g., YouTube, article)</option>
                <option value="File">File (link to a PDF, etc.)</option>
            </select>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." required className="block w-full p-2 border rounded mb-3" />
            </div>

            <div className="flex gap-2 mt-4">
                <button type="submit" className="flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                    <Save size={16} /> Save
                </button>
                <button type="button" onClick={onCancel} className="flex items-center gap-1 px-3 py-1.5 bg-slate-500 text-white rounded hover:bg-slate-600">
                    <X size={16} /> Cancel
                </button>
            </div>
        </form>
    );
};

export default function CustomizeSubjectPage() {
    const params = useParams();
    const subjectId = params.subjectId as string;
    const [subject, setSubject] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingState, setEditingState] = useState<{ topicId: string, item?: TopicItemData } | null>(null);

    const fetchSubjectData = () => {
        if (!subjectId) return;
        setLoading(true);
        setError(null);
        fetch(`/api/subjects/${subjectId}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
                return res.json();
            })
            .then(data => setSubject(data))
            .catch(err => {
                console.error("Error fetching subject data:", err);
                setError("Could not load subject data. Please try again later.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(fetchSubjectData, [subjectId]);

    // ==================================================
    // === THE FIX IS HERE: Implementing the handlers ===
    // ==================================================

    const handleSaveItem = async (newItemData: any) => {
        const isEditing = !!editingState?.item;
        const url = isEditing ? `/api/admin/materials/${editingState.item?._id}` : '/api/admin/materials';
        const method = isEditing ? 'PUT' : 'POST';

        const body = isEditing
            ? { item: { ...editingState.item, ...newItemData } }
            : {
                canvasCourseId: parseInt(subjectId),
                canvasModuleId: parseInt(editingState!.topicId),
                item: { id: `custom-${Date.now()}`, ...newItemData }
            };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) throw new Error('Failed to save item.');
            setEditingState(null);
            fetchSubjectData(); // Refresh data on success
        } catch (err) {
            console.error("Save item failed:", err);
            alert("Error: Could not save the item.");
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const response = await fetch(`/api/admin/materials/${itemId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete item.');
                fetchSubjectData(); // Refresh data on success
            } catch (err) {
                console.error("Delete item failed:", err);
                alert("Error: Could not delete the item.");
            }
        }
    };

    // ==================================================

    if (loading) return <div className="text-center p-8">Loading course data...</div>;
    if (error) return <div className="text-center p-8 text-red-600">{error}</div>;
    if (!subject) return <div className="text-center p-8">Could not load subject.</div>;

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold">Customize: {subject.title}</h1>
            <p className="text-slate-600">Add, edit, or remove custom materials for this course.</p>
            <div className="mt-6 space-y-4">
                {subject.topics.map(topic => (
                    <div key={topic.id} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">{topic.title}</h2>
                            <button onClick={() => setEditingState({ topicId: topic.id })} className="flex items-center gap-1 text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                <PlusCircle size={16} /> Add Item
                            </button>
                        </div>

                        {editingState?.topicId === topic.id && !editingState.item && (
                            <ItemForm topic={topic} onSave={handleSaveItem} onCancel={() => setEditingState(null)} />
                        )}

                        <ul className="mt-4 space-y-2">
                            {topic.items.map(item => (
                                <li key={item.id || item._id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                                    <div className="flex items-center gap-2">
                                        {item.type === 'File' ? <FileIcon size={16} /> : <LinkIcon size={16} />}
                                        <a href={item.url} target="_blank" className="text-blue-600 hover:underline">{item.title}</a>
                                        {item.id && item.id.startsWith('custom-') ?
                                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Custom</span> :
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Canvas</span>
                                        }
                                    </div>
                                    {item.id && item.id.startsWith('custom-') && item._id && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingState({ topicId: topic.id, item })} className="text-slate-500 hover:text-slate-800"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteItem(item._id!)} className="text-red-500 hover:text-red-800"><Trash size={16} /></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {editingState?.topicId === topic.id && editingState.item && (
                            <ItemForm topic={topic} itemToEdit={editingState.item} onSave={handleSaveItem} onCancel={() => setEditingState(null)} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}