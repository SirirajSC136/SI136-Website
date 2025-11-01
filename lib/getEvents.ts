import ical from "ical";
import { customEvents } from "./customEvents";

/** Clean up raw ICS titles */
const cleanTitle = (raw?: string) => raw?.split(":")[0] || "Untitled";

/** Mapping rules: pattern → replacement */
const titleMappings: { match: RegExp; newTitle: string }[] = [
  { match: /EGID/, newTitle: "EGID103" },
  { match: /SIID.*143/, newTitle: "SIID143" },
  { match: /SIID.*144/, newTitle: "SIID144" },
  { match: /SIID.*145/, newTitle: "SIID145" },
  { match: /SIID.*146/, newTitle: "SIID146" },
  { match: /SIID.*147/, newTitle: "SIID147" },
  { match: /SIID.*148/, newTitle: "SIID148" },
  { match: /SCID.*103/, newTitle: "SCID103" },
  { match: /SCID.*104/, newTitle: "SCID104" },
  { match: /SCID.*105/, newTitle: "SCID105" },
  { match: /ITCS.*152/, newTitle: "ITCS152" },
];

/** Blocked titles or keywords */
const blockedPatterns = [
  /^วิชาศึกษาทั่วไป$/,
  /งด/,
  /Wk1/,
  /พบ/,
  /วัน/,
];

/** Apply mapping + filtering */
const normalizeEvent = (ev: any) => {
  const mapped = titleMappings.find(r => r.match.test(ev.title));
  return mapped ? { ...ev, title: mapped.newTitle } : ev;
};
const isAllowed = (ev: any) => !blockedPatterns.some(p => p.test(ev.title));

/** Parse ICS text into events */
export function parseIcsToEvents(icsText: string) {
  const events = Object.values(ical.parseICS(icsText))
    .filter((item: any) => item?.type === "VEVENT")
    .map((item: any) => ({
      title: cleanTitle(item.summary),
      start: item.start,
      end: item.end,
      allDay: true,
      location: item.location || undefined,
    }));

  console.log(`Parsed ${events.length} events`);
  if (events[0]) console.log("Sample event:", events[0]);

  return events;
}

/** Fetch + normalize + merge events */
export async function fetchCalendarEvents() {
  const icsUrl = process.env.GOOGLE_CALENDAR_ICS_URL;
  if (!icsUrl) throw new Error("Missing GOOGLE_CALENDAR_ICS_URL in .env.local");

  console.log("Fetching ICS from:", icsUrl);
  const res = await fetch(icsUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ICS: ${res.status} ${res.statusText}`);

  const icsText = await res.text();
  console.log("ICS file length:", icsText.length);

  const icsEvents = parseIcsToEvents(icsText)
    .map(normalizeEvent)
    .filter(isAllowed);

  const merged = [...icsEvents, ...customEvents];
  console.log(`Total events (ICS + custom): ${merged.length}`);

  return merged;
}
