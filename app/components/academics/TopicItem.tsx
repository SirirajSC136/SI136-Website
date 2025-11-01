// app/components/academics/TopicItem.tsx

"use client";

import { useState } from 'react';
import { Topic, TopicItemData } from '@/types';
import Link from 'next/link';
import { File, Link as LinkIcon, ExternalLink, ChevronDown, BookOpen, BrainCircuit, Layers3, PlayCircle } from 'lucide-react';
/**
 * A small, internal component to render a single item with appropriate styling.
 */
const ItemRenderer = ({ item }: { item: TopicItemData }) => {
    switch (item.type) {
        case 'Header':
            return <h4 className="pt-5 pb-2 text-base font-bold text-primary">{item.title}</h4>;

        // --- THIS IS THE FIX ---
        // The 'Page' case is now changed to render a simple link,
        // preventing any embedded videos from being displayed.
        case 'Page':
            return (
                <a
                    href={item.canvasUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800"
                >
                    <BookOpen className="h-5 w-5 flex-shrink-0 text-secondary transition-colors group-hover:text-emerald-600" />
                    <span className="flex-grow font-medium">{item.title}</span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-secondary" />
                </a>
            );

        case 'File':
            return (
                <a
                    href={item.url}
                    download={item.title}
                    className="group flex items-center gap-3 rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800"
                >
                    <File className="h-5 w-5 flex-shrink-0 text-secondary transition-colors group-hover:text-emerald-600" />
                    <span className="flex-grow font-medium">{item.title}</span>
                </a>
            );
        case 'Link':
            return (
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800"
                >
                    <LinkIcon className="h-5 w-5 flex-shrink-0 text-secondary transition-colors group-hover:text-emerald-600" />
                    <span className="flex-grow font-medium">{item.title}</span>
                </a>
            );
        case 'Quiz':
            return (
                <Link
                    href={`/quiz/${item.id}`} // This is the future page for taking the quiz
                    className="group flex items-center justify-between rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800"
                >
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="h-5 w-5 flex-shrink-0 text-blue-500" />
                        <span className="flex-grow font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                        Start Quiz
                        <PlayCircle size={16} />
                    </div>
                </Link>
            );

        // --- NEW: Case for rendering a Flashcard Deck ---
        // This renders a link that will take the user to the flashcard viewer page.
        case 'Flashcard':
            return (
                <Link
                    href={`/flashcards/${item.id}`} // This is the future page for viewing flashcards
                    className="group flex items-center justify-between rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800"
                >
                    <div className="flex items-center gap-3">
                        <Layers3 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                        <span className="flex-grow font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                        View Deck
                        <PlayCircle size={16} />
                    </div>
                </Link>
            );



        default:
            return null;
    }
};

/**
 * The main component, now an interactive accordion item.
 * (No changes needed in this part)
 */
const TopicItem = ({ topic }: { topic: Topic }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!topic.items || topic.items.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-background transition-shadow hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-4 text-left"
            >
                <h3 className="text-lg font-bold text-primary">{topic.title}</h3>
                <ChevronDown
                    className={`h-6 w-6 flex-shrink-0 text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <div
                className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}
            >
                <div className="border-t border-border p-4">
                    <div className="space-y-1">
                        {topic.items.map(item => (
                            <ItemRenderer key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopicItem;