// app/components/academics/TopicItem.tsx

"use client"; // This is now a client component to handle user interaction

import { useState } from 'react';
import { Topic, TopicItemData } from '@/types';
import { File, Link as LinkIcon, ExternalLink, ChevronDown } from 'lucide-react';

/**
 * A small, internal component to render a single item with appropriate styling.
 * (This sub-component does not need to change)
 */
const ItemRenderer = ({ item }: { item: TopicItemData }) => {
    switch (item.type) {
        case 'Header':
            return <h4 className="pt-5 pb-2 text-base font-bold text-slate-700">{item.title}</h4>;
        case 'Page':
            return (
                <div className="py-2">
                    <div
                        className="prose prose-sm max-w-none text-slate-600"
                        dangerouslySetInnerHTML={{ __html: item.htmlContent || '' }}
                    />
                    <a
                        href={item.canvasUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-emerald-600"
                    >
                        <ExternalLink size={14} />
                        If content is missing or videos don't load, view on Canvas.
                    </a>
                </div>
            );
        case 'File':
            return (
                <a
                    href={item.url}
                    download={item.title}
                    className="group flex items-center gap-3 rounded-lg p-3 text-slate-700 transition-colors hover:bg-slate-100"
                >
                    <File className="h-5 w-5 flex-shrink-0 text-slate-400 transition-colors group-hover:text-emerald-600" />
                    <span className="flex-grow font-medium">{item.title}</span>
                </a>
            );
        case 'Link':
            return (
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg p-3 text-slate-700 transition-colors hover:bg-slate-100"
                >
                    <LinkIcon className="h-5 w-5 flex-shrink-0 text-slate-400 transition-colors group-hover:text-emerald-600" />
                    <span className="flex-grow font-medium">{item.title}</span>
                </a>
            );
        default:
            return null;
    }
};

/**
 * The main component, now an interactive accordion item.
 */
const TopicItem = ({ topic }: { topic: Topic }) => {
    const [isOpen, setIsOpen] = useState(false); // State to manage open/closed

    if (!topic.items || topic.items.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
            {/* Clickable Header to toggle the accordion */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-4 text-left"
            >
                <h3 className="text-lg font-bold text-slate-800">{topic.title}</h3>
                <ChevronDown
                    className={`h-6 w-6 flex-shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Collapsible Content Area with smooth animation */}
            <div
                className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}
            >
                <div className="border-t border-slate-200 p-4">
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