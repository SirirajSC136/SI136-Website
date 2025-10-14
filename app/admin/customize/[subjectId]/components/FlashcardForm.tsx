// app/admin/customize/[subjectId]/components/FlashcardForm.tsx
"use client";

import { Trash2, PlusCircle } from 'lucide-react';

export default function FlashcardForm({ content, setContent }: { content: any, setContent: Function }) {
    const cards = content?.cards || [];

    const handleCardChange = (cIndex: number, side: 'front' | 'back', value: string) => {
        const newCards = [...cards];
        newCards[cIndex][side] = value;
        setContent({ ...content, cards: newCards });
    };

    const addCard = () => {
        const newCards = [...cards, { front: '', back: '' }];
        setContent({ ...content, cards: newCards });
    };

    const removeCard = (cIndex: number) => {
        const newCards = cards.filter((_: any, index: number) => index !== cIndex);
        setContent({ ...content, cards: newCards });
    };

    return (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1">
            {cards.map((card: any, cIndex: number) => (
                <div key={cIndex} className="p-3 border rounded-lg bg-slate-50 relative grid grid-cols-2 gap-4">
                    <div>
                        <label className="font-semibold mb-1 block">Card {cIndex + 1}: Front</label>
                        <textarea
                            value={card.front}
                            onChange={(e) => handleCardChange(cIndex, 'front', e.target.value)}
                            placeholder="Term or question..."
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="font-semibold mb-1 block">Card {cIndex + 1}: Back</label>
                        <textarea
                            value={card.back}
                            onChange={(e) => handleCardChange(cIndex, 'back', e.target.value)}
                            placeholder="Definition or answer..."
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <button onClick={() => removeCard(cIndex)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button type="button" onClick={addCard} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                <PlusCircle size={16} /> Add Card
            </button>
        </div>
    );
}