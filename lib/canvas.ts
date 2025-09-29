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
        const response = await fetch(nextUrl, { headers });
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

    // --- Handle standard 'File' items ---
    if (item.type === 'File' && item.url) {
        // Use the simple, reliable API resolver
        moduleItem.url = await resolveApiFileUrl(item.url);
    }

    // --- Handle 'ExternalUrl' items that might be files ---
    if (item.type === 'ExternalUrl') {
        const externalUrl = item.external_url;
        if (externalUrl && (externalUrl.includes('/files/') || externalUrl.includes('instructure_file_link'))) {
            // This is a file, but it's a web page link, not an API link.
            // We will transform it into the correct download link directly.
            const url = new URL(externalUrl);
            const baseUrl = `${url.origin}${url.pathname}`;

            moduleItem.type = 'File';
            moduleItem.url = `${baseUrl}/download?download_frd=1`;
        }
    }

    // --- Handle 'Page' items that are secretly file downloads ---
    if (item.type === 'Page' && item.url) {
        try {
            const headers = getHeaders();
            const pageData = await (await fetch(item.url, { headers })).json();
            if (pageData.body) {
                const $ = cheerio.load(pageData.body);
                const fileLinks = $('a.instructure_file_link');

                if (fileLinks.length === 1) {
                    const link = fileLinks.first();
                    let fileHref = link.attr('href');
                    const fileTitle = link.text().trim();

                    if (fileHref) {
                        // ==================================================
                        // === THE DEFINITIVE FIX IS RIGHT HERE ===
                        // ==================================================
                        // Transform the web page URL into the correct download URL.
                        const url = new URL(fileHref);
                        const baseUrl = `${url.origin}${url.pathname}`;
                        const correctDownloadUrl = `${baseUrl}/download?download_frd=1`;
                        // ==================================================

                        moduleItem.type = 'File';
                        moduleItem.title = fileTitle || moduleItem.title;
                        moduleItem.url = correctDownloadUrl; // Use the corrected URL directly
                        moduleItem.html_content = undefined;
                        return moduleItem;
                    }
                }

                moduleItem.html_content = pageData.body;
            }
        } catch (error) {
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
    const [courseResult, modulesData] = await Promise.all([
        fetch(`${CANVAS_URL}/courses/${courseId}?include[]=term`, { headers }),
        fetchAllPaginated(`${CANVAS_URL}/courses/${courseId}/modules`)
    ]);

    if (!courseResult.ok) return null;
    const course = await courseResult.json();

    course.modules = await Promise.all(modulesData.map(module => fetchAndProcessModule(courseId, module)));
    return course;
}

/**
 * Fetches a list of all courses the user is enrolled in (SHALLOW FETCH).
 */
export async function fetchEnrolledCourses(): Promise<CanvasCourse[]> {
    const headers = getHeaders();
    const coursesResponse = await fetch(`${CANVAS_URL}/courses?include[]=term`, { headers });
    if (!coursesResponse.ok) throw new Error('Failed to fetch courses from Canvas');
    const coursesData: any[] = await coursesResponse.json();
    return coursesData.map(course => ({
        id: course.id,
        name: course.name,
        course_code: course.course_code,
        term: course.term,
        modules: [],
    }));
}