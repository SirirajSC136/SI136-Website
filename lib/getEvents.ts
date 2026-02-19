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

/** Extract course code prefix from title (e.g. "SIID 145", "EGID 103") */
function extractCourseCode(title: string): string {
	const t = title.trim();
	const match = t.match(/^(SIID\s?\d+|EGID\s?\d+|SCID\s?\d+|ITCS\s?\d+)/i);
	if (match) return match[0].replace(/\s+/, " ").trim();
	return t.split(" - ")[0].trim() || "General";
}

/** Parse ICS text into events shaped as CalendarEvent */
export function parseIcsToEvents(icsText: string) {
	return Object.values(ical.parseICS(icsText))
		.filter((item: any) => item?.type === "VEVENT")
		.map((item: any, idx: number) => {
			const { professor, details } = parseExtraFields(item.description);
			const title = cleanTitle(item.summary);
			const courseCode = extractCourseCode(title);
			const startDate: Date = item.start;
			const endDate: Date = item.end;

			return {
				id: `ics-${idx}-${startDate?.getTime?.() ?? idx}`,
				title,
				fullTitle: item.summary || "Untitled",
				courseCode,
				tag: "Class",
				startTime: startDate instanceof Date ? startDate.toISOString() : String(startDate),
				endTime: endDate instanceof Date ? endDate.toISOString() : String(endDate),
				location: item.location || "",
				details: professor ? `👩‍🏫 ${professor}` : details,
				subjectPageUrl: `/academics/${encodeURIComponent(courseCode)}`,
			};
		});
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
