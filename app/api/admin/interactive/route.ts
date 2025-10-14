// app/api/admin/interactive/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import InteractiveContent from '@/models/InteractiveContent';

export async function POST(request: Request) {
    // TODO: Add proper authentication and authorization checks here.

    try {
        await connectToDatabase();
        const body = await request.json();

        const { courseId, title, contentType, content } = body;

        if (!courseId || !title || !contentType || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['Quiz', 'Flashcard'].includes(contentType)) {
            return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
        }

        const newContent = new InteractiveContent({
            courseId,
            title,
            contentType,
            content,
        });

        await newContent.save();

        return NextResponse.json({ success: true, data: newContent }, { status: 201 });

    } catch (error) {
        console.error("POST /api/admin/interactive failed:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}