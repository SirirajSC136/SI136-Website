import { IActivity } from '@/types';
import { CalendarDays, ClipboardList, Pencil, ArrowRight } from 'lucide-react';
import React from 'react';

// --- HARDCODED SAMPLE DATA (Unchanged) ---
const sampleData: IActivity[] = [
    { id: 'evt1', type: 'event', courseCode: 'SIID350', title: 'Clinical Integration 21: GI hemorrhage', dateTime: '2024-10-10T10:00:00', tag: 'GA', details: 'Now Available: Handout' },
    { id: 'evt2', type: 'event', courseCode: 'SIID351', title: 'Vascular and neoplastic disorders of respiratory tract', dateTime: '2024-10-11T09:00:00', tag: 'Async', details: 'Now Available: Lecture' },
    { id: 'evt3', type: 'event', courseCode: 'SIID343', title: 'Disorder of fluid and electrolyte', dateTime: '2024-10-11T10:00:00', tag: 'Lec', details: 'Now Available:' },
    { id: 'evt4', type: 'event', courseCode: 'SIID347', title: 'Integration of CV disorders: heart failure 1', dateTime: '2024-10-11T13:00:00', tag: 'GA', details: 'Now Available:' },
    { id: 'asg1', type: 'assignment', courseCode: 'SIID351', title: 'CLO assessment 1-3', dateTime: '2024-10-07T23:59:00' },
    { id: 'asg2', type: 'assignment', courseCode: 'SIID347', title: 'CLO assessment 1-4', dateTime: '2025-10-10T23:59:00' },
    { id: 'exm1', type: 'examination', courseCode: 'SIID351', title: 'Summative', dateTime: '2026-10-14T13:00:00' },
    { id: 'exm2', type: 'examination', courseCode: 'SIID347', title: 'Mid-term Exam', dateTime: '2025-10-15T13:00:00' },
];

// --- HELPER FUNCTION (Unchanged) ---
const formatRemainingTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return "Past";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days} วัน ${hours} ชั่วโมง`;
};

// --- NEW SUB-COMPONENTS ---

// A styled title for each section
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-emerald-900 mb-6 pb-2 border-b-2 border-emerald-200">
        {children}
    </h2>
);

// A dedicated card for "Upcoming Events"
const EventCard = ({ activity }: { activity: IActivity }) => (
    <div className="group flex items-start space-x-4 p-4 bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex-shrink-0 mt-1">
            <div className="p-2 bg-emerald-100 rounded-full">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
            </div>
        </div>
        <div className="flex-grow">
            <p className="text-sm font-semibold text-emerald-800">
                {`${activity.courseCode} - ${new Date(activity.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${activity.tag}`}
            </p>
            <p className="text-lg font-medium text-gray-800">{activity.title}</p>
            <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">{activity.details}</span>
                <a href="#" className="flex items-center text-sm text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    ดูหน้าวิชา <ArrowRight className="h-4 w-4 ml-1" />
                </a>
            </div>
        </div>
    </div>
);

// A versatile card for Assignments and Examinations
const TaskCard = ({ activity, type }: { activity: IActivity; type: 'assignment' | 'examination' }) => {
    const theme = {
        assignment: {
            Icon: ClipboardList,
            bgColor: 'bg-amber-100',
            textColor: 'text-amber-700',
            pillBgColor: 'bg-amber-200',
            pillTextColor: 'text-amber-800',
        },
        examination: {
            Icon: Pencil,
            bgColor: 'bg-rose-100',
            textColor: 'text-rose-700',
            pillBgColor: 'bg-rose-200',
            pillTextColor: 'text-rose-800',
        },
    };
    const { Icon, bgColor, textColor, pillBgColor, pillTextColor } = theme[type];

    return (
        <div className="group p-4 mb-3 bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 ${bgColor} rounded-full`}>
                        <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <p className={`font-bold ${textColor}`}>{activity.courseCode}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pillBgColor} ${pillTextColor}`}>
                    {formatRemainingTime(activity.dateTime)}
                </span>
            </div>
            <p className="text-gray-800 font-medium my-1 ml-11">{activity.title}</p>
        </div>
    );
};

// --- MAIN COMPONENT ---

const UpcomingEvents = () => {
    const allActivities = sampleData;
    const events = allActivities.filter(act => act.type === 'event');
    const assignments = allActivities.filter(act => act.type === 'assignment');
    const examinations = allActivities.filter(act => act.type === 'examination');

    const groupedEvents = events.reduce((acc, event) => {
        const dateKey = new Date(event.dateTime).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, IActivity[]>);

    return (
        <div className="bg-emerald-50/50 py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Upcoming Events Column */}
                    <div className="lg:col-span-2">
                        <SectionTitle>Upcoming Events</SectionTitle>
                        {Object.entries(groupedEvents).map(([date, activities]) => (
                            <div key={date} className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 text-gray-600 pl-4 border-l-4 border-emerald-300">{date}</h3>
                                <div className="space-y-4">
                                    {activities.map(activity => <EventCard key={activity.id} activity={activity} />)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Assignments & Examinations Column */}
                    <div className="space-y-10">
                        <div>
                            <SectionTitle>Assignments</SectionTitle>
                            {assignments.map(activity => <TaskCard key={activity.id} activity={activity} type="assignment" />)}
                        </div>
                        <div>
                            <SectionTitle>Examinations</SectionTitle>
                            {examinations.map(activity => <TaskCard key={activity.id} activity={activity} type="examination" />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpcomingEvents;