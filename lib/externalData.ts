// lib/externalData.ts

import connectToDatabase from '@/lib/mongodb';
import CustomMaterial from '@/models/CustomMaterial';
import { TopicItemData } from '@/types';

type CustomMaterialsMap = Map<string, TopicItemData[]>;

export async function fetchCustomMaterialsForCourse(courseId: string): Promise<CustomMaterialsMap> {
    const materialsMap: CustomMaterialsMap = new Map();
    try {
        await connectToDatabase();

        // THE FIX: Add a condition to the find query to exclude items of type 'Video'.
        // We are telling MongoDB to find all materials for the course
        // WHERE the nested 'item.type' field is "not equal" ($ne) to 'Video'.
        const customDocs = await CustomMaterial.find({
            courseId: courseId,
            'item.type': { $ne: 'Video' } // <-- THIS IS THE ONLY CHANGE NEEDED
        });

        for (const doc of customDocs) {
            const topicId = doc.topicId.toString();
            const plainDoc = doc.toObject();

            const item: TopicItemData = {
                id: (plainDoc._id as any).toString(),
                ...plainDoc.item
            };

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