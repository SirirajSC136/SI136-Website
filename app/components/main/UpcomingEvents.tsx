import { CalendarDays, ClipboardList, Pencil } from 'lucide-react';
import Link from 'next/link';
import { CalendarEvent } from '@/types';
import { GetNowTime } from '@/util/time';
import { AssignmentCard } from './upcomingEvents/AssignmentCard';

// --- NEW TYPES for data from your Google Sheets ---
type SheetAssignment = {
    'Work Name': string;
    'Deadline': string;
    'Subject': string;
    'Status': string;
    'รายละเอียดเพิ่มเติม': string;
};

type SheetExam = {
    'Upcoming exam': string;
    'Date': string;
    'Time': string;
};

type DeadlineResult = {
    text: string;
    isUrgent: boolean;
};

// --- UNCHANGED: This function remains the same ---
async function getGoogleCalendarEvents(): Promise<CalendarEvent[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events`, { next: { revalidate: 900 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.events || [];
    } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error);
        return [];
    }
}

// --- UPDATED: Fetches both assignments and examinations from the single API endpoint ---
async function getUpcomingData(): Promise<{ assignments: SheetAssignment[], examinations: SheetExam[] }> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/canvas/secondupcoming`, {
            next: { revalidate: 900 } // 15 minutes, matching API cache
        });
        if (!res.ok) return { assignments: [], examinations: [] };

        const data = await res.json();

        // Return both datasets from the structured response
        return {
            assignments: data.assignments?.data || [],
            examinations: data.examinations?.data || []
        };
    } catch (error) {
        console.error("Failed to fetch upcoming data:", error);
        return { assignments: [], examinations: [] };
    }
}

// --- NEW: Countdown function specifically for Examinations ---
const formatExamCountdown = (dateString: string, timeString: string) => {
    if (!dateString || !timeString) return "No date/time";

    const dateParts = dateString.split('/');
    // Get the start time (e.g., "11:00" from "11:00-11:30")
    const startTime = timeString.split('-')[0].trim();
    const timeParts = startTime.split(':');

    if (dateParts.length !== 3 || timeParts.length !== 2) return "Invalid format";

    const year = parseInt(dateParts[2]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[0]);
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    const target = new Date(year, month, day, hours, minutes);
    const diff = target.getTime() - GetNowTime();

    if (diff < 0) return "Past";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hoursLeft}h left`;
    if (hoursLeft > 0) return `${hoursLeft}h left`;
    return "Less than an hour left";
};


// --- UNCHANGED & NEW Components ---
const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2 className="text-2xl font-bold text-primary">{title}</h2>
    </div>
);

const EventCard = ({ event }: { event: CalendarEvent }) => (
    <div className="group flex items-start space-x-4 p-4 bg-background rounded-lg border border-border transition-shadow hover:shadow-md">
        <div className="flex-shrink-0 mt-1"><CalendarDays className="h-5 w-5 text-chart-2" /></div>
        <div className="flex-grow">
            <p className="text-sm font-semibold text-chart-2">{event.courseCode}</p>
            <p className="font-medium text-primary">{event.title}</p>
            <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-secondary">{new Date(event.startTime).toLocaleTimeString('en-US', { timeZone: "Asia/Bangkok", hour: '2-digit', minute: '2-digit' })} - {event.details}</span>
            </div>
        </div>
    </div>
);

// --- NEW: Component for displaying an examination ---
const ExaminationCard = ({ exam }: { exam: SheetExam }) => (
    <div className="group block p-4 mb-3 bg-background rounded-lg border border-border transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
                <Pencil className="h-5 w-5 mt-0.5 text-rose-700" />
                <div>
                    <p className="font-semibold text-rose-700">{exam['Upcoming exam']}</p>
                    <p className="text-xs text-secondary">{exam.Date} at {exam.Time}</p>
                </div>
            </div>
            <span className="text-xs text-primary font-medium flex-shrink-0 ml-2">
                {formatExamCountdown(exam.Date, exam.Time)}
            </span>
        </div>
    </div>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-10 px-4 bg-background rounded-lg border border-dashed">
        <p className="text-secondary">{message}</p>
    </div>
);

// --- MAIN COMPONENT: Logic updated to handle both assignments and examinations ---
const HomePageContent = async () => {
    const [allEvents, { assignments: allSheetAssignments, examinations }] = await Promise.all([
        getGoogleCalendarEvents(),
        getUpcomingData()
    ]);

    const assignments = allSheetAssignments.filter(item => item.Status !== 'Overdue');

    const sortedAssignments = assignments
        .map(a => {
            const parts = a.Deadline?.split('/');
            if (parts.length !== 3) return { ...a, timeLeft: Infinity }; // invalid date goes last
            const target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            const diff = target.getTime() - GetNowTime();
            return { ...a, timeLeft: diff };
        })
        .sort((a, b) => a.timeLeft - b.timeLeft);

    // Calendar event filtering logic remains the same
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const upcomingEvents = allEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate >= now && eventDate < threeDaysLater;
    });
    const groupedEvents = upcomingEvents.reduce((acc, event) => {
        const dateKey = new Date(event.startTime).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    return (
        <div className="bg-secondary-background py-12">
            <div className="container mx-auto px-4">
                <div className="text-4xl font-extrabold text-primary mb-10">Dashboard</div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-background p-6 rounded-xl border border-border shadow-sm ">
                        <SectionTitle icon={<CalendarDays className="text-emerald-500" />} title="Upcoming Events" />
                        {Object.keys(groupedEvents).length > 0 ? Object.entries(groupedEvents).map(([date, activities]) => (
                            <div key={date} className="mb-6">
                                <h3 className="text-md font-semibold mb-3 text-secondary">{date}</h3>
                                <div className="space-y-3">
                                    {activities.map((activity) => <EventCard key={activity.id} event={activity} />)}
                                </div>
                            </div>
                        )) : <EmptyState message="No upcoming events found in the calendar." />}
                    </div>

                    <div className="space-y-8">
                        <div className="bg-background p-6 rounded-xl border border-border shadow-sm">
                            <SectionTitle icon={<ClipboardList className="text-amber-500" />} title="Assignments" />
                            {sortedAssignments.length > 0
                                ? sortedAssignments.map((task, index) => <AssignmentCard key={index} assignment={task} />)
                                : <EmptyState message="No pending assignments." />}
                        </div>
                        <div className="bg-background p-6 rounded-xl border border-border shadow-sm">
                            <SectionTitle icon={<Pencil className="text-rose-500" />} title="Examinations" />
                            {/* Render the new ExaminationCard for each exam */}
                            {examinations.length > 0
                                ? examinations.map((exam, index) => <ExaminationCard key={index} exam={exam} />)
                                : <EmptyState message="No upcoming examinations." />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePageContent;