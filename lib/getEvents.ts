/** ./app/lib/getEvents.ts */
import ical from "ical";
import { customEvents } from "./customEvents";

/** Clean up raw ICS titles */
const cleanTitle = (raw?: string) => raw?.split(":")[0] || "Untitled";

/** Blocked titles or keywords */
const blockedPatterns = [
	/^วิชาศึกษาทั่วไป$/,
	/งด/,
	/Wk1/,
	/พบ/,
	/วัน/,
	/Mahidol/,
	/Orientation/,
	/correlations/,
];

const isAllowed = (ev: any) => !blockedPatterns.some((p) => p.test(ev.title));

/** Extract professor + topics from description text */
function parseExtraFields(desc?: string) {
	if (!desc) return { topics: "", professor: "", details: "" };

	const clean = desc.replace(/<[^>]*>/g, ""); // strip HTML if present
	const profMatch = clean.match(/Professor:\s*(.*)/i);
	const topicsMatch = clean.match(/Topics?:\s*(.*)/i);

	return {
		details: clean,
		professor: profMatch ? profMatch[1].trim() : "",
		topics: topicsMatch ? topicsMatch[1].trim() : "",
	};
}

/** Parse ICS text into events */
export function parseIcsToEvents(icsText: string) {
	const events = Object.values(ical.parseICS(icsText))
		.filter((item: any) => item?.type === "VEVENT")
		.map((item: any) => {
			const { topics, professor, details } = parseExtraFields(item.description);

			return {
				title: cleanTitle(item.summary),
				fullTitle: item.summary || "Untitled",
				start: item.start,
				end: item.end,
				allDay: false,
				location: item.location || undefined,
				details,
			};
		});

	console.log(`Parsed ${events.length} events`);
	if (events[0]) console.log("Sample event:", events[0]);

	return events;
}

/** Fetch + normalize + merge events */
export async function fetchCalendarEvents() {
	const icsUrl = process.env.GOOGLE_CALENDAR_ICS_URL;
	if (!icsUrl) throw new Error("Missing GOOGLE_CALENDAR_ICS_URL in .env.local");

	const res = await fetch(icsUrl, { cache: "no-store" });
	if (!res.ok)
		throw new Error(`Failed to fetch ICS: ${res.status} ${res.statusText}`);

	const icsText = await res.text();
	const icsEvents = parseIcsToEvents(icsText).filter(isAllowed);

	const merged = [...icsEvents, ...customEvents];
	return merged;
}
