// app/components/academics/TopicItem.tsx

import { Topic } from '@/types';
import { File } from 'lucide-react';

type Props = {
    topic: Topic;
};

const TopicItem = ({ topic }: Props) => {
    return (
        <div className="py-5">
            <h4 className="text-lg font-semibold text-slate-800">{topic.title}</h4>
            {topic.files && topic.files.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {topic.files.map(file => (
                        <li key={file.id} className="flex items-center">
                            <File className="mr-3 h-5 w-5 text-slate-400" />
                            <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                                {file.title}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TopicItem;