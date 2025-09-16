// app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Subject from '@/models/Subject';
// FIX #1: This import now works because you ran `npm install mongodb`
import { MongoServerError } from 'mongodb';

/**
 * GET handler to fetch all subjects from MongoDB.
 */
export async function GET() {
    try {
        await connectToDatabase();
        const subjects = await Subject.find({}).sort({ year: -1, semester: -1, courseCode: 1 });
        return NextResponse.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST handler for an admin panel to create a new subject.
 */
export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        if (!body.courseCode || !body.title || !body.year || !body.semester) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newSubject = new Subject(body);
        await newSubject.save();

        return NextResponse.json(newSubject, { status: 201 });
    } catch (error) { // 'error' is of type 'unknown'

        // FIX #2: Use specific type guards for each potential error type.
        // This proves the type of 'error' to TypeScript, resolving the 'unknown' issue.

        // First, check for the specific MongoDB duplicate key error.
        if (error instanceof MongoServerError && error.code === 11000) {
            return NextResponse.json(
                { error: 'A subject with this course code already exists.' },
                { status: 409 } // 409 Conflict
            );
        }

        // Next, check for a Mongoose validation error.
        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // If it's neither of the above, log it and return a generic server error.
        console.error('Error creating subject:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}