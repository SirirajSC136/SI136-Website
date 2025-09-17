// lib/canvas.ts

import * as cheerio from 'cheerio';

// Define the raw types we expect back from our fetching logic
export type CanvasModuleItem = {
    id: number;
    title: string;
    type: 'File' | 'Page' | 'Assignment' | 'Quiz' | 'ExternalUrl' | 'Discussion' | 'SubHeader';
    url?: string;
    page_content_files?: { name: string, url: string }[];
};
export type CanvasModule = {
    id: number;
    name: string;
    items: CanvasModuleItem[];
};
export type CanvasCourse = {
    id: number;
    name: string;
    course_code: string;
    term?: { name: string };
    modules: CanvasModule[];
};

/**
 * This function contains the full, comprehensive logic to fetch all courses
 * and their entire module structure from the Canvas API.
 */
export async function fetchAllCanvasCourses(): Promise<CanvasCourse[]> {
    const canvasUrl = process.env.CANVAS_URL;
    const accessToken = process.env.CANVAS_API;
    if (!canvasUrl || !accessToken) {
        throw new Error('Server configuration error: Canvas URL or API token is missing.');
    }
    const headers = { Authorization: `Bearer ${accessToken}` };

    // LEVEL 1: Fetch Courses
    const coursesResponse = await fetch(`${canvasUrl}/courses?include[]=term`, { headers });
    if (!coursesResponse.ok) throw new Error('Failed to fetch courses from Canvas');
    const courses: any[] = await coursesResponse.json();

    // Process all courses in parallel
    const courseDataPromises = courses.map(async (course): Promise<CanvasCourse> => {
        // LEVEL 2: Fetch Modules
        const modulesResponse = await fetch(`${canvasUrl}/courses/${course.id}/modules`, { headers });
        if (!modulesResponse.ok) return { ...course, modules: [] };
        const modules: any[] = await modulesResponse.json();

        // LEVEL 3 & 4: Fetch Module Items and deep-fetch Pages/Files
        const moduleContentPromises = modules.map(async (module): Promise<CanvasModule> => {
            const itemsResponse = await fetch(`${canvasUrl}/courses/${course.id}/modules/${module.id}/items`, { headers });
            if (!itemsResponse.ok) return { ...module, items: [] };
            const items: any[] = await itemsResponse.json();

            const processedItemsPromises = items.map(async (item): Promise<CanvasModuleItem> => {
                const moduleItem: CanvasModuleItem = {
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    url: item.html_url,
                };

                if (item.type === 'Page') {
                    moduleItem.page_content_files = [];
                    try {
                        const pageResponse = await fetch(item.url, { headers });
                        const pageData = await pageResponse.json();
                        if (pageData.body) {
                            const $ = cheerio.load(pageData.body);
                            $('a.instructure_file_link').each((i, el) => {
                                moduleItem.page_content_files!.push({
                                    name: $(el).text().trim(),
                                    url: $(el).attr('href') || '',
                                });
                            });
                        }
                    } catch (e) { /* Silently fail */ }
                }

                if (item.type === 'File') {
                    try {
                        const fileApiResponse = await fetch(item.url, { headers });
                        if (fileApiResponse.ok) {
                            const fileData = await fileApiResponse.json();
                            moduleItem.url = fileData.url;
                        }
                    } catch (e) { /* Silently fail */ }
                }
                return moduleItem;
            });
            const processedItems = await Promise.all(processedItemsPromises);
            return { id: module.id, name: module.name, items: processedItems };
        });
        const populatedModules = await Promise.all(moduleContentPromises);
        return { ...course, modules: populatedModules };
    });

    const finalData = await Promise.all(courseDataPromises);

    // **THE CRITICAL FIX:** Actually return the data.
    return finalData;
}