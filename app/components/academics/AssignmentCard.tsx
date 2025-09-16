// app/components/academics/AssignmentCard.tsx

import { Assignment } from '@/types';
import { ExternalLink, Calendar } from 'lucide-react';

const AssignmentCard = ({ assignment }: { assignment: Assignment }) => (
    <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <h6 className="font-bold text-amber-900">Assignment</h6>
        <p className="mt-1 text-lg font-semibold text-gray-800">{assignment.title}</p>
        <div className="mt-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span>Due: {assignment.dueDate}</span>
            </div>
            <a
                href={assignment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-semibold text-emerald-600 hover:underline"
            >
                View Details <ExternalLink size={14} />
            </a>
        </div>
    </div>
);

export default AssignmentCard;