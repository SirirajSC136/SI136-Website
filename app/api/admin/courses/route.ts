// app/api/admin/courses/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomCourse from '@/models/CustomCourse';

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
        // Handle potential duplicate key error for courseCode
        if ((error as any).code === 11000) {
            return NextResponse.json({ error: 'A course with this code already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}