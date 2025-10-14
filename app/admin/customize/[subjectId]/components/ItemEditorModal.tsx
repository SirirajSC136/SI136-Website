// app/admin/customize/[subjectId]/components/ItemEditorModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import LinkFileForm from './LinkFileForm';
import QuizForm from './QuizForm';
import FlashcardForm from './FlashcardForm';

const getInitialData = (type: string) => {
    switch (type) {
        case 'Quiz':
            return { type, title: '', content: { questions: [] } };
        case 'Flashcard':
            return { type, title: '', content: { cards: [] } };
        case 'File':
            return { type, title: '', url: '' };
        case 'Link':
        default:
            return { type: 'Link', title: '', url: '' };
    }
};

export default function ItemEditorModal({ itemToEdit, onSave, onCancel }: { itemToEdit?: any, onSave: Function, onCancel: Function }) {
    const [itemData, setItemData] = useState(getInitialData(itemToEdit?.type || 'Link'));

    useEffect(() => {
        if (itemToEdit) {
            setItemData(itemToEdit);
        } else {
            setItemData(getInitialData('Link'));
        }
    }, [itemToEdit]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value;
        const currentTitle = itemData.title;
        const newData = getInitialData(newType);
        newData.title = currentTitle; // Preserve title when switching types
        setItemData(newData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(itemData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <h3 className="text-xl font-bold mb-4">{itemToEdit ? 'Edit Item' : 'Add New Item'}</h3>

                <div className="space-y-4">
                    {/* Common Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                value={itemData.title}
                                onChange={e => setItemData({ ...itemData, title: e.target.value })}
                                placeholder="Item Title"
                                required
                                className="block w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select
                                value={itemData.type}
                                onChange={handleTypeChange}
                                className="block w-full p-2 border rounded bg-white"
                                disabled={!!itemToEdit} // Prevent changing type when editing
                            >
                                <option value="Link">Link</option>
                                <option value="File">File</option>
                                <option value="Quiz">Quiz</option>
                                <option value="Flashcard">Flashcard Deck</option>
                            </select>
                        </div>
                    </div>

                    <hr />

                    {/* Dynamic Form Area */}
                    {(itemData.type === 'Link' || itemData.type === 'File') &&
                        <LinkFileForm data={itemData} setData={setItemData} />
                    }
                    {itemData.type === 'Quiz' &&
                        <QuizForm content={itemData.content} setContent={(newContent: any) => setItemData({ ...itemData, content: newContent })} />
                    }
                    {itemData.type === 'Flashcard' &&
                        <FlashcardForm content={itemData.content} setContent={(newContent: any) => setItemData({ ...itemData, content: newContent })} />
                    }
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button type="button" onClick={() => onCancel()} className="flex items-center gap-1 px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600">
                        <X size={16} /> Cancel
                    </button>
                    <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                        <Save size={16} /> Save
                    </button>
                </div>
            </form>
        </div>
    );
}