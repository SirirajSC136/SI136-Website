import { NextResponse } from 'next/server';
import { mapCanvasCourseToSubject } from '@/lib/canvasAdapter';
import * as cheerio from 'cheerio';
import { CanvasCourse, CanvasModule, CanvasModuleItem } from '@/lib/canvas';

const CANVAS_URL = process.env.CANVAS_URL;
const ACCESS_TOKEN = process.env.CANVAS_API;
const HEADERS = { Authorization: `Bearer ${ACCESS_TOKEN}` };

/**
 * Processes a single module item, fetching its true file URL or page content.
 */
async function processModuleItem(item: any): Promise<CanvasModuleItem> {
    const moduleItem: CanvasModuleItem = { id: item.id, title: item.title, type: item.type, url: item.html_url };

    if (item.type === 'Page' && item.url) {
        moduleItem.page_content_files = [];
        try {
            const pageData = await (await fetch(item.url, { headers: HEADERS })).json();
            if (pageData.body) {
                const $ = cheerio.load(pageData.body);
                $('a.instructure_file_link').each((i, el) => {
                    moduleItem.page_content_files!.push({ name: $(el).text().trim(), url: $(el).attr('href') || '' });
                });
            }
        } catch (error) {
            console.error(`Failed to process Page item ${item.id}:`, error);
        }
    }

    if (item.type === 'File' && item.url) {
        try {
            const fileData = await (await fetch(item.url, { headers: HEADERS })).json();
            moduleItem.url = fileData.url;
        } catch (error) {
            console.error(`Failed to process File item ${item.id}:`, error);
        }
    }
    return moduleItem;
}

/**
 * Fetches and processes all module items for a given module.
 */
async function fetchAndProcessModule(courseId: string, module: any): Promise<CanvasModule> {
    try {
        const itemsResponse = await fetch(`${CANVAS_URL}/courses/${courseId}/modules/${module.id}/items`, { headers: HEADERS });
        if (!itemsResponse.ok) return { ...module, items: [] };

        const items: any[] = await itemsResponse.json();
        const processedItems = await Promise.all(items.map(processModuleItem));
        return { id: module.id, name: module.name, items: processedItems };
    } catch (error) {
        console.error(`Failed to fetch items for module ${module.id}:`, error);
        return { ...module, items: [] }; // Return gracefully
    }
}

/**
 * Main function to fetch and assemble all data for a single course.
 */
async function fetchSingleCanvasCourse(courseId: string): Promise<CanvasCourse | null> {
    if (!CANVAS_URL || !ACCESS_TOKEN) throw new Error("Server configuration error");

    // --- PERFORMANCE UPGRADE: Fetch course details and module list in parallel ---
    const [courseResult, modulesResult] = await Promise.all([
        fetch(`${CANVAS_URL}/courses/${courseId}?include[]=term&include[]=syllabus_body`, { headers: HEADERS }),
        fetch(`${CANVAS_URL}/courses/${courseId}/modules`, { headers: HEADERS })
    ]);

    if (!courseResult.ok) return null;
    const course = await courseResult.json();

    if (!modulesResult.ok) {
        course.modules = [];
        return course;
    }
    const modulesData: any[] = await modulesResult.json();

    // Process all modules concurrently
    course.modules = await Promise.all(modulesData.map(module => fetchAndProcessModule(courseId, module)));

    return course;
}

export async function GET(
    request: Request,
    { params: { subjectId } }: { params: { subjectId: string } }
) {
    try {
        const rawCanvasCourse = await fetchSingleCanvasCourse(subjectId);

        if (!rawCanvasCourse) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        const subject = mapCanvasCourseToSubject(rawCanvasCourse);
        return NextResponse.json(subject);

    } catch (error) {
        console.error(`Failed to fetch Canvas data for subject ${subjectId}:`, error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}