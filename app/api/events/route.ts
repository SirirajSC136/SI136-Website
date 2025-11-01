// ./app/api/events/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { CalendarEvent } from "@/types";
import { fetchCalendarEvents } from "@/lib/getEvents";

export const dynamic = "force-dynamic";

// --- Ensure required env vars exist ---
if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CALENDAR_ID) {
  throw new Error("Missing Google API Key or Calendar ID.");
}

// --- Google Calendar client ---
const calendar = google.calendar({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});

// --- Helpers ---
function parseEventSummary(summary: string): { courseCode: string; title: string } {
  const topicMarker = "(Topic";
  const topicIndex = summary.indexOf(topicMarker);

  if (topicIndex !== -1) {
    const courseCode = summary.substring(0, topicIndex).trim();
    return { courseCode, title: summary };
  }

  const parts = summary.split(" - ");
  return { courseCode: parts[0] || "General", title: summary };
}

const stripHtml = (html: string | null | undefined): string => {
  return html ? html.replace(/<[^>]*>/g, "") : "";
};

// --- GET handler ---
export async function GET() {
  try {
    // Local events from your abstraction
    const localEvents = await fetchCalendarEvents();

    // Google Calendar events
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    const googleEvents: CalendarEvent[] = events.map((event) => {
      const summary = event.summary || "No Title";
      const { courseCode, title } = parseEventSummary(summary);

      return {
        id: event.id || "",
        courseCode,
        title,
        tag: "Class",
        startTime: event.start?.dateTime || event.start?.date || "",
        endTime: event.end?.dateTime || event.end?.date || "",
        details: stripHtml(event.description),
        location: event.location || "",
        subjectPageUrl: `/academics/${encodeURIComponent(courseCode)}`,
        htmlLink: event.htmlLink || "",
      };
    });

    console.log("Parsed Google Events:", googleEvents);

    const unifiedEvents = [...localEvents, ...googleEvents];

    return new NextResponse(JSON.stringify({ events: unifiedEvents }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Failed to load events" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
