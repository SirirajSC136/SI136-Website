import { Topic } from '@/types';
import ResourceButton from './ResourceButton';
import AssignmentCard from './AssignmentCard';

const TopicItem = ({ topic }: { topic: Topic }) => {
    const tagColors = {
        Lec: 'bg-blue-100 text-blue-800',
        Async: 'bg-purple-100 text-purple-800',
        GA: 'bg-green-100 text-green-800',
        LAB: 'bg-yellow-100 text-yellow-800',
        Test: 'bg-red-100 text-red-800',
        FC: 'bg-indigo-100 text-indigo-800',
        TBL: 'bg-pink-100 text-pink-800',
        Online: 'bg-cyan-100 text-cyan-800',
    };

    return (
        <div className="flex items-start gap-6 py-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
                {topic.id.toString().padStart(2, '0')}
            </div>
            <div className="w-full border-b border-gray-200 pb-6">
                <h3 className="text-2xl font-bold text-gray-800">{topic.title}</h3>
                {topic.dateTime && (
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span>{topic.dateTime}</span>
                        {topic.tag && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagColors[topic.tag]}`}>{topic.tag}</span>}
                    </div>
                )}
                {topic.resources.length > 0 && (
                    <div className="mt-4">
                        <h5 className="mb-2 font-semibold text-gray-600">Resources</h5>
                        <div className="flex flex-wrap gap-2">
                            {topic.resources.map((res, index) => <ResourceButton key={index} resource={res} />)}
                        </div>
                    </div>
                )}
                {topic.assignments && topic.assignments.map((asg, index) => <AssignmentCard key={index} assignment={asg} />)}
            </div>
        </div>
    );
};

export default TopicItem;