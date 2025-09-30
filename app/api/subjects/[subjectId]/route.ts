// app/api/subjects/[subjectId]/route.ts

import { NextResponse } from 'next/server';
import { mapCanvasCourseToSubject, mapCustomCourseToSubject } from '@/lib/canvasAdapter';
import { fetchCourseDetails } from '@/lib/canvas';
import { fetchCustomMaterialsForCourse } from '@/lib/externalData';
import connectToDatabase from '@/lib/mongodb';
import CustomCourse from '@/models/CustomCourse';
import CustomTopic from '@/models/CustomTopic';
import mongoose from 'mongoose';

export async function GET(
    request: Request,
    context: { params: { subjectId: string } }
) {
    const { subjectId } = context.params;
    console.log(`\n--- [START] API Request for subjectId: ${subjectId} ---`);

    try {
        let subject;

        // 1. Establish DB connection once at the start
        await connectToDatabase();
        console.log(`[LOG] Database connection successful for subject ${subjectId}.`);

        // 2. Fetch the BASE course data first (either from Canvas or Custom DB)
        if (mongoose.Types.ObjectId.isValid(subjectId)) {
            const customCourse = await CustomCourse.findById(subjectId).exec();
            if (!customCourse) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
            subject = mapCustomCourseToSubject(customCourse);
            console.log(`[LOG] Fetched base course from Custom DB: "${subject.title}"`);
        } else {
            const rawCanvasCourse = await fetchCourseDetails(subjectId);
            if (!rawCanvasCourse) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
            subject = mapCanvasCourseToSubject(rawCanvasCourse);
            console.log(`[LOG] Fetched base course from Canvas: "${subject.title}"`);
        }

        // 3. Now, fetch ALL custom additions for this course in parallel
        console.time(`[TIMER] Fetching custom additions for ${subjectId}`);
        const [customTopics, customMaterialsMap] = await Promise.all([
            CustomTopic.find({ courseId: subjectId }).exec(),
            fetchCustomMaterialsForCourse(subjectId)
        ]);
        console.timeEnd(`[TIMER] Fetching custom additions for ${subjectId}`);

        // 4. Perform the MERGE logic
        console.log(`[LOG] Found ${customTopics.length} custom topics to merge.`);
        console.log(`[LOG] Found custom materials for ${customMaterialsMap.size} topics.`);

        // Merge custom topics into the subject's topic list
        if (customTopics.length > 0) {
            const mappedCustomTopics = customTopics.map(topic => ({
                id: (topic._id as any).toString(),
                title: topic.title,
                items: [],
            }));
            subject.topics.push(...mappedCustomTopics);
        }

        // Merge custom materials into the final, combined topic list
        if (customMaterialsMap.size > 0) {
            for (const topic of subject.topics) {
                if (customMaterialsMap.has(topic.id)) {
                    const customItems = customMaterialsMap.get(topic.id)!;
                    topic.items.push(...customItems);
                }
            }
        }

        console.log(`[LOG] Final topic count for subject "${subject.title}": ${subject.topics.length}`);
        console.log(`--- [END] API Request for subjectId: ${subjectId} ---`);
        return NextResponse.json(subject);

    } catch (error) {
        console.error(`[ERROR] Failed to fetch and merge data for subject ${subjectId}:`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}