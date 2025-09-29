// app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import { mapCanvasCourseToSubject } from '@/lib/canvasAdapter';
import { fetchEnrolledCourses } from '@/lib/canvas'; // <-- Use the new shallow fetch function

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Fetch only the list of courses. This will be much faster.
        const enrolledCourses = await fetchEnrolledCourses();

        // 2. The adapter transforms the shallow course data.
        // This works because the adapter likely only needs top-level course info.
        const subjects = enrolledCourses.map(mapCanvasCourseToSubject);

        // 3. Return the transformed data
        return NextResponse.json(subjects);

    } catch (error) {
        console.error("Failed to fetch and adapt Canvas data:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
    }
}