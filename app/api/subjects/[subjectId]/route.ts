// app/api/subjects/[subjectId]/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Subject from '@/models/Subject';

type Props = {
    params: { subjectId: string };
};

export async function GET(request: Request, { params }: Props) {
    try {
        await connectToDatabase();
        const { subjectId } = params;

        // Find subject by its courseCode, converting to uppercase to match schema
        const subject = await Subject.findOne({ courseCode: subjectId.toUpperCase() });

        if (!subject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        return NextResponse.json(subject);
    } catch (error) {
        console.error(`Error fetching subject ${params.subjectId}:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}