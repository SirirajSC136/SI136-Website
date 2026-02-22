import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { CalendarEvent } from "@/types";
import {
	getBangkokUtcRange,
	isValidDateKey,
	normalizeGoogleCalendarEvent,
	sortEventsByStartTime,
} from "@/lib/events/normalize";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const apiKey = process.env.GOOGLE_API_KEY;
		const calendarId = process.env.GOOGLE_CALENDAR_ID;

		if (!apiKey || !calendarId) {
			return NextResponse.json(
				{ error: "Missing GOOGLE_API_KEY or GOOGLE_CALENDAR_ID." },
				{ status: 500 }
			);
		}

		const startDateKey = request.nextUrl.searchParams.get("start");
		const endDateKey = request.nextUrl.searchParams.get("end");

		if (!startDateKey || !endDateKey) {
			return NextResponse.json(
				{
					error:
						"Query params 'start' and 'end' are required in YYYY-MM-DD format.",
				},
				{ status: 400 }
			);
		}

		if (!isValidDateKey(startDateKey) || !isValidDateKey(endDateKey)) {
			return NextResponse.json(
				{
					error:
						"Invalid date format. Use YYYY-MM-DD for both 'start' and 'end'.",
				},
				{ status: 400 }
			);
		}

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

		return NextResponse.json({ events: sortEventsByStartTime(events) }, { status: 200 });
	} catch (error: unknown) {
		console.error("Error fetching events:", error);
		const message =
			error instanceof Error ? error.message : "Failed to load events";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
