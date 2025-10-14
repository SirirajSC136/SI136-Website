// app/api/admin/courses/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomCourse from '@/models/CustomCourse';
import CustomTopic from '@/models/CustomTopic'; // Import dependent model
import CustomMaterial from '@/models/CustomMaterial'; // Import dependent model

// --- POST function remains the same ---
export async function POST(request: Request) {
    // TODO: Add proper authentication and authorization checks here.

    try {
        await connectToDatabase();
        const body = await request.json();

        const { courseCode, title, year, semester } = body;
        if (!courseCode || !title || !year || !semester) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newCourse = new CustomCourse({
            courseCode,
            title,
            year,
            semester,
            topics: [], // Start with an empty array of topics
        });
        await newCourse.save();

        return NextResponse.json({ success: true, data: newCourse }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/courses failed:", error);
        if ((error as any).code === 11000) {
            return NextResponse.json({ error: 'A course with this code already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


// --- NEW: DELETE function to remove a course ---
export async function DELETE(request: Request) {
    // TODO: Add proper authentication and authorization checks here.

    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('id');

        if (!courseId) {
            return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
        }

        await connectToDatabase();

        // Before deleting the course, delete all of its children to maintain data integrity
        await CustomMaterial.deleteMany({ courseId: courseId });
        await CustomTopic.deleteMany({ courseId: courseId });

        // Now, delete the course itself
        const result = await CustomCourse.findByIdAndDelete(courseId);

        if (!result) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Course and all associated materials deleted.' });
    } catch (error) {
        console.error("DELETE /api/admin/courses failed:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}