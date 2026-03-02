import { CalendarDays, ClipboardList, Pencil } from "lucide-react";
import { DateTime } from "luxon";
import { CalendarEvent } from "@/types";
import {
	addDaysToBangkokDateKey,
	BANGKOK_TIME_ZONE,
	formatBangkokDateKey,
	getBangkokDateKey,
	sortEventsByStartTime,
} from "@/lib/server/domains/events/normalizers";
import { GetNowTime } from "@/util/time";
import { AssignmentCard } from "./upcomingEvents/AssignmentCard";

type SheetAssignment = {
	"Work Name": string;
	Deadline: string;
	Subject: string;
	Status: string;
	[key: string]: string;
};

type SheetExam = {
	"Upcoming exam": string;
	Date: string;
	Time: string;
};

const FETCH_TIMEOUT_MS = 12000;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

async function getGoogleCalendarEvents(
	startDateKey: string,
	endDateKey: string
): Promise<CalendarEvent[]> {
	if (!APP_BASE_URL) {
		console.warn("NEXT_PUBLIC_APP_URL is missing; skipping calendar fetch.");
		return [];
	}

	try {
		const params = new URLSearchParams({ start: startDateKey, end: endDateKey });
		const res = await fetch(
			`${APP_BASE_URL}/api/events?${params.toString()}`,
			{ next: { revalidate: 900 }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
		);
		if (!res.ok) return [];
		const data = await res.json();
		return sortEventsByStartTime(Array.isArray(data.events) ? data.events : []);
	} catch (error) {
		console.error("Failed to fetch Google Calendar events:", error);
		return [];
	}
}

async function getUpcomingData(): Promise<{
	assignments: SheetAssignment[];
	examinations: SheetExam[];
}> {
	if (!APP_BASE_URL) {
		console.warn("NEXT_PUBLIC_APP_URL is missing; skipping upcoming data fetch.");
		return { assignments: [], examinations: [] };
	}

	try {
		const res = await fetch(
			`${APP_BASE_URL}/api/canvas/secondupcoming`,
			{
				next: { revalidate: 900 },
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			}
		);
		if (!res.ok) return { assignments: [], examinations: [] };

		const data = await res.json();
		return {
			assignments: data.assignments?.data || [],
			examinations: data.examinations?.data || [],
		};
	} catch (error) {
		console.error("Failed to fetch upcoming data:", error);
		return { assignments: [], examinations: [] };
	}
}

const formatExamCountdown = (dateString: string, timeString: string) => {
	if (!dateString || !timeString) return "No date/time";

	const dateParts = dateString.split("/");
	const startTime = timeString.split("-")[0].trim();
	const timeParts = startTime.split(":");

	if (dateParts.length !== 3 || timeParts.length !== 2) return "Invalid format";

	const year = parseInt(dateParts[2], 10);
	const month = parseInt(dateParts[1], 10) - 1;
	const day = parseInt(dateParts[0], 10);
	const hours = parseInt(timeParts[0], 10);
	const minutes = parseInt(timeParts[1], 10);

	const target = new Date(year, month, day, hours, minutes);
	const diff = target.getTime() - GetNowTime();

	if (diff < 0) return "Past";

	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

	if (days > 0) return `${days}d ${hoursLeft}h left`;
	if (hoursLeft > 0) return `${hoursLeft}h left`;
	return "Less than an hour left";
};

const formatClock = (iso?: string) => {
	if (!iso) return "";
	const dt = DateTime.fromISO(iso, { setZone: true });
	if (!dt.isValid) return "";
	return dt.setZone(BANGKOK_TIME_ZONE).toFormat("HH:mm");
};

const formatEventTimeRange = (event: CalendarEvent) => {
	if (event.isAllDay) return "All day";
	const start = formatClock(event.startTime);
	const end = formatClock(event.endTime);
	if (!start && !end) return "";
	return end ? `${start} - ${end}` : start;
};

const SectionTitle = ({
	icon,
	title,
}: {
	icon: React.ReactNode;
	title: string;
}) => (
	<div className="flex items-center gap-3 mb-6">
		{icon}
		<h2 className="text-2xl font-bold text-primary">{title}</h2>
	</div>
);

const EventCard = ({ event }: { event: CalendarEvent }) => {
	const timeRange = formatEventTimeRange(event);

	return (
		<div className="group flex items-start space-x-4 break-all p-4 bg-background rounded-lg border border-border transition-shadow hover:shadow-md">
			<div className="flex-shrink-0 mt-1">
				<CalendarDays className="h-5 w-5 text-chart-2" />
			</div>
			<div className="flex-grow">
				<p className="text-sm font-semibold text-chart-2">{event.courseCode}</p>
				<p className="font-medium text-primary">{event.title}</p>
				<div className="flex items-center justify-between mt-2">
					<span className="text-sm text-secondary">
						{timeRange}
						{event.location ? ` - ${event.location}` : ""}
					</span>
				</div>
				{event.details && (
					<p className="text-xs text-muted-foreground mt-1 break-normal ">
						{event.details}
					</p>
				)}
			</div>
		</div>
	);
};

const ExaminationCard = ({ exam }: { exam: SheetExam }) => (
	<div className="group block p-4 mb-3 bg-background rounded-lg border border-border transition-shadow hover:shadow-md">
		<div className="flex items-start justify-between">
			<div className="flex items-start space-x-3">
				<Pencil className="h-5 w-5 mt-0.5 text-rose-700" />
				<div>
					<p className="font-semibold text-rose-700">{exam["Upcoming exam"]}</p>
					<p className="text-xs text-secondary">
						{exam.Date} at {exam.Time}
					</p>
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

const HomePageContent = async () => {
	const todayKey = getBangkokDateKey(new Date());
	const endKey = addDaysToBangkokDateKey(todayKey, 2);

	const [allEvents, { assignments: allSheetAssignments, examinations }] =
		await Promise.all([getGoogleCalendarEvents(todayKey, endKey), getUpcomingData()]);

	const assignments = allSheetAssignments.filter(
		(item) => item.Status !== "Overdue"
	);

	const sortedAssignments = assignments
		.map((assignment) => {
			const parts = assignment.Deadline?.split("/");
			if (parts.length !== 3) return { assignment, timeLeft: Infinity };

			const target = new Date(
				parseInt(parts[2], 10),
				parseInt(parts[1], 10) - 1,
				parseInt(parts[0], 10)
			);
			const diff = target.getTime() - GetNowTime();
			return { assignment, timeLeft: diff };
		})
		.sort((a, b) => a.timeLeft - b.timeLeft)
		.map((item) => item.assignment);

	const groupedEvents = allEvents.reduce((acc, event) => {
		const dateKey = getBangkokDateKey(event.startTime);
		if (!dateKey) return acc;
		if (!acc[dateKey]) acc[dateKey] = [];
		acc[dateKey].push(event);
		return acc;
	}, {} as Record<string, CalendarEvent[]>);

	const sortedGroupedEvents = Object.entries(groupedEvents).sort(([a], [b]) =>
		a.localeCompare(b)
	);

	return (
		<div className="bg-secondary-background py-12">
			<div className="container mx-auto px-4">
				<div className="text-4xl font-extrabold text-primary mb-10">Dashboard</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
					<div className="lg:col-span-2 bg-background p-6 rounded-xl border border-border shadow-sm ">
						<SectionTitle
							icon={<CalendarDays className="text-emerald-500" />}
							title="Upcoming Events"
						/>
						{sortedGroupedEvents.length > 0 ? (
							sortedGroupedEvents.map(([dateKey, activities]) => (
								<div key={dateKey} className="mb-6">
									<h3 className="text-md font-semibold mb-3 text-secondary">
										{formatBangkokDateKey(dateKey, "th-TH", {
											weekday: "long",
											day: "numeric",
											month: "long",
										})}
									</h3>
									<div className="space-y-3">
										{sortEventsByStartTime(activities).map((activity) => (
											<EventCard key={activity.id} event={activity} />
										))}
									</div>
								</div>
							))
						) : (
							<EmptyState message="No upcoming events found in the calendar." />
						)}
					</div>

					<div className="space-y-8">
						<div className="bg-background p-6 rounded-xl border border-border shadow-sm">
							<SectionTitle
								icon={<ClipboardList className="text-amber-500" />}
								title="Assignments"
							/>
							{sortedAssignments.length > 0 ? (
								sortedAssignments.map((task, index) => (
									<AssignmentCard key={index} assignment={task} />
								))
							) : (
								<EmptyState message="No pending assignments." />
							)}
						</div>
						<div className="bg-background p-6 rounded-xl border border-border shadow-sm">
							<SectionTitle
								icon={<Pencil className="text-rose-500" />}
								title="Examinations"
							/>
							{examinations.length > 0 ? (
								examinations.map((exam, index) => (
									<ExaminationCard key={index} exam={exam} />
								))
							) : (
								<EmptyState message="No upcoming examinations." />
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default HomePageContent;
