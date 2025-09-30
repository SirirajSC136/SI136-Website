// lib/externalData.ts

import connectToDatabase from '@/lib/mongodb';
import CustomMaterial from '@/models/CustomMaterial';
import { TopicItemData } from '@/types';

type CustomMaterialsMap = Map<string, TopicItemData[]>;

export async function fetchCustomMaterialsForCourse(courseId: string): Promise<CustomMaterialsMap> {
    const materialsMap: CustomMaterialsMap = new Map();

    try {
        await connectToDatabase();
        const customDocs = await CustomMaterial.find({ courseId: courseId });

        for (const doc of customDocs) {
            const topicId = doc.topicId.toString();

            const plainDoc = doc.toObject();

            // ==================================================
            // === THE DEFINITIVE FIX IS RIGHT HERE ===
            // ==================================================
            // We use a type assertion '(plainDoc._id as any)' to tell TypeScript
            // to trust us that this value has a .toString() method.
            const item: TopicItemData = {
                _id: (plainDoc._id as any).toString(),
                ...plainDoc.item
            };
            // ==================================================

            if (!materialsMap.has(topicId)) {
                materialsMap.set(topicId, []);
            }
            materialsMap.get(topicId)!.push(item);
        }
    } catch (error) {
        console.error("Failed to fetch custom materials from MongoDB:", error);
        return new Map();
    }

    return materialsMap;
}