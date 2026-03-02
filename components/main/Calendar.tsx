"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { CalendarEvent } from "@/types";
import {
	BANGKOK_TIME_ZONE,
	formatBangkokDateKey,
	getBangkokDateKey,
	sortEventsByStartTime,
} from "@/lib/server/domains/events/normalizers";
import styles from "./Calendar.module.css";

const MAX_VISIBLE_EVENTS_PER_DAY = 2;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COURSE_COLORS: Record<string, string> = {
	"SIID 143": "var(--siid-143)",
	"SIID 144": "var(--siid-144)",
	"SIID 145": "var(--siid-145)",
	"SIID 146": "var(--siid-146)",
	"SIID 147": "var(--siid-147)",
	"SIID 148": "var(--siid-148)",
	ITCS: "var(--itcs)",
	EGID: "var(--egid)",
	SCID: "var(--scid)",
	default: "linear-gradient(to right, var(--accent), var(--accent))",
};

type MonthContext = {
	label: string;
	monthPrefix: string;
	gridStartKey: string;
	gridEndKey: string;
	dayKeys: string[];
};

function buildMonthContext(currentMonth: Date): MonthContext {
	const monthStart = DateTime.fromJSDate(currentMonth, {
		zone: BANGKOK_TIME_ZONE,
	}).startOf("month");
	const monthEnd = monthStart.endOf("month").startOf("day");

	const startOffset = monthStart.weekday % 7;
	const endOffset = 6 - (monthEnd.weekday % 7);

	const gridStart = monthStart.minus({ days: startOffset });
	const gridEnd = monthEnd.plus({ days: endOffset });

	const dayKeys: string[] = [];
	for (
		let cursor = gridStart;
		cursor.toMillis() <= gridEnd.toMillis();
		cursor = cursor.plus({ days: 1 })
	) {
		dayKeys.push(cursor.toFormat("yyyy-LL-dd"));
	}

	return {
		label: monthStart.setLocale("en").toFormat("LLLL yyyy"),
		monthPrefix: monthStart.toFormat("yyyy-LL"),
		gridStartKey: gridStart.toFormat("yyyy-LL-dd"),
		gridEndKey: gridEnd.toFormat("yyyy-LL-dd"),
		dayKeys,
	};
}

function splitTitle(title: string) {
	const match = title.match(/^(SIID\s?\d+|EGID\s?\d+|SCID\s?\d+|ITCS\s?\d+)/i);
	if (!match) return { subject: title.trim(), topic: "" };

	const subject = match[0].replace(/\s+/, " ").trim();
	const topic = title.replace(match[0], "").trim();
	return { subject, topic };
}

function formatTime(iso?: string): string {
	if (!iso) return "";
	const dt = DateTime.fromISO(iso, { setZone: true });
	if (!dt.isValid) return "";
	return dt.setZone(BANGKOK_TIME_ZONE).toFormat("HH:mm");
}

function formatEventTimeRange(event: CalendarEvent): string {
	if (event.isAllDay) return "All day";
	const start = formatTime(event.startTime);
	const end = formatTime(event.endTime);
	if (!start && !end) return "";
	return end ? `${start} - ${end}` : start;
}

