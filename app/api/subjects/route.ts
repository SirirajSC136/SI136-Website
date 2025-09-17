// app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import { mapCanvasCourseToSubject } from '@/lib/canvasAdapter';
import { fetchAllCanvasCourses } from '@/lib/canvas'; // <-- Import our new function

export const dynamic = 'force-dynamic'; // Ensures the route is re-evaluated on each request

export async function GET() {
    try {
        // 1. Fetch all the raw data from Canvas using our dedicated function
        const rawCanvasCourses = await fetchAllCanvasCourses();

        // 2. Use the adapter to transform the raw data into the shape our frontend needs
        // The '.map' will now work because rawCanvasCourses is a proper array.
        const subjects = rawCanvasCourses.map(mapCanvasCourseToSubject);

        // 3. Return the transformed data
        return NextResponse.json(subjects);

    } catch (error) {
        console.error("Failed to fetch and adapt Canvas data:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
    }
}