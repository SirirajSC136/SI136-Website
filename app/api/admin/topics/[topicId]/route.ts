// app/api/admin/topics/[topicId]/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomTopic from '@/models/CustomTopic';
import CustomMaterial from '@/models/CustomMaterial';
import mongoose from 'mongoose';

export async function DELETE(
    request: Request,
    { params }: { params: { topicId: string } }
) {
    // TODO: Add proper authentication and authorization checks here.

    const { topicId } = params;

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
        return NextResponse.json({ error: 'Valid Topic ID is required' }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // 1. Delete all materials associated with this topic to prevent orphans
        await CustomMaterial.deleteMany({ topicId: topicId });

        // 2. Delete the topic itself
        const result = await CustomTopic.findByIdAndDelete(topicId);

        if (!result) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Topic and associated materials deleted.' });

    } catch (error) {
        console.error(`[ERROR] Failed to delete topic ${topicId}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}