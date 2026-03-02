import { NextRequest, NextResponse } from "next/server";
import { isValidDateKey } from "@/lib/server/domains/events/normalizers";
import { listGoogleCalendarEvents } from "@/lib/server/domains/events/service";

export async function getEventsHandler(request: NextRequest) {
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

		const events = await listGoogleCalendarEvents(
			apiKey,
			calendarId,
			startDateKey,
			endDateKey
		);
		return NextResponse.json({ events }, { status: 200 });
	} catch (error: unknown) {
		console.error("Error fetching events:", error);
		const message =
			error instanceof Error ? error.message : "Failed to load events";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
