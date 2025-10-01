// app/api/admin/materials/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomMaterial from '@/models/CustomMaterial';

export async function POST(request: Request) {
    // TODO: Add proper authentication and authorization checks here.

    try {
        await connectToDatabase();
        const body = await request.json();

        // ==================================================
        // === THE DEFINITIVE FIX IS RIGHT HERE ===
        // ==================================================
        // We now validate using the new, generic field names: 'courseId' and 'topicId'.
        if (!body.courseId || !body.topicId || !body.item) {
            console.error("Validation failed. Received body:", body);
            return NextResponse.json({ error: 'Missing required fields: courseId, topicId, and item are required.' }, { status: 400 });
        }
        // ==================================================

        const newMaterial = new CustomMaterial({
            courseId: body.courseId,
            topicId: body.topicId,
            item: body.item,
        });
        await newMaterial.save();

        return NextResponse.json({ success: true, data: newMaterial }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/materials failed:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}