const Calendar: React.FC = () => {
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
	const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const monthContext = useMemo(() => buildMonthContext(currentMonth), [currentMonth]);

	useEffect(() => {
		const controller = new AbortController();
		const params = new URLSearchParams({
			start: monthContext.gridStartKey,
			end: monthContext.gridEndKey,
		});

		setIsLoading(true);
		setErrorMessage(null);

		fetch(`/api/events?${params.toString()}`, { signal: controller.signal })
			.then(async (response) => {
				const payload = await response.json().catch(() => ({}));

				if (!response.ok) {
					throw new Error(payload?.error || "Failed to load calendar events.");
				}

				return payload;
			})
			.then((payload) => {
				setEvents(Array.isArray(payload.events) ? payload.events : []);
			})
			.catch((error: unknown) => {
				if (error instanceof Error && error.name === "AbortError") return;
				setEvents([]);
				setErrorMessage(
					error instanceof Error
						? error.message
						: "Failed to load calendar events."
				);
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			});

		return () => controller.abort();
	}, [monthContext.gridEndKey, monthContext.gridStartKey]);

	useEffect(() => {
		setExpandedDayKey(null);
		setSelectedEvent(null);
	}, [monthContext.monthPrefix]);

	const groupedEvents = useMemo(() => {
		const grouped: Record<string, CalendarEvent[]> = {};

		for (const event of sortEventsByStartTime(events)) {
			const dayKey = getBangkokDateKey(event.startTime);
			if (!dayKey) continue;
			if (!grouped[dayKey]) grouped[dayKey] = [];
			grouped[dayKey].push(event);
		}

		return grouped;
	}, [events]);

	const todayKey = getBangkokDateKey(new Date());

	const hasEventsInMonth = useMemo(() => {
		return events.some((event) =>
			getBangkokDateKey(event.startTime).startsWith(monthContext.monthPrefix)
		);
	}, [events, monthContext.monthPrefix]);

	const expandedDayEvents = useMemo(() => {
		if (!expandedDayKey) return [];
		return sortEventsByStartTime(groupedEvents[expandedDayKey] || []);
	}, [expandedDayKey, groupedEvents]);

	function getCourseColor(courseCode: string) {
		if (COURSE_COLORS[courseCode]) return COURSE_COLORS[courseCode];
		const prefix = courseCode.split(" ")[0];
		return COURSE_COLORS[prefix] || COURSE_COLORS.default;
	}

	return (
		<div className="w-full max-w-6xl mx-auto p-4">
			<div className="flex items-center justify-between mb-3 gap-3">
				<button
					type="button"
					aria-label="Show previous month"
					onClick={() =>
						setCurrentMonth(
							new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
						)
					}
					className="px-3 py-1 rounded bg-secondary-foreground text-primary-foreground">
					Prev
				</button>

				<div className="text-2xl font-bold text-center">{monthContext.label}</div>

				<button
					type="button"
					aria-label="Show next month"
					onClick={() =>
						setCurrentMonth(
							new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
						)
					}
					className="px-3 py-1 rounded bg-secondary-foreground text-primary-foreground">
					Next
				</button>
			</div>

			{isLoading && (
				<p className="mb-3 text-sm text-muted-foreground">Loading calendar events...</p>
			)}

			{errorMessage && <p className="mb-3 text-sm text-red-600">{errorMessage}</p>}

			{!isLoading && !errorMessage && !hasEventsInMonth && (
				<p className="mb-3 text-sm text-muted-foreground">
					No events found for this month.
				</p>
			)}

			<div className={styles.calendarWrapper}>
				<div className={`${styles.calendarGrid} text-center font-semibold mb-2`}>
					{WEEKDAY_LABELS.map((label) => (
						<div key={label}>{label}</div>
					))}
				</div>

				<div className={`${styles.calendarGrid} border-t border-l rounded-lg shadow-md`}>
					{monthContext.dayKeys.map((dayKey) => {
						const inMonth = dayKey.startsWith(monthContext.monthPrefix);
						const dayEvents = groupedEvents[dayKey] || [];
						const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS_PER_DAY);
						const hiddenCount = Math.max(
							dayEvents.length - MAX_VISIBLE_EVENTS_PER_DAY,
							0
						);
						const isToday = dayKey === todayKey;
						const dayNumber = Number(dayKey.slice(-2));

						return (
							<div
								key={dayKey}
								className={`${styles.calendarCell} border-b border-r transition-colors duration-200 ${inMonth
									? "bg-background hover:bg-accent/10"
									: "bg-muted text-muted-foreground"
									}`}>
								<div
									className={`text-xs absolute top-1 right-1 font-semibold ${isToday && inMonth
										? "px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-purple-500 text-primary-foreground shadow"
										: "text-muted-foreground"
										}`}>
									{dayNumber}
								</div>

								<div className={styles.dayEvents}>
									{visibleEvents.map((event) => {
										const { subject, topic } = splitTitle(event.title);
										const chipLabel = topic ? `${subject} ${topic}` : subject;
										const chipClass =
											event.category === "summative"
												? styles.summativeEvent
												: event.category === "exam"
													? styles.examEvent
													: "text-white";
										const usesCourseColor =
											event.category === "class" || event.category === "other";

										return (
											<button
												key={event.id}
												type="button"
												onClick={() => setSelectedEvent(event)}
												className={`${styles.eventChip} ${chipClass}`}
												style={
													usesCourseColor
														? { background: getCourseColor(event.courseCode) }
														: undefined
												}>
												<span className="block truncate">{chipLabel}</span>
											</button>
										);
									})}

									{hiddenCount > 0 && (
										<button
											type="button"
											className={styles.moreButton}
											aria-label={`Show ${hiddenCount} more events on ${dayKey}`}
											onClick={() => setExpandedDayKey(dayKey)}>
											+{hiddenCount} more
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{expandedDayKey && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
					<div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl p-6">
						<button
							type="button"
							aria-label="Close day events dialog"
							onClick={() => setExpandedDayKey(null)}
							className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition">
							x
						</button>
						<h2 className="text-xl font-bold mb-1">
							{formatBangkokDateKey(expandedDayKey, "en-US", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</h2>
						<p className="text-sm text-muted-foreground mb-4">
							All events for this day
						</p>

						<div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
							{expandedDayEvents.map((event) => (
								<button
									key={event.id}
									type="button"
									onClick={() => {
										setExpandedDayKey(null);
										setSelectedEvent(event);
									}}
									className="w-full border border-border rounded-lg p-3 text-left hover:bg-muted transition-colors">
									<div className="flex items-center justify-between gap-3">
										<p className="font-medium truncate">{event.title}</p>
										<p className="text-xs text-muted-foreground shrink-0">
											{formatEventTimeRange(event)}
										</p>
									</div>
									<p className="text-xs text-muted-foreground mt-1 truncate">
										{event.courseCode || "General"}
									</p>
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			{selectedEvent && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="relative bg-card/95 border border-white/20 rounded-xl shadow-2xl w-full sm:w-[85%] md:max-w-lg p-6">
						<button
							type="button"
							aria-label="Close event details dialog"
							onClick={() => setSelectedEvent(null)}
							className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition">
							x
						</button>

						<h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
							{selectedEvent.title}
						</h2>
						<p className="text-sm text-muted-foreground mb-4">
							{formatBangkokDateKey(getBangkokDateKey(selectedEvent.startTime), "en-US", {
								weekday: "long",
								day: "numeric",
								month: "long",
								year: "numeric",
							})}
						</p>

						<div className="flex flex-wrap gap-2 mb-4">
							{selectedEvent.courseCode && (
								<span
									className="px-2 py-0.5 text-xs rounded-full font-medium text-white"
									style={{ background: getCourseColor(selectedEvent.courseCode) }}>
									{selectedEvent.courseCode}
								</span>
							)}
							<span className="px-2 py-0.5 text-xs rounded-full font-medium bg-muted text-foreground capitalize">
								{selectedEvent.category}
							</span>
						</div>

						<p className="text-sm mb-2">{formatEventTimeRange(selectedEvent)}</p>
						{selectedEvent.location && (
							<p className="text-sm mb-2">Location: {selectedEvent.location}</p>
						)}
						{selectedEvent.details && (
							<p className="text-sm text-muted-foreground">{selectedEvent.details}</p>
						)}

						{selectedEvent.htmlLink && (
							<button
								type="button"
								onClick={() =>
									window.open(
										selectedEvent.htmlLink,
										"_blank",
										"noopener,noreferrer"
									)
								}
								className="mt-4 px-3 py-1.5 rounded bg-secondary-foreground text-primary-foreground text-sm">
								Open in Google Calendar
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default Calendar;
