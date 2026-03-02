// app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import { getAllSubjects } from '@/lib/subjects';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const allSubjects = await getAllSubjects();

        return NextResponse.json(allSubjects);
    } catch (error) {
        console.error("Failed to fetch all subjects:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
