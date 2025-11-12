"use client";

import { useState } from 'react';
import { Topic, TopicItemData } from '@/types';
import Link from 'next/link';
import { File, Link as LinkIcon, ExternalLink, ChevronDown, BookOpen, BrainCircuit, Layers3, PlayCircle } from 'lucide-react';

const ItemRenderer = ({ item }: { item: TopicItemData }) => {
    const isNotPureNumberId = /[^0-9]/.test(item.id);

    const containerClasses = isNotPureNumberId
        ? 'outline outline-2 outline-offset-2 outline-pink-500 shadow-lg shadow-pink-500/50'
        : '';

    const textClasses = isNotPureNumberId
        ? 'font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 animate-pulse'
        : 'font-medium';

    switch (item.type) {
        case 'Header':
            return <h4 className="pt-5 pb-2 text-base font-bold text-primary">{item.title}</h4>;

        case 'Page':
            return (
                <a
                    href={item.canvasUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-3 rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800 ${containerClasses}`}
                >
                    <BookOpen className="h-5 w-5 flex-shrink-0 text-secondary transition-colors group-hover:text-emerald-600" />
                    <span className={`flex-grow ${textClasses}`}>{item.title}</span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-secondary" />
                </a>
            );

        case 'File':
            return (
                <a
                    href={item.url}
                    download={item.title}
                    className={`group flex items-center gap-3 rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800 ${containerClasses}`}
                >
                    <File className="h-5 w-5 flex-shrink-0 text-secondary transition-colors group-hover:text-emerald-600" />
                    <span className={`flex-grow ${textClasses}`}>{item.title}</span>
                </a>
            );
        case 'Link':
            return (
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-3 rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800 ${containerClasses}`}
                >
                    <LinkIcon className="h-5 w-5 flex-shrink-0 text-secondary transition-colors group-hover:text-emerald-600" />
                    <span className={`flex-grow ${textClasses}`}>{item.title}</span>
                </a>
            );
        case 'Quiz':
            return (
                <Link
                    href={`/quiz/${item.id}`}
                    className={`group flex items-center justify-between rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800 ${containerClasses}`}
                >
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="h-5 w-5 flex-shrink-0 text-blue-500" />
                        <span className={`flex-grow ${textClasses}`}>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                        Start Quiz
                        <PlayCircle size={16} />
                    </div>
                </Link>
            );

        case 'Flashcard':
            return (
                <Link
                    href={`/flashcards/${item.id}`}
                    className={`group flex items-center justify-between rounded-lg p-3 text-secondary transition-colors hover:bg-slate-100 dark:hover:bg-stone-800 ${containerClasses}`}
                >
                    <div className="flex items-center gap-3">
                        <Layers3 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                        <span className={`flex-grow ${textClasses}`}>{item.title}</span>
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