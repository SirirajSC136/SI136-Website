import { Resource } from '@/types';
import { FileText, Presentation, Video, Link as LinkIcon } from 'lucide-react';

// Helper to get an icon based on the resource type
const getIcon = (type: Resource['type']) => {
    switch (type) {
        case 'PDF':
            return <FileText size={16} />;
        case 'Slides':
            return <Presentation size={16} />;
        case 'Video':
            return <Video size={16} />;
        default:
            return <LinkIcon size={16} />;
    }
};

const ResourceButton = ({ resource }: { resource: Resource }) => (
    <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
    >
        {getIcon(resource.type)}
        <span>{resource.title}</span>
    </a>
);

export default ResourceButton;