// app/api/subjects/[subjectId]/route.ts

import { NextResponse } from 'next/server';
import { mapCanvasCourseToSubject } from '@/lib/canvasAdapter';
import { fetchCourseDetails } from '@/lib/canvas';

export async function GET(
    request: Request,
    { params: { subjectId } }: { params: { subjectId: string } }
) {
    try {
        const rawCanvasCourse = await fetchCourseDetails(subjectId);

        if (!rawCanvasCourse) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        // *** ADDING FINAL LOGGING ***
        // This will log the complete, raw data structure to your server console.
        // It's useful for debugging the adapter logic if needed.
        console.log(`\nSuccessfully assembled all data for course ${subjectId}. Sending to adapter.`);
        // For very detailed view, uncomment the next line, but be warned it can be huge!
        // console.log(JSON.stringify(rawCanvasCourse, null, 2));


        const subject = mapCanvasCourseToSubject(rawCanvasCourse);
        return NextResponse.json(subject);

    } catch (error) {
        console.error(`Failed to fetch Canvas data for subject ${subjectId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
    }
}