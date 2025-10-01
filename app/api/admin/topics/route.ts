// app/api/admin/topics/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomTopic from '@/models/CustomTopic';

export async function POST(request: Request) {
    // TODO: Add proper authentication and authorization checks here.

    try {
        await connectToDatabase();
        const body = await request.json();

        const { courseId, title } = body;
        if (!courseId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newTopic = new CustomTopic({ courseId, title });
        await newTopic.save();

        return NextResponse.json({ success: true, data: newTopic }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/topics failed:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}