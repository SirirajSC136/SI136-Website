// app/api/admin/courses/[courseId]/topics/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomCourse from '@/models/CustomCourse';

export async function POST(request: Request, { params }: { params: { courseId: string } }) {
    // TODO: Add proper authentication and authorization checks here.

    try {
        await connectToDatabase();
        const { title } = await request.json();
        const { courseId } = params;

        if (!title) {
            return NextResponse.json({ error: 'Topic title is required' }, { status: 400 });
        }

        const updatedCourse = await CustomCourse.findByIdAndUpdate(
            courseId,
            { $push: { topics: { title: title } } },
            { new: true } // Return the updated document
        );

        if (!updatedCourse) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedCourse });
    } catch (error) {
        console.error("Failed to add topic:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}