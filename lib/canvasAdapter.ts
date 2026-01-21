// lib/canvasAdapter.ts (Replace the entire file with this)

import { Subject, Topic, TopicItemData } from '@/types';
import { CanvasCourse, CanvasModuleItem } from '@/lib/canvas';
import { ICustomCourse } from '@/models/CustomCourse'; // Import the new type

export function mapCustomCourseToSubject(course: ICustomCourse): Subject {
    return {
        _id: course.id.toString(),
        courseCode: course.courseCode,
        title: course.title,
        year: course.year,
        semester: course.semester,
        imageUrl: `/images/subjects/${course.id}.png`, // Different color for custom
        canvasUrl: '', // No Canvas URL for custom courses
        filesUrl: '',
        syllabus: '',
        // Map the topics from the custom course document
        topics: course.topics.map(topic => ({
            id: topic._id.toString(),
            title: topic.title,
            items: [], // Items will be merged in the detail page API
        })),
    };
}

function parseTerm(termName: string | undefined): { year: number, semester: number } {
    if (!termName) {
        return { year: new Date().getFullYear(), semester: 1 };
    }

    // Try to parse format like "2/2568" or "1/2567"
    const slashMatch = termName.match(/^(\d)\/(\d{4})$/);
    if (slashMatch) {
        return {
            semester: parseInt(slashMatch[1], 10),
            year: parseInt(slashMatch[2], 10),
        };
    }

    // Try to parse format like "Semester 2 2024" or "2024 Semester 1"
    const semesterMatch = termName.match(/[Ss]emester\s*(\d)/i);
    const yearMatch = termName.match(/\b(20\d{2})\b/);

    return {
        year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
        semester: semesterMatch ? parseInt(semesterMatch[1], 10) : 1,
    };
}

/**
 * Maps a single raw Canvas module item to our clean frontend TopicItemData type.
 */
function mapCanvasItemToTopicItem(item: CanvasModuleItem): TopicItemData | null {
    switch (item.type) {
        case 'SubHeader':
            return {
                id: item.id.toString(),
                title: item.title,
                type: 'Header',
            };
        case 'File':
            if (!item.url) return null;
            return {
                id: item.id.toString(),
                title: item.title,
                type: 'File',
                url: item.url,
            };
        case 'ExternalUrl':
            if (!item.external_url) return null;
            return {
                id: item.id.toString(),
                title: item.title,
                type: 'Link',
                url: item.external_url,
            };
        case 'Page':
            // We prioritize rendering the full page content
            if (item.html_content) {
                return {
                    id: item.id.toString(),
                    title: item.title,
                    type: 'Page',
                    htmlContent: item.html_content,
                    canvasUrl: item.url,
                };
            }
            return null; // Don't render empty pages

        // For now, we will treat these as simple links to their Canvas pages
        case 'Assignment':
        case 'Quiz':
        case 'Discussion':
            return {
                id: item.id.toString(),
                title: item.title,
                type: 'Link',
                url: item.url,
            };

        default:
            return null; // Ignore any other types
    }
}

/**
 * Transforms a single raw Canvas course object into the `Subject` shape.
 */
export function mapCanvasCourseToSubject(course: CanvasCourse): Subject {
    const { year, semester } = parseTerm(course.term?.name);

    const topics: Topic[] = course.modules.map(module => {
        const items: TopicItemData[] = [];

        if (Array.isArray(module.items)) {
            for (const item of module.items) {
                const mappedItem = mapCanvasItemToTopicItem(item);
                if (mappedItem) {
                    items.push(mappedItem);
                }
            }
        }

        return {
            id: module.id.toString(),
            title: module.name,
            items: items, // Use the new, rich items array
        };
    });

    return {
        _id: course.id.toString(),
        courseCode: course.course_code,
        title: course.name,
        year: year,
        semester: semester,
        imageUrl: `/images/subjects/${course.id}.png`,
        canvasUrl: `https://sirirajcanvas.instructure.com/courses/${course.id}`,
        filesUrl: `https://sirirajcanvas.instructure.com/courses/${course.id}/files`,
        syllabus: '',
        topics: topics,
    };
}