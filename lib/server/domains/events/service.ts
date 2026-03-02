import { google } from "googleapis";
import { CalendarEvent } from "@/types";
import {
	getBangkokUtcRange,
	normalizeGoogleCalendarEvent,
	sortEventsByStartTime,
} from "@/lib/server/domains/events/normalizers";

export async function listGoogleCalendarEvents(
	apiKey: string,
	calendarId: string,
	startDateKey: string,
	endDateKey: string
): Promise<CalendarEvent[]> {
	const { timeMin, timeMax } = getBangkokUtcRange(startDateKey, endDateKey);

	const calendar = google.calendar({
		version: "v3",
		auth: apiKey,
	});

	const response = await calendar.events.list({
		calendarId,
		timeMin,
		timeMax,
		maxResults: 2500,
		singleEvents: true,
		orderBy: "startTime",
	});

	const events: CalendarEvent[] = (response.data.items || [])
		.map(normalizeGoogleCalendarEvent)
		.filter((event): event is CalendarEvent => event !== null);

	return sortEventsByStartTime(events);
}
