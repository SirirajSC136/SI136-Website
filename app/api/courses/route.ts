// app/api/courses/route.ts

import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// --- TYPE DEFINITIONS (No changes) ---
type ModuleItem = {
    id: number;
    title: string;
    type: 'File' | 'Page' | 'Assignment' | 'Quiz' | 'ExternalUrl' | 'Discussion' | 'SubHeader';
    url?: string;
    page_content_files?: { name: string, url: string }[];
};
type Module = {
    id: number;
    name: string;
    items: ModuleItem[];
};
type CourseWithModules = {
    id: number;
    name: string;
    course_code: string;
    modules: Module[];
};

export async function GET(request: Request) {
    console.log("\n--- [API] Starting new comprehensive fetch for all course content ---");

    const canvasUrl = process.env.CANVAS_URL;
    const accessToken = process.env.CANVAS_API;
    if (!canvasUrl || !accessToken) {
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }
    const headers = { Authorization: `Bearer ${accessToken}` };

    try {
        const coursesResponse = await fetch(`${canvasUrl}/courses?include[]=term`, { headers });
        if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
        const courses: any[] = await coursesResponse.json();

        const courseDataPromises = courses.map(async (course): Promise<CourseWithModules> => {
            const modulesResponse = await fetch(`${canvasUrl}/courses/${course.id}/modules`, { headers });
            if (!modulesResponse.ok) return { ...course, modules: [] };
            const modules: any[] = await modulesResponse.json();

            const moduleContentPromises = modules.map(async (module): Promise<Module> => {
                const itemsResponse = await fetch(`${canvasUrl}/courses/${course.id}/modules/${module.id}/items`, { headers });
                if (!itemsResponse.ok) return { ...module, items: [] };
                const items: any[] = await itemsResponse.json();

                const processedItemsPromises = items.map(async (item): Promise<ModuleItem> => {
                    const moduleItem: ModuleItem = {
                        id: item.id,
                        title: item.title,
                        type: item.type,
                        url: item.html_url, // Default URL
                    };

                    // --- FIX FOR 'Page' ITEMS ---
                    if (item.type === 'Page') {
                        // **THE FIX for TypeScript:** Initialize the array unconditionally right away.
                        moduleItem.page_content_files = [];
                        try {
                            const pageResponse = await fetch(item.url, { headers });
                            const pageData = await pageResponse.json();
                            if (pageData.body) {
                                const $ = cheerio.load(pageData.body);
                                $('a.instructure_file_link').each((i, el) => {
                                    moduleItem.page_content_files?.push({
                                        name: $(el).text().trim(),
                                        // We assume links inside pages are direct, but if not, a fetch would be needed here too.
                                        url: $(el).attr('href') || '',
                                    });
                                });
                            }
                        } catch (e) {
                            console.error(`Failed to deep-fetch page content for item ${item.id}`);
                        }
                    }

                    // --- FIX FOR 'File' ITEMS ---
                    if (item.type === 'File') {
                        try {
                            // **THE FIX for PDF Links:** The item.url is an API endpoint. We must fetch it
                            // to get the JSON metadata and extract the *real* download URL.
                            const fileApiResponse = await fetch(item.url, { headers });
                            if (fileApiResponse.ok) {
                                const fileData = await fileApiResponse.json();
                                // Replace the API URL with the actual download URL.
                                moduleItem.url = fileData.url;
                            } else {
                                // If we can't get the real URL, keep the API URL as a fallback.
                                moduleItem.url = item.url;
                            }
                        } catch (e) {
                            console.error(`Failed to fetch direct download URL for file ${item.id}`);
                            moduleItem.url = item.url; // Fallback on error
                        }
                    }

                    return moduleItem;
                });

                const processedItems = await Promise.all(processedItemsPromises);
                return { id: module.id, name: module.name, items: processedItems };
            });

            const populatedModules = await Promise.all(moduleContentPromises);
            return { id: course.id, name: course.name, course_code: course.course_code, modules: populatedModules };
        });

        const finalData = await Promise.all(courseDataPromises);
        console.log("[LOG] All data processing complete. Sending response.");
        return NextResponse.json(finalData, { status: 200 });

    } catch (error) {
        console.error("[ERROR] An unhandled exception occurred:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}