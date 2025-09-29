// app/api/admin/materials/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomMaterial from '@/models/CustomMaterial';

export async function POST(request: Request) {
    // TODO: Add proper authentication and authorization checks here.

    try {
        await connectToDatabase();
        const body = await request.json();

        if (!body.canvasCourseId || !body.canvasModuleId || !body.item) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newMaterial = new CustomMaterial(body);
        await newMaterial.save();

        return NextResponse.json({ success: true, data: newMaterial }, { status: 201 });
    } catch (error) {
        console.error("POST /api/admin/materials failed:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}