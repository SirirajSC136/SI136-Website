// app/admin/customize/[subjectId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Subject, TopicItemData } from '@/types';
import { useParams } from 'next/navigation';
import { PlusCircle, Trash, Edit, File as FileIcon, Link as LinkIcon, BrainCircuit, Layers3 } from 'lucide-react';
import ItemEditorModal from './components/ItemEditorModal';

// Helper function to check for valid MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};

// Component for creating a new topic
const NewTopicForm = ({ onSave, onCancel }: { onSave: (title: string) => void, onCancel: () => void }) => {
    const [title, setTitle] = useState('');
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(title); }} className="p-4 my-2 border rounded-lg bg-slate-50">
            <h4 className="font-bold mb-2">Add New Topic</h4>
            <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Topic Title"
                required
                className="block w-full p-2 border rounded mb-2"
            />
            <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">Save Topic</button>
                <button type="button" onClick={onCancel} className="flex items-center gap-1 px-3 py-1 bg-slate-500 text-white rounded hover:bg-slate-600">Cancel</button>
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
    const [showNewTopicForm, setShowNewTopicForm] = useState(false);

    // State specifically for the ItemEditorModal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TopicItemData | undefined>(undefined);
    const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

    // --- DATA FETCHING ---
    const fetchSubjectData = () => {
        if (!subjectId) return;
        setLoading(true);
        setError(null);
        fetch(`/api/subjects/${subjectId}`, { cache: 'no-store' })
            .then(res => {
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                return res.json();
            })
            .then(data => setSubject(data))
            .catch(err => {
                console.error("Error fetching subject data:", err);
                setError("Could not load subject data.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(fetchSubjectData, [subjectId]);

    // --- MODAL HANDLERS ---
    const handleOpenModalToAdd = (topicId: string) => {
        setEditingItem(undefined);
        setActiveTopicId(topicId);
        setIsModalOpen(true);
    };

    const handleOpenModalToEdit = (item: TopicItemData) => {
        setEditingItem(item);
        setActiveTopicId(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(undefined);
        setActiveTopicId(null);
    };

    // --- API ACTION HANDLERS ---
    const handleSaveItem = async (itemData: any) => {
        const isEditing = !!editingItem;
        const url = isEditing ? `/api/admin/materials/${editingItem.id}` : '/api/admin/materials';
        const method = isEditing ? 'PUT' : 'POST';

        const body = isEditing
            ? { item: itemData }
            : { courseId: subjectId, topicId: activeTopicId, item: itemData };

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save item.');
            }
            handleCloseModal();
            fetchSubjectData();
        } catch (err) {
            console.error("Save item failed:", err);
            alert(`Error: Could not save the item. ${err}`);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                const response = await fetch(`/api/admin/materials/${itemId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete item.');
                fetchSubjectData();
            } catch (err) {
                console.error("Delete item failed:", err);
                alert("Error: Could not delete the item.");
            }
        }
    };

    const handleAddTopic = async (title: string) => {
        try {
            const response = await fetch(`/api/admin/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: subjectId, title }),
            });
            if (!response.ok) throw new Error('Failed to add topic.');
            setShowNewTopicForm(false);
            fetchSubjectData();
        } catch (err) {
            console.error("Add topic failed:", err);
            alert('Error: Could not add the topic.');
        }
    };

    const handleDeleteTopic = async (topicId: string, topicTitle: string) => {
        if (confirm(`Are you sure you want to delete the topic "${topicTitle}"? All materials inside it will also be deleted.`)) {
            try {
                const response = await fetch(`/api/admin/topics/${topicId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete topic.');
                fetchSubjectData();
            } catch (err) {
                console.error("Delete topic failed:", err);
                alert('Error: Could not delete the topic.');
            }
        }
    };

    // --- RENDER LOGIC ---
    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8 text-red-600">{error}</div>;
    if (!subject) return <div className="text-center p-8">Could not load subject.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            {isModalOpen && (
                <ItemEditorModal
                    itemToEdit={editingItem}
                    onSave={handleSaveItem}
                    onCancel={handleCloseModal}
                />
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customize: {subject.title}</h1>
                    <p className="text-slate-600 mt-1">Add, edit, or remove materials for this course.</p>
                </div>
                <button onClick={() => setShowNewTopicForm(true)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                    <PlusCircle size={18} /> Add Custom Topic
                </button>
            </div>

            {showNewTopicForm && <NewTopicForm onSave={handleAddTopic} onCancel={() => setShowNewTopicForm(false)} />}

            <div className="mt-6 space-y-4">
                {subject.topics.map(topic => {
                    const isCustomTopic = isValidObjectId(topic.id);
                    return (
                        <div key={topic.id} className="p-4 border rounded-lg bg-white shadow-sm">
                            <div className="flex justify-between items-center pb-3 border-b mb-3">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-slate-800">{topic.title}</h2>
                                    {isCustomTopic ?
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Custom</span> :
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Canvas</span>
                                    }
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* --- THE FIX IS HERE --- */}
                                    {/* The "Delete Topic" button is ONLY for custom topics. */}
                                    {isCustomTopic && (
                                        <button onClick={() => handleDeleteTopic(topic.id, topic.title)} className="p-2 text-red-500 rounded-md hover:bg-red-100" title="Delete Topic">
                                            <Trash size={16} />
                                        </button>
                                    )}
                                    {/* The "Add Item" button is available for ALL topics. */}
                                    <button onClick={() => handleOpenModalToAdd(topic.id)} className="flex items-center gap-1 text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                        <PlusCircle size={16} /> Add Item
                                    </button>
                                    {/* --- END OF FIX --- */}
                                </div>
                            </div>

                            {topic.items.length > 0 ? (
                                <ul className="space-y-2">
                                    {topic.items.map(item => {
                                        const isCustomItem = isValidObjectId(item.id);
                                        let icon;
                                        switch (item.type) {
                                            case 'Quiz': icon = <BrainCircuit size={16} className="text-blue-500" />; break;
                                            case 'Flashcard': icon = <Layers3 size={16} className="text-emerald-500" />; break;
                                            case 'File': icon = <FileIcon size={16} className="text-slate-500" />; break;
                                            default: icon = <LinkIcon size={16} className="text-slate-500" />;
                                        }
                                        return (
                                            <li key={item.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    {icon}
                                                    <span className="text-slate-800">{item.title}</span>
                                                </div>
                                                {isCustomItem && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleOpenModalToEdit(item)} className="p-1 text-slate-500 hover:text-slate-800" title="Edit Item"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-red-500 hover:text-red-800" title="Delete Item"><Trash size={16} /></button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-sm text-slate-500 px-2">No items in this topic yet.</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}