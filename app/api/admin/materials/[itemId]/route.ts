// app/api/admin/materials/[itemId]/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomMaterial from '@/models/CustomMaterial';
import mongoose from 'mongoose';

/**
 * Extracts the last segment of a URL path, which is our item ID.
 * @param url The full request URL.
 * @returns The extracted item ID.
 */
function getItemIdFromUrl(url: string): string {
    const segments = new URL(url).pathname.split('/');
    return segments[segments.length - 1];
}

// UPDATE an existing item
export async function PUT(request: Request) {
    console.log("PUT request received - Bypassing context object.");

    try {
        const itemId = getItemIdFromUrl(request.url);

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return NextResponse.json({ error: 'Invalid Item ID format' }, { status: 400 });
        }

        await connectToDatabase();
        const body = await request.json();

        const updatedMaterial = await CustomMaterial.findByIdAndUpdate(
            itemId,
            { $set: { item: body.item } },
            { new: true }
        );

        if (!updatedMaterial) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedMaterial });
    } catch (error) {
        console.error(`PUT /api/admin/materials failed:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const itemId = getItemIdFromUrl(request.url);
    console.log(`--- DELETE request received for itemId: ${itemId} ---`);

    try {
        // 1. Validate the ID format immediately
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            console.error("Validation Error: The provided ID is not a valid MongoDB ObjectId.");
            return NextResponse.json({ error: 'Invalid Item ID format' }, { status: 400 });
        }

        // 2. Connect to the database
        await connectToDatabase();
        console.log("Database connection successful.");

        // 3. Attempt to find and delete the document
        console.log(`Attempting to delete document with _id: ${itemId}`);
        const deletedMaterial = await CustomMaterial.findByIdAndDelete(itemId);

        // 4. Check the result and provide clear feedback
        if (!deletedMaterial) {
            console.warn(`Document with _id: ${itemId} was NOT FOUND in the 'custommaterials' collection.`);
            return NextResponse.json({ error: 'Material not found in database' }, { status: 404 });
        }

        console.log(`Successfully deleted document with _id: ${itemId}`);
        return NextResponse.json({ success: true, message: 'Material deleted' });

    } catch (error) {
        console.error(`DELETE /api/admin/materials/${itemId} failed with an unexpected error:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}