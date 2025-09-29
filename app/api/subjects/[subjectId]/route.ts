// app/api/subjects/[subjectId]/route.ts

import { NextResponse } from 'next/server';
import { mapCanvasCourseToSubject } from '@/lib/canvasAdapter';
import { fetchCourseDetails } from '@/lib/canvas';
import { fetchCustomMaterialsForCourse } from '@/lib/externalData';

// THE FIX IS IN THE FUNCTION SIGNATURE AND THE FIRST LINE INSIDE THE 'try' BLOCK
export async function GET(
    request: Request,
    context: { params: { subjectId: string } } // 1. Accept the whole context object
) {
    try {
        const { subjectId } = await context.params; // 2. Destructure 'subjectId' here

        const courseId = parseInt(subjectId, 10);
        if (isNaN(courseId)) {
            return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
        }

        // 1. Fetch from both sources in parallel
        const [rawCanvasCourse, customMaterialsMap] = await Promise.all([
            fetchCourseDetails(subjectId),
            fetchCustomMaterialsForCourse(courseId)
        ]);

        if (!rawCanvasCourse) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        // 2. First, adapt the raw Canvas data into our clean 'Subject' shape
        const subject = mapCanvasCourseToSubject(rawCanvasCourse);

        // 3. Now, merge the custom materials into the CLEAN 'subject' object
        if (customMaterialsMap.size > 0) {
            for (const topic of subject.topics) {
                if (customMaterialsMap.has(topic.id)) {
                    const customItems = customMaterialsMap.get(topic.id)!;
                    topic.items.push(...customItems);
                }
            }
        }

        // 4. Return the final, merged, and clean subject data
        return NextResponse.json(subject);

    } catch (error) {
        // Use a dynamic subjectId for better error logging
        const subjectIdForError = context.params.subjectId || 'unknown';
        console.error(`Failed to fetch and merge data for subject ${subjectIdForError}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
    }
}