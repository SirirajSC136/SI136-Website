// app/api/subjects/route.ts

import { NextResponse } from 'next/server';
import { subjectsService } from '@/lib/server/services/subjectsService';
import { toErrorResponse } from '@/lib/server/http/errors';

export const dynamic = 'force-dynamic';
export const runtime = "nodejs";

export async function GET() {
    try {
        return NextResponse.json(await subjectsService.getAllSubjects());
    } catch (error) {
        return toErrorResponse(error);
    }
}
