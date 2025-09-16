// app/api/tasks/route.ts

import { NextResponse } from 'next/server';
import { Task } from '@/types';

// This is our simulated database for assignments and exams.
const mockTasks: Task[] = [
    {
        id: 'asg-past',
        type: 'assignment',
        courseCode: 'SIID350',
        title: 'Pre-course Survey',
        deadline: '2025-09-01T23:59:00' // A past deadline to test the "Past" state
    },
    {
        id: 'asg1',
        type: 'assignment',
        courseCode: 'SIID351',
        title: 'CLO assessment 1-3',
        deadline: '2025-10-17T23:59:00'
    },
    {
        id: 'asg2',
        type: 'assignment',
        courseCode: 'SIID347',
        title: 'CLO assessment 1-4',
        deadline: '2025-11-10T23:59:00'
    },
    {
        id: 'exm1',
        type: 'examination',
        courseCode: 'SIID351',
        title: 'Summative',
        deadline: '2025-12-14T13:00:00'
    },
    {
        id: 'exm2',
        type: 'examination',
        courseCode: 'SIID347',
        title: 'Mid-term Exam',
        deadline: '2025-10-25T09:00:00'
    },
];

export async function GET() {
    try {
        // In the future, this is where you would fetch from your Headless CMS / Database.
        // For now, we return the combined list of mock tasks.
        return NextResponse.json(mockTasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'An internal server error occurred while fetching tasks.' },
            { status: 500 }
        );
    }
}