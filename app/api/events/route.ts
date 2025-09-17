import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { CalendarEvent } from '@/types';

if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CALENDAR_ID) {
    throw new Error("Missing Google API Key or Calendar ID.");
}

const calendar = google.calendar({ version: 'v3', auth: process.env.GOOGLE_API_KEY });

function parseEventSummary(summary: string): { courseCode: string; title: string } {
    const topicMarker = '(Topic';
    const topicIndex = summary.indexOf(topicMarker);

    if (topicIndex !== -1) {
        const courseCode = summary.substring(0, topicIndex).trim();
        return { courseCode, title: summary };
    }

    const parts = summary.split(' - ');
    return { courseCode: parts[0] || 'General', title: summary };
}

const stripHtml = (html: string | null | undefined): string => {
    return html ? html.replace(/<[^>]*>/g, '') : '';
};

export async function GET() {
    try {
        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 8,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items;
        if (!events || events.length === 0) {
            return NextResponse.json([]);
        }

        const formattedEvents: CalendarEvent[] = events.map((event) => {
            const summary = event.summary || 'No Title';
            const { courseCode, title } = parseEventSummary(summary);

            return {
                id: event.id || '',
                courseCode,
                title,
                tag: 'Class',
                startTime: event.start?.dateTime || event.start?.date || '',
                details: stripHtml(event.description),
                subjectPageUrl: `/academics/${encodeURIComponent(courseCode)}`,
            };
        });

        return NextResponse.json(formattedEvents);

    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}