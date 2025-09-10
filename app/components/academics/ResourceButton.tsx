import { FileText, Video, BookOpen, ClipboardCheck, FileQuestion, Book } from 'lucide-react';
import { Resource } from '@/types';

const ResourceButton = ({ resource }: { resource: Resource }) => {
    const icons = {
        Handout: <FileText size={16} />,
        Video: <Video size={16} />,
        Lecture: <BookOpen size={16} />,
        Exercise: <ClipboardCheck size={16} />,
        'GA Problems': <FileQuestion size={16} />,
        Summary: <Book size={16} />,
        Other: <FileText size={16} />,
    };

    return (
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700">
            {icons[resource.type]}
            <span>{resource.label || resource.type}</span>
        </a>
    );
};

export default ResourceButton;