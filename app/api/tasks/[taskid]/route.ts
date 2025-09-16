// app/api/tasks/[taskId]/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Task from '@/models/Task';

type Props = {
    params: { taskId: string };
};

export async function DELETE(request: Request, { params }: Props) {
    try {
        await connectToDatabase();
        const { taskId } = params;

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json(
            { error: 'An internal server error occurred.' },
            { status: 500 }
        );
    }
}