// app/api/admin/materials/[itemId]/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomMaterial from '@/models/CustomMaterial';
import mongoose from 'mongoose';

// The getItemIdFromUrl function is no longer needed and should be deleted.

// UPDATE an existing item
export async function PUT(
    request: Request,
    { params }: { params: { itemId: string } } // <-- FIX: Correct signature
) {
    const { itemId } = params; // <-- FIX: Get ID from params
    console.log(`PUT request received for itemId: ${itemId}`);

    try {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return NextResponse.json({ error: 'Invalid Item ID format' }, { status: 400 });
        }

        await connectToDatabase();
        const body = await request.json();

        const updatedMaterial = await CustomMaterial.findByIdAndUpdate(
            itemId,
            { $set: { item: body.item } },
            { new: true } // Return the updated document
        );

        if (!updatedMaterial) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedMaterial });
    } catch (error) {
        console.error(`PUT /api/admin/materials/${itemId} failed:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE an existing item
export async function DELETE(
    request: Request,
    { params }: { params: { itemId: string } } // <-- FIX: Correct signature
) {
    const { itemId } = params; // <-- FIX: Get ID from params
    console.log(`--- DELETE request received for itemId: ${itemId} ---`);

    try {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            console.error("Validation Error: Invalid ObjectId format.");
            return NextResponse.json({ error: 'Invalid Item ID format' }, { status: 400 });
        }

        await connectToDatabase();
        console.log("Database connection successful.");

        console.log(`Attempting to delete document with _id: ${itemId}`);
        const deletedMaterial = await CustomMaterial.findByIdAndDelete(itemId);

        if (!deletedMaterial) {
            console.warn(`Document with _id: ${itemId} was NOT FOUND.`);
            // This warning is now a reliable indicator that the ID truly doesn't exist in the DB.
            return NextResponse.json({ error: 'Material not found in database' }, { status: 404 });
        }

        console.log(`Successfully deleted document with _id: ${itemId}`);
        return NextResponse.json({ success: true, message: 'Material deleted' });

    } catch (error) {
        console.error(`DELETE /api/admin/materials/${itemId} failed with an unexpected error:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}