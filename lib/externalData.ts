// lib/externalData.ts

import connectToDatabase from '@/lib/mongodb';
import CustomMaterial from '@/models/CustomMaterial';
import { TopicItemData } from '@/types';

type CustomMaterialsMap = Map<string, TopicItemData[]>;

export async function fetchCustomMaterialsForCourse(canvasCourseId: number): Promise<CustomMaterialsMap> {
    const materialsMap: CustomMaterialsMap = new Map();

    try {
        await connectToDatabase();
        const customDocs = await CustomMaterial.find({ canvasCourseId: canvasCourseId });

        for (const doc of customDocs) {
            const moduleId = doc.canvasModuleId.toString();

            const plainDoc = doc.toObject();

            // THE FIX IS HERE: We cast _id to 'any' to safely call .toString()
            // This tells TypeScript to trust us that this operation is valid.
            const item: TopicItemData = {
                _id: (plainDoc._id as any).toString(),
                ...plainDoc.item
            };

            if (!materialsMap.has(moduleId)) {
                materialsMap.set(moduleId, []);
            }
            materialsMap.get(moduleId)!.push(item);
        }
    } catch (error) {
        console.error("Failed to fetch custom materials from MongoDB:", error);
        return new Map();
    }

    return materialsMap;
}