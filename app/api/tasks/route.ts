// app/api/tasks/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';
import { Task as ITask } from '@/types';

/**
 * GET handler to fetch all tasks from MongoDB for the admin panel.
 * Fetches all tasks regardless of deadline and sorts by most recently created.
 */
export async function GET() {
    try {
        await connectToDatabase();

        // For the admin panel, we want to see all tasks, including past ones.
        // We sort by deadline descending to show upcoming/recent tasks first.
        const tasks: ITask[] = await Task.find({}).sort({ deadline: -1 });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'An internal server error occurred while fetching tasks.' },
            { status: 500 }
        );
    }
}

/**
 * POST handler for the admin panel to create a new task.
 */
export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        // More robust validation
        const { title, courseCode, deadline, type, resources } = body;
        if (!title || !courseCode || !deadline || !type) {
            return NextResponse.json({ error: 'Missing required fields: title, courseCode, deadline, type' }, { status: 400 });
        }

        if (!['assignment', 'examination'].includes(type)) {
            return NextResponse.json({ error: 'Invalid task type' }, { status: 400 });
        }

        // Validate resources if they exist
        if (resources && !Array.isArray(resources)) {
            return NextResponse.json({ error: 'Resources must be an array' }, { status: 400 });
        }

        const newTask = new Task({
            title,
            courseCode,
            deadline: new Date(deadline),
            type,
            resources: resources || [], // Default to empty array if not provided
        });

        await newTask.save();

        return NextResponse.json(newTask, { status: 201 }); // 201 Created

    } catch (error) {
        // Handle potential validation errors from Mongoose

        if (error instanceof Error) {
            if (error.name === 'ValidationError') {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
            console.error('Error creating task:', error);
            return NextResponse.json(
                { error: 'An internal server error occurred while creating the task.' },
                { status: 500 }
            );
        }

    }
}