// lib/canvas.ts

import * as cheerio from 'cheerio';
import { parseLinkHeader } from '@web3-storage/parse-link-header';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================
export type CanvasModuleItem = {
    id: number;
    title: string;
    type: 'File' | 'Page' | 'Assignment' | 'Quiz' | 'ExternalUrl' | 'Discussion' | 'SubHeader';
    url?: string;
    external_url?: string;
    html_content?: string;
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

// ===================================================================
// CONFIGURATION & SHARED HELPERS
// ===================================================================
const CANVAS_URL = process.env.CANVAS_URL;
const ACCESS_TOKEN = process.env.CANVAS_API;
const CANVAS_HOSTNAME = process.env.CANVAS_URL_HOSTNAME || 'instructure.com';

function getHeaders() {
    if (!CANVAS_URL || !ACCESS_TOKEN) {
        throw new Error('Server configuration error: Canvas URL or API token is missing.');
    }
    return { Authorization: `Bearer ${ACCESS_TOKEN}` };
}

async function fetchAllPaginated(url: string): Promise<any[]> {
    let results: any[] = [];
    let nextUrl: string | null = url;
    const headers = getHeaders();

    while (nextUrl) {
        // Added Next.js revalidation for caching (5 minutes)
        const response = await fetch(nextUrl, { headers, next: { revalidate: 300 } });
        if (!response.ok) {
            throw new Error(`Failed to fetch paginated data from ${nextUrl}: ${response.statusText}`);
        }
        const pageData = await response.json();
        results = results.concat(pageData);
        const linkHeader = response.headers.get('Link');
        if (linkHeader) {
            const parsedLinks = parseLinkHeader(linkHeader);
            nextUrl = parsedLinks?.next ? parsedLinks.next.url : null;
        } else {
            nextUrl = null;
        }
    }
    return results;
}

// ===================================================================
// THE DEFINITIVE, CORRECTED FILE URL RESOLVER
// ===================================================================
/**
 * Takes ANY Canvas file URL and correctly resolves it to a direct download link.
 * It intelligently handles both JSON API responses and web page redirects.
 * @param anyUrl The Canvas URL for a file.
 * @returns The direct download URL or the original URL if it fails.
 */
async function resolveApiFileUrl(apiUrl: string): Promise<string> {
    try {
        const headers = getHeaders();
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) return apiUrl;

        const data = await response.json();
        return data.url || apiUrl; // Return the URL from the JSON
    } catch (error) {
        console.error(`Failed to resolve API file URL for ${apiUrl}:`, error);
        return apiUrl;
    }
}

// ===================================================================
// CORE LOGIC: PROCESSING ITEMS AND COURSES
// ===================================================================

/**
 * Processes a single module item, fetching details and resolving file URLs.
 */
async function processModuleItem(item: any): Promise<CanvasModuleItem> {
    const moduleItem: CanvasModuleItem = {
        id: item.id,
        title: item.title,
        type: item.type,
        url: item.html_url,
        external_url: item.external_url,
    };

    if (item.type === 'File' && item.url) {
        moduleItem.url = await resolveApiFileUrl(item.url);
    }

    if (item.type === 'ExternalUrl') {
        const externalUrl = item.external_url;
        if (externalUrl && (externalUrl.includes('/files/') || externalUrl.includes('instructure_file_link'))) {
            const url = new URL(externalUrl);
            const baseUrl = `${url.origin}${url.pathname}`;
            moduleItem.type = 'File';
            moduleItem.url = `${baseUrl}/download?download_frd=1`;
        }
    }

    if (item.type === 'Page' && item.url) {
        try {
            const headers = getHeaders();
            const response = await fetch(item.url, { headers });

            // 1. Check if the fetch was successful
            if (!response.ok) {
                console.warn(`Failed to fetch Page item ${item.id}, status: ${response.status}`);
                return moduleItem; // Return the item without content to prevent a crash
            }

            // 2. Check if the response is actually JSON before trying to parse it
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const pageData = await response.json();
                if (pageData.body) {
                    const $ = cheerio.load(pageData.body);
                    const fileLinks = $('a.instructure_file_link');

                    if (fileLinks.length === 1) {
                        const link = fileLinks.first();
                        let fileHref = link.attr('href');
                        const fileTitle = link.text().trim();
                        if (fileHref) {
                            const url = new URL(fileHref);
                            const baseUrl = `${url.origin}${url.pathname}`;
                            const correctDownloadUrl = `${baseUrl}/download?download_frd=1`;

                            moduleItem.type = 'File';
                            moduleItem.title = fileTitle || moduleItem.title;
                            moduleItem.url = correctDownloadUrl;
                            moduleItem.html_content = undefined;
                            return moduleItem;
                        }
                    }

                    moduleItem.html_content = pageData.body;
                }
            } else {
                // 3. If not JSON, log it for debugging and move on gracefully
                console.warn(`Page item ${item.id} did not return JSON. Content-Type: ${contentType}. Skipping content processing.`);
            }
        } catch (error) {
            // This will catch any other unexpected errors during processing
            console.error(`Failed to process Page item ${item.id}:`, error);
        }
    }

    return moduleItem;
}

/**
 * Fetches and processes all module items for a given module.
 */
async function fetchAndProcessModule(courseId: string, module: any): Promise<CanvasModule> {
    try {
        const itemsUrl = `${CANVAS_URL}/courses/${courseId}/modules/${module.id}/items`;
        const items: any[] = await fetchAllPaginated(itemsUrl);
        const processedItems = await Promise.all(items.map(processModuleItem));
        return { id: module.id, name: module.name, items: processedItems };
    } catch (error) {
        console.error(`Failed to fetch items for module ${module.id}:`, error);
        return { ...module, items: [] };
    }
}

/**
 * Fetches all details for a single course, including all modules and their items.
 */
export async function fetchCourseDetails(courseId: string): Promise<CanvasCourse | null> {
    const headers = getHeaders();

    // --- THIS IS THE FIX ---
    // We add `include[]=public_description` to the fetch URL.
    // This tells the Canvas API to include more metadata in the response,
    // crucially ensuring the `course_code` property is present.
    const courseUrl = `${CANVAS_URL}/courses/${courseId}?include[]=term&include[]=public_description`;
    const modulesUrl = `${CANVAS_URL}/courses/${courseId}/modules`;

    const [courseResult, modulesData] = await Promise.all([
        fetch(courseUrl, { headers }),
        fetchAllPaginated(modulesUrl)
    ]);

    if (!courseResult.ok) return null;
    const course = await courseResult.json();

    course.modules = await Promise.all(modulesData.map(module => fetchAndProcessModule(courseId, module)));
    return course;
}


/**
 * Fetches a list of all courses the user is enrolled in (SHALLOW FETCH).
 * Uses fetchAllPaginated to correctly follow Canvas pagination links,
 * ensuring courses beyond the first page (Canvas default: 10/page) are included.
 */
export async function fetchEnrolledCourses(): Promise<CanvasCourse[]> {
    const url = `${CANVAS_URL}/courses?per_page=100&include[]=term&enrollment_state[]=active&enrollment_state[]=invited&enrollment_state[]=completed&enrollment_state[]=inactive`;
    const coursesData: any[] = await fetchAllPaginated(url);

    return coursesData.map(course => ({
        id: course.id,
        name: course.name,
        course_code: course.course_code,
        term: course.term,
        modules: [],
    }));
}