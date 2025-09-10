import { Assignment } from '@/types';
import { AlertTriangle, CalendarClock } from 'lucide-react';

const AssignmentCard = ({ assignment }: { assignment: Assignment }) => (
    <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h4 className="font-bold text-amber-800">{assignment.title}</h4>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${assignment.status === 'Overdue' ? 'text-red-600' : 'text-green-600'}`}>
                <CalendarClock size={14} />
                Due {assignment.dueDate}
            </span>
        </div>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{assignment.description}</p>
        {assignment.fileUrl && (
            <a href={assignment.fileUrl} className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:underline">
                Download File
            </a>
        )}
    </div>
);

export default AssignmentCard;