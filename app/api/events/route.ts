// app/api/events/route.ts

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { CalendarEvent } from '@/types';

// Ensure environment variables are defined
if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CALENDAR_ID) {
    throw new Error("Missing Google API Key or Calendar ID in environment variables.");
}

// Initialize the Calendar API client with the API key
const calendar = google.calendar({
    version: 'v3',
    auth: process.env.GOOGLE_API_KEY,
});

/**
 * Parses the event summary to extract course code, title, and tag.
 * Expected format: "COURSECODE - Title - TAG"
 */
function parseEventSummary(summary: string): { courseCode: string; title: string; tag: string } {
    const parts = summary.split(' - ').map(p => p.trim());
    if (parts.length >= 3) {
        return {
            courseCode: parts[0],
            title: parts.slice(1, -1).join(' - '),
            tag: parts[parts.length - 1],
        };
    }
    return { courseCode: 'N/A', title: summary, tag: 'Event' };
}

export async function GET() {
    try {
        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 15,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;

        if (!events || events.length === 0) {
            return NextResponse.json([]);
        }

        const formattedEvents: CalendarEvent[] = events.map((event) => {
            const summary = event.summary || 'No Title';
            const { courseCode, title, tag } = parseEventSummary(summary);

            return {
                id: event.id || '',
                courseCode,
                title,
                tag,
                startTime: event.start?.dateTime || event.start?.date || '',
                details: event.description || '',
                subjectPageUrl: `/academics/${courseCode.toLowerCase()}`,
            };
        });

        return NextResponse.json(formattedEvents);

    } catch (error) { // The 'error' variable is of type 'unknown'
        console.error('Error fetching Google Calendar events:', error);

        // --- FIX STARTS HERE ---
        // This is a type guard. We check if 'error' is a non-null object
        // and if it has a 'code' property before we try to use it.
        if (error && typeof error === 'object' && 'code' in error) {
            // Now TypeScript knows 'error' has a 'code' property.
            // We can safely cast it to access it.
            const apiError = error as { code: number; message: string };

            if (apiError.code === 403) {
                return NextResponse.json(
                    { error: 'Permission denied. This can be caused by an incorrect API key, the calendar not being public, or the Calendar API not being enabled in Google Cloud.' },
                    { status: 403 }
                );
            }
        }
        // --- FIX ENDS HERE ---

        // This is the generic fallback error if the specific check fails.
        return NextResponse.json(
            { error: 'An internal server error occurred while fetching calendar events.' },
            { status: 500 }
        );
    }
}