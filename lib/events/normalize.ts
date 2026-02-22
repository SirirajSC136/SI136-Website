import { DateTime } from "luxon";
import type { calendar_v3 } from "googleapis";
import type { CalendarEvent } from "@/types";

export const BANGKOK_TIME_ZONE = "Asia/Bangkok";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COURSE_CODE_PATTERN = /^(SIID\s?\d+|EGID\s?\d+|SCID\s?\d+|ITCS\s?\d+)/i;
const EXAM_PATTERNS = [
	/\u0e2a\u0e2d\u0e1a\u0e1b\u0e25\u0e32\u0e22\u0e20\u0e32\u0e04/i,
	/\u0e2a\u0e2d\u0e1a\u0e01\u0e25\u0e32\u0e07\u0e20\u0e32\u0e04/i,
	/\bmidterm\b/i,
	/\bfinal\b/i,
	/\bexam(?:ination)?s?\b/i,
];
const SUMMATIVE_PATTERNS = [/\bsummative\b/i, /\bsum\b/i];

function toBangkokDateTime(value: string | Date): DateTime {
	if (value instanceof Date) {
		return DateTime.fromJSDate(value).setZone(BANGKOK_TIME_ZONE);
	}

	if (DATE_KEY_PATTERN.test(value)) {
		return DateTime.fromISO(value, { zone: BANGKOK_TIME_ZONE });
	}

	return DateTime.fromISO(value, { setZone: true }).setZone(BANGKOK_TIME_ZONE);
}

function normalizeGoogleDate(
	dateTimeValue?: string | null,
	dateValue?: string | null
): string {
	if (dateTimeValue) {
		const dt = DateTime.fromISO(dateTimeValue, { setZone: true });
		return dt.isValid ? (dt.toUTC().toISO() ?? "") : "";
	}

	if (dateValue) {
		const dt = DateTime.fromISO(dateValue, { zone: BANGKOK_TIME_ZONE }).startOf("day");
		return dt.isValid ? (dt.toUTC().toISO() ?? "") : "";
	}

	return "";
}

function stripHtml(html?: string | null): string {
	return html ? html.replace(/<[^>]*>/g, "").trim() : "";
}

function toSortableMillis(isoValue: string): number {
	const dt = DateTime.fromISO(isoValue, { setZone: true });
	return dt.isValid ? dt.toMillis() : Number.MAX_SAFE_INTEGER;
}

export function isValidDateKey(value: string): boolean {
	return DATE_KEY_PATTERN.test(value);
}

export function getBangkokDateKey(value: string | Date): string {
	const dt = toBangkokDateTime(value);
	return dt.isValid ? dt.toFormat("yyyy-LL-dd") : "";
}

export function addDaysToBangkokDateKey(dateKey: string, days: number): string {
	const dt = DateTime.fromISO(dateKey, { zone: BANGKOK_TIME_ZONE }).plus({ days });
	return dt.isValid ? dt.toFormat("yyyy-LL-dd") : dateKey;
}

export function formatBangkokDateKey(
	dateKey: string,
	locale = "th-TH",
	options: Intl.DateTimeFormatOptions = {
		weekday: "long",
		day: "numeric",
		month: "long",
	}
): string {
	const dt = DateTime.fromISO(dateKey, { zone: BANGKOK_TIME_ZONE });
	if (!dt.isValid) return dateKey;
	return dt.setLocale(locale).toLocaleString(options);
}

export function getBangkokUtcRange(
	startDateKey: string,
	endDateKey: string
): { timeMin: string; timeMax: string } {
	const start = DateTime.fromISO(startDateKey, { zone: BANGKOK_TIME_ZONE }).startOf(
		"day"
	);
	const endExclusive = DateTime.fromISO(endDateKey, {
		zone: BANGKOK_TIME_ZONE,
	})
		.plus({ days: 1 })
		.startOf("day");

	if (!start.isValid || !endExclusive.isValid) {
		throw new Error("Invalid date range.");
	}

	if (endExclusive.toMillis() <= start.toMillis()) {
		throw new Error("The end date must be on or after the start date.");
	}

	return {
		timeMin: start.toUTC().toISO() ?? "",
		timeMax: endExclusive.toUTC().toISO() ?? "",
	};
}

export function extractCourseCodeAndTitle(summary: string): {
	courseCode: string;
	title: string;
} {
	const title = summary.trim() || "No Title";
	const match = title.match(COURSE_CODE_PATTERN);

	if (match) {
		return { courseCode: match[0].replace(/\s+/, " ").trim(), title };
	}

	const [prefix] = title.split(" - ");
	return { courseCode: prefix?.trim() || "General", title };
}

export function classifyCalendarTitle(
	title: string,
	courseCode?: string
): CalendarEvent["category"] {
	if (EXAM_PATTERNS.some((pattern) => pattern.test(title))) {
		return "exam";
	}

	if (SUMMATIVE_PATTERNS.some((pattern) => pattern.test(title))) {
		return "summative";
	}

	return courseCode && courseCode !== "General" ? "class" : "other";
}

export function normalizeGoogleCalendarEvent(
	event: calendar_v3.Schema$Event
): CalendarEvent | null {
	const summary = event.summary || "No Title";
	const { courseCode, title } = extractCourseCodeAndTitle(summary);

	const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);
	const startTime = normalizeGoogleDate(
		event.start?.dateTime ?? null,
		event.start?.date ?? null
	);

	if (!startTime) return null;

	let endTime = normalizeGoogleDate(
		event.end?.dateTime ?? null,
		event.end?.date ?? null
	);

	if (!endTime && isAllDay) {
		const fallbackEnd = DateTime.fromISO(startTime, { setZone: true }).plus({
			days: 1,
		});
		if (fallbackEnd.isValid) {
			endTime = fallbackEnd.toUTC().toISO() ?? "";
		}
	}

	return {
		id: event.id || `${courseCode}-${startTime}`,
		courseCode,
		title,
		startTime,
		endTime: endTime || undefined,
		location: event.location || "",
		tag: "Class",
		details: stripHtml(event.description),
		subjectPageUrl: `/academics/${encodeURIComponent(courseCode)}`,
		htmlLink: event.htmlLink || undefined,
		category: classifyCalendarTitle(title, courseCode),
		isAllDay,
		source: "google",
	};
}

export function sortEventsByStartTime(events: CalendarEvent[]): CalendarEvent[] {
	return [...events].sort(
		(a, b) => toSortableMillis(a.startTime) - toSortableMillis(b.startTime)
	);
}
