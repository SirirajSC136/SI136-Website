import { CalendarDays, ClipboardList, Pencil, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CalendarEvent, Task } from '@/types';

// CORRECTED: This function now correctly parses the JSON and returns the nested 'events' array.
async function getGoogleCalendarEvents(): Promise<CalendarEvent[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/events`, { next: { revalidate: 900 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.events || []; // Access the 'events' property from the response
    } catch (error) {
        console.error("Failed to fetch Google Calendar events:", error);
        return [];
    }
}

async function getCanvasTasks(): Promise<Task[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/canvas/upcoming`, { next: { revalidate: 900 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.tasks || [];
    } catch (error) {
        console.error("Failed to fetch Canvas tasks:", error);
        return [];
    }
}

const formatRemainingTime = (dateString: string) => {
  if (!dateString) return "No deadline";
  const target = new Date(
    new Date(dateString).toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );

  const diff = target.getTime() - now.getTime();
  if (diff < 0) return "Past";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return "Less than an hour left";
};

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2 className="text-2xl font-bold text-primary">{title}</h2>
    </div>
);

const EventCard = ({ event }: { event: CalendarEvent }) => (
    <div className="group flex items-start space-x-4 p-4 bg-background rounded-lg border border-border transition-shadow hover:shadow-md">
        <div className="flex-shrink-0 mt-1">
            <CalendarDays className="h-5 w-5 text-chart-2" />
        </div>
        <div className="flex-grow">
            <p className="text-sm font-semibold text-chart-2">{event.courseCode}</p>
            <p className="font-medium text-primary">{event.title}</p>
            <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-secondary">{new Date(event.startTime).toLocaleTimeString('en-US', { timeZone: "Asia/Bangkok", hour: '2-digit', minute: '2-digit' })} - {event.details}</span>
                {/* <Link href={event.subjectPageUrl} className="flex items-center text-sm text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ArrowRight className="h-4 w-4 ml-1" />
                </Link> */}
            </div>
        </div>
    </div>
);

const TaskCard = ({ task }: { task: Task }) => {
    const isAssignment = task.type === 'assignment';
    const theme = {
        icon: isAssignment ? ClipboardList : Pencil,
        textColor: isAssignment ? 'text-amber-700' : 'text-rose-700',
    };

    return (
        <Link href={`/academics/${task.subjectId}`} className="group block p-4 mb-3 bg-background rounded-lg border border-border transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                    <theme.icon className={`h-5 w-5 mt-0.5 ${theme.textColor}`} />
                    <div>
                        <p className={`font-semibold ${theme.textColor}`}>{task.courseCode}</p>
                        <p className="text-xs text-secondary">{task.subjectTitle}</p>
                        <p className="text-primary font-medium mt-1">{task.title}</p>
                    </div>
                </div>
                <span className="text-xs text-primary font-medium flex-shrink-0 ml-2">
                    {formatRemainingTime(task.deadline)}
                </span>
            </div>
        </Link>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-10 px-4 bg-background rounded-lg border border-dashed">
        <p className="text-secondary">{message}</p>
    </div>
);

const HomePageContent = async () => {
    const [allEvents, tasks] = await Promise.all([getGoogleCalendarEvents(), getCanvasTasks()]);
    const assignments = tasks.filter(t => t.type === 'assignment');
    const examinations = tasks.filter(t => t.type === 'examination');

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // End of the 3‑day window
    const DaysLater = new Date(now);
    DaysLater.setDate(DaysLater.getDate() + 3);

    // Filter events: today through 2 days ahead
    const upcomingEvents = allEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= now && eventDate < DaysLater;
    });

    // CORRECTED: Group the filtered upcoming events, not all events.
    const groupedEvents = upcomingEvents.reduce((acc, event) => {
        const dateKey = new Date(event.startTime).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    return (
        <div className="bg-secondary-background py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-extrabold text-primary mb-10">Dashboard</h1>
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
                            {assignments.length > 0 ? assignments.map((task) => <TaskCard key={task.id} task={task} />) : <EmptyState message="No pending assignments." />}
                        </div>
                        <div className="bg-background p-6 rounded-xl border border-border shadow-sm">
                            <SectionTitle icon={<Pencil className="text-rose-500" />} title="Examinations" />
                            {examinations.length > 0 ? examinations.map((task) => <TaskCard key={task.id} task={task} />) : <EmptyState message="No upcoming examinations." />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePageContent;