import { CalendarDays, ClipboardList, Pencil, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// --- UPDATED TYPE DEFINITIONS (Should be in @/types) ---
export interface CalendarEvent {
    id: string;
    courseCode: string;
    title: string;
    startTime: string;
    tag: string;
    details: string;
    subjectPageUrl: string; // This will now be ignored in favor of the generated URL
}

export interface Task {
    id: string;
    type: 'assignment' | 'examination';
    courseCode: string;
    title: string;
    deadline: string;
}

// --- API FETCHING LOGIC ---
async function getUpcomingEvents(): Promise<CalendarEvent[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events`, { next: { revalidate: 600 } });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return [];
    }
}

async function getUpcomingTasks(): Promise<Task[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tasks`, { next: { revalidate: 600 } });
        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return [];
    }
}


// --- HELPER FUNCTIONS ---
const formatRemainingTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return "Past";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} วัน ${hours} ชั่วโมง`;
    return `${hours} ชั่วโมง`;
};

// NEW: Helper function to extract course code and generate a URL
const generateUrlFromTitle = (title: string): string => {
    const topicMarker = '(Topic';
    const topicIndex = title.indexOf(topicMarker);

    // If the "(Topic" marker is not found, return a default link
    if (topicIndex === -1) {
        return '/academics';
    }

    // Extract the part of the string before the marker and trim whitespace
    const courseCode = title.substring(0, topicIndex).trim();

    // If the extracted code is empty, return the default link
    if (!courseCode) {
        return '/academics';
    }

    // Return the URL with the encoded course code
    return `/academics/${encodeURIComponent(courseCode)}`;
};


// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-slate-800 mb-6 pb-2 border-b-2 border-emerald-200">
        {children}
    </h2>
);

const EventCard = ({ event }: { event: CalendarEvent }) => {
    // UPDATED: Generate the navigation link directly from the event title
    const subjectPageUrl = generateUrlFromTitle(event.title);

    return (
        <div className="group flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex-shrink-0 mt-1 p-2 bg-emerald-100 rounded-full">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-grow">
                <p className="text-sm font-semibold text-emerald-700">
                    {`${event.courseCode} - ${new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${event.tag}`}
                </p>
                <p className="text-lg font-medium text-gray-800">{event.title}</p>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">{event.details}</span>
                    {/* UPDATED: Use the dynamically generated URL in the Link component */}
                    <Link href={subjectPageUrl} className="flex items-center text-sm text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View Subject <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

const TaskCard = ({ task }: { task: Task }) => {
    const isAssignment = task.type === 'assignment';
    const theme = {
        icon: isAssignment ? ClipboardList : Pencil,
        bgColor: isAssignment ? 'bg-amber-100' : 'bg-rose-100',
        textColor: isAssignment ? 'text-amber-700' : 'text-rose-700',
        pillBgColor: isAssignment ? 'bg-amber-200' : 'bg-rose-200',
        pillTextColor: isAssignment ? 'text-amber-800' : 'text-rose-800',
    };

    return (
        <div className="group p-4 mb-3 bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 ${theme.bgColor} rounded-full`}>
                        <theme.icon className={`h-5 w-5 ${theme.textColor}`} />
                    </div>
                    <p className={`font-bold ${theme.textColor}`}>{task.courseCode}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${theme.pillBgColor} ${theme.pillTextColor}`}>
                    {formatRemainingTime(task.deadline)}
                </span>
            </div>
            <p className="text-gray-800 font-medium my-1 ml-11">{task.title}</p>
        </div>
    );
};

// --- MAIN ASYNC COMPONENT ---

const HomePageContent = async () => {
    const [events, tasks] = await Promise.all([
        getUpcomingEvents(),
        getUpcomingTasks(),
    ]);

    const assignments = tasks.filter(t => t.type === 'assignment');
    const examinations = tasks.filter(t => t.type === 'examination');

    const groupedEvents = events.reduce((acc, event) => {
        const dateKey = new Date(event.startTime).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    return (
        <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Upcoming Events Column */}
                    <div className="lg:col-span-2">
                        <SectionTitle>Upcoming Events</SectionTitle>
                        {Object.entries(groupedEvents).map(([date, activities]) => (
                            <div key={date} className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 text-gray-600 pl-4 border-l-4 border-emerald-300">{date}</h3>
                                <div className="space-y-4">
                                    {activities.map((activity, index) => <EventCard key={activity.id || index} event={activity} />)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Assignments & Examinations Column */}
                    <div className="space-y-10">
                        <div>
                            <SectionTitle>Assignments</SectionTitle>
                            {assignments.map((task, index) => <TaskCard key={task.id || index} task={task} />)}
                        </div>
                        <div>
                            <SectionTitle>Examinations</SectionTitle>
                            {examinations.map((task, index) => <TaskCard key={task.id || index} task={task} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePageContent;