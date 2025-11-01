// lib/parseEvents.ts

// Match the shape of your JSON export
export interface RawEvent {
	title: string;
	fullTitle: string;
	start: string;
	end: string;
	allDay?: boolean;
	location?: string;
	details?: string;

	id?: string;
	courseCode?: string;
	topic?: string;
	professor?: string;
	startTime?: string;
	endTime?: string;
	subjectPageUrl?: string;
	htmlLink?: string;
	htmlTitle?: string;
}

// Normalized Event type used in the app
export interface Event {
	title: string;
	fullTitle: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	location?: string;
	details?: string;
	dayKey: string;

	id?: string;
	courseCode?: string;
	topic?: string;
	professor?: string;
	startTime?: string;
	endTime?: string;
	subjectPageUrl?: string;
	htmlLink?: string;
	htmlTitle?: string;
}

// --- Helper to extract course code ---
function extractCourseCode(title: string): string | undefined {
	if (!title) return undefined;

	// Special case: exam
	if (title.trim() === "สอบปลายภาค") {
		return "สอบปลายภาค";
	}

	if (title.trim() === "สอบกลางภาค") {
		return "สอบกลางภาค";
	}

	// Match patterns like "SIID 145", "EGID 103", "SCID104", "ITCS 101"
	const match = title.match(/^(SIID\s?\d+|EGID\s?\d+|SCID\s?\d+|ITCS\s?\d+)/i);
	if (match) {
		return match[0].replace(/\s+/, " ").trim();
	}

	// Fallback: take everything before "(" if present
	const subjectPart = title.split("(")[0].trim();
	return subjectPart || undefined;
}

export function mapToRawEvents(events: Partial<RawEvent>[]): RawEvent[] {
	return events.map((e, idx) => {
		// Extract course code
		const courseCode = e.title ? extractCourseCode(e.title) : undefined;

		// Extract topic number if present
		const topicMatch = e.title?.match(/\(Topic\s*(\d+)\)/i);
		const topic = topicMatch ? topicMatch[1] : undefined;

		// Extract professor name(s) from details
		let professor: string | undefined;
		if (e.details) {
			const profMatch = e.details.match(
				/(?:อาจารย์ผู้สอน|Professor)\s*:\s*(.*)/i
			);
			professor = profMatch ? profMatch[1].trim() : undefined;
		}

		// Derive start/end times in HH:mm
		const startTime = e.start?.split("T")[1]?.slice(0, 5);
		const endTime = e.end?.split("T")[1]?.slice(0, 5);

		return {
			...e,
			id: `${idx}-${e.start}`,
			courseCode,
			topic,
			professor,
			startTime,
			endTime,
		} as RawEvent;
	});
}

function getLocalDayKey(date: Date): string {
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");
}

export function parseEvents(raw: RawEvent[]): Event[] {
	return raw
		.map((ev) => {
			const start = new Date(ev.start);
			const end = new Date(ev.end);

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return null;
			}

			return {
				...ev,
				start,
				end,
				dayKey: getLocalDayKey(start),
			} as Event;
		})
		.filter((ev): ev is Event => ev !== null)
		.sort((a, b) => a.start.getTime() - b.start.getTime());
}
