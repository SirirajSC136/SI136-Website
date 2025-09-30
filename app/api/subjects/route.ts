// app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import { mapCanvasCourseToSubject, mapCustomCourseToSubject } from '@/lib/canvasAdapter';
import { fetchEnrolledCourses } from '@/lib/canvas';
import connectToDatabase from '@/lib/mongodb';
import CustomCourse from '@/models/CustomCourse';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Establish database connection at the start
        await connectToDatabase();
        console.log("DB connected for /api/subjects");

        // 2. Fetch from both sources in parallel
        const [canvasCourses, customCourses] = await Promise.all([
            fetchEnrolledCourses(),
            CustomCourse.find({}).sort({ year: -1, semester: -1 }).exec() // Use .exec() to ensure it's a true promise
        ]);
        console.log(`Fetched ${canvasCourses.length} Canvas courses and ${customCourses.length} custom courses.`);

        // 3. Adapt both lists to the unified 'Subject' type
        const canvasSubjects = canvasCourses.map(mapCanvasCourseToSubject);
        const customSubjects = customCourses.map(mapCustomCourseToSubject);

        // 4. Combine and return the lists
        const allSubjects = [...canvasSubjects, ...customSubjects];

        return NextResponse.json(allSubjects);
    } catch (error) {
        console.error("Failed to fetch all subjects:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}