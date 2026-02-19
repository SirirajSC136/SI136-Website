"use client";

import React, { useState, useEffect } from "react";
import { CalendarEvent } from "@/types";
import styles from "./Calendar.module.css";

const Calendar: React.FC = () => {
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
	const [isClosing, setIsClosing] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [events, setEvents] = useState<CalendarEvent[]>([]);

	useEffect(() => {
		fetch("/api/events")
			.then((r) => r.json())
			.then((data) => {
				const all: CalendarEvent[] = data.events || [];
				setEvents(all.filter((ev) => ev.title !== "สอบปลายภาค"));
			})
			.catch(() => { });
	}, []);

	// Build month bounds in UTC to avoid local TZ drift
	const startOfMonthUTC = new Date(
		Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
	);
	const endOfMonthUTC = new Date(
		Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
	);

	// Calculate week boundaries (Sunday to Saturday) in UTC
	const startDateUTC = new Date(startOfMonthUTC);
	startDateUTC.setUTCDate(startDateUTC.getUTCDate() - startDateUTC.getUTCDay());

	const endDateUTC = new Date(endOfMonthUTC);
	endDateUTC.setUTCDate(endDateUTC.getUTCDate() + (6 - endDateUTC.getUTCDay()));

	const days: Date[] = [];
	for (
		let d = new Date(startDateUTC);
		d <= endDateUTC;
		d.setUTCDate(d.getUTCDate() + 1)
	) {
		days.push(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
	}

	// Helper: pad to 2 digits
	const pad2 = (n: number) => String(n).padStart(2, "0");

	// Helper: build a day key from a startTime string using Bangkok timezone
	const toDayKeyFromString = (startTime: string): string => {
		if (!startTime) return "";
		// For ISO strings and +07:00 strings, parse as Date and use Bangkok local time
		const d = new Date(startTime);
		if (isNaN(d.getTime())) return "";
		// Use Intl to get the Bangkok date components
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Bangkok",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(d);
		const map: Record<string, string> = {};
		parts.forEach((p) => { map[p.type] = p.value; });
		return `${map.year}-${map.month}-${map.day}`;
	};

	// Build day key for a calendar Date cell (local)
	const toDayKey = (d: Date) =>
		`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

	// Compute today's key once (normalized to midnight)
	const todayKey = toDayKey(new Date());

	// Group events by Bangkok-local day key
	const grouped = events.reduce((acc: Record<string, CalendarEvent[]>, ev) => {
		const key = toDayKeyFromString(ev.startTime);
		if (!key) return acc;
		acc[key] = acc[key] || [];
		acc[key].push(ev);
		return acc;
	}, {});

	// Replace isToday with key comparison, plus in-month constraint
	const isToday = (date: Date): boolean => toDayKey(date) === todayKey;

	const monthLabel = currentMonth.toLocaleDateString("en-US", {
		month: "long",
		year: "numeric",
	});

	const courseColors: Record<string, string> = {
		"SIID 143": "var(--siid-143)",
		"SIID 144": "var(--siid-144)",
		"SIID 145": "var(--siid-145)",
		"SIID 146": "var(--siid-146)",
		"SIID 147": "var(--siid-147)",
		"SIID 148": "var(--siid-148)",
		ITCS: "var(--itcs)",
		EGID: "var(--egid)",
		SCID: "var(--scid)",
		สอบปลายภาค: "exam-event",
		default: "linear-gradient(to right, var(--accent), var(--accent))",
	};

	function getCourseColor(ev: CalendarEvent) {
		const code = ev.courseCode || ev.title;
		if (!code) return courseColors.default;

		if (courseColors[code]) {
			return courseColors[code];
		}

		const prefix = code.split(" ")[0];
		return courseColors[prefix] || courseColors.default;
	}

	function splitTitle(title: string) {
		const codeMatch = title.match(
			/^(SIID\s?\d+|EGID\s?\d+|SCID\s?\d+|ITCS\s?\d+)/i
		);

		let subject = "";
		let topic = "";

		if (codeMatch) {
			subject = codeMatch[0].replace(/\s+/, " ").trim();
			topic = title.replace(codeMatch[0], "").trim();
		} else {
			const idx = title.indexOf("(");
			if (idx === -1) {
				subject = title.trim();
			} else {
				subject = title.slice(0, idx).trim();
				topic = title.slice(idx).trim();
			}
		}

		return { subject, topic };
	}

	function closeModal() {
		setIsClosing(true);
		setTimeout(() => {
			setSelectedEvent(null);
			setIsClosing(false);
		}, 50);
	}

	return (
		<div className="w-full max-w-6xl mx-auto p-4">
			{/* Header */}
			<div className="flex items-center justify-between mb-3">
				{/* Centered month label */}
				<div className="flex-1 text-center">
					<div className="text-2xl font-bold">{monthLabel}</div>
				</div>

				{/* Buttons aligned together on the right */}
				<div className="flex gap-2">
					<button
						onClick={() =>
							setCurrentMonth(
								new Date(
									currentMonth.getFullYear(),
									currentMonth.getMonth() - 1,
									1
								)
							)
						}
						className="px-2 py-1 rounded bg-secondary-foreground text-primary-foreground">
						←
					</button>
					<button
						onClick={() =>
							setCurrentMonth(
								new Date(
									currentMonth.getFullYear(),
									currentMonth.getMonth() + 1,
									1
								)
							)
						}
						className="px-2 py-1 rounded bg-secondary-foreground text-primary-foreground">
						→
					</button>
				</div>
			</div>

			{/* Weekday headers */}
			<div className="grid grid-cols-7 text-center font-semibold mb-2">
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
					<div key={d}>{d}</div>
				))}
			</div>

			{/* Month grid with horizontal scroll wrapper */}
			<div className={styles.calendarWrapper}>
				<div className="grid grid-cols-7 border-t border-l rounded-lg overflow-visible shadow-md">
					{days.map((day, idx) => {
						const key = [
							day.getFullYear(),
							String(day.getMonth() + 1).padStart(2, "0"),
							String(day.getDate()).padStart(2, "0"),
						].join("-");
						const inMonth = day.getMonth() === currentMonth.getMonth();
						const dayEvents = grouped[key] || [];
						return (
							<div
								key={idx}
								className={`h-32 border-b border-r p-1 relative overflow-visible transition-all duration-200 
                                ${inMonth
										? "bg-background hover:bg-accent/10"
										: "bg-muted text-muted-foreground"
									}
                            `}>
								<div
									className={`text-xs absolute top-1 right-1 font-semibold
									${isToday(day) && inMonth
											? "px-2 py-0.5 rounded-full bg-gradient-to-r from-primary to-purple-500 text-primary-foreground shadow"
											: "text-muted-foreground"
										}`}>
									{day.getDate()}
								</div>

								<div className="mt-5 flex flex-col gap-1 relative z-2">
									{dayEvents.map((ev, i) => {
										const { subject, topic } = splitTitle(ev.title);

										return (
											<button
												key={i}
												onClick={() => setSelectedEvent(ev)}
												className={`relative z-0 px-2 py-0.5 rounded-full font-medium transition-transform duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-lg ${ev.title.includes("Sum")
													? styles.summativeEvent
													: ev.title.includes("สอบปลายภาค") ||
														ev.title.includes("สอบกลางภาค")
														? styles.examEvent
														: "text-white"
													}`}
												style={
													ev.title.includes("Sum")
														? {}
														: ev.title.includes("สอบปลายภาค") ||
															ev.title.includes("สอบกลางภาค")
															? {}
															: { background: getCourseColor(ev) }
												}>
												<span className={styles.eventFullTitle}>{subject}</span>
												<span className={styles.eventShortCode}>
													{subject.slice(0, 4)}
												</span>

												{topic && (
													<span
														className={`${styles.eventTopic} ml-1 max-[1148px]:hidden`}>
														{topic}
													</span>
												)}
											</button>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>

				{/* Modal */}
				{selectedEvent && (
					<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
						<div
							className={`relative bg-card/80 backdrop-blur-md border border-white/20 
							rounded-xl shadow-2xl w-[90%] sm:w-[80%] md:max-w-lg p-6 
							${isClosing ? "animate-out fade-out zoom-out" : "animate-in fade-in zoom-in"}`}>
							<button
								onClick={closeModal}
								className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition">
								✕
							</button>

							<h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
								{selectedEvent.title}
							</h2>

							<div className="flex flex-wrap gap-2 mb-4">
								{selectedEvent.courseCode && (
									<span
										className={`px-2 py-0.5 text-xs rounded-full font-medium text-white`}
										style={{ background: getCourseColor(selectedEvent) }}>
										{selectedEvent.courseCode}
									</span>
								)}
								{selectedEvent.title.includes("Sum") && (
									<span
										className={`${styles.summativeEvent} px-2 py-0.5 text-xs rounded-full`}>
										{selectedEvent.title}
									</span>
								)}
							</div>

							<p className="text-sm mb-2">
								⏰{" "}
								{new Date(selectedEvent.startTime).toLocaleTimeString("th-TH", {
									timeZone: "Asia/Bangkok",
									hour: "2-digit",
									minute: "2-digit",
								})}{" "}
								–{" "}
								{selectedEvent.endTime
									? new Date(selectedEvent.endTime).toLocaleTimeString("th-TH", {
										timeZone: "Asia/Bangkok",
										hour: "2-digit",
										minute: "2-digit",
									})
									: ""}
							</p>
							{selectedEvent.location && (
								<p className="text-sm mb-2">📍 {selectedEvent.location}</p>
							)}
							{selectedEvent.details && (
								<p className="text-sm text-muted-foreground">
									{selectedEvent.details}
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Calendar;
