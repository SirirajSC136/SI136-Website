import { Subject, Topic, TopicFile } from '@/types';
import { CanvasCourse } from '@/lib/canvas'; // Assuming your raw Canvas types are in this file

/**
 * Parses a Canvas term name (e.g., "1st Semester 2025") into year and semester.
 * This may need adjustment if your term names have a different format.
 */
function parseTerm(termName: string | undefined): { year: number, semester: number } {
    if (!termName) {
        // Fallback to the current year and a default semester if no term is provided
        return { year: new Date().getFullYear(), semester: 1 };
    }

    const yearMatch = termName.match(/\d{4}/);
    const semesterMatch = termName.match(/(\d)/); // Gets the first digit

    return {
        year: yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear(),
        semester: semesterMatch ? parseInt(semesterMatch[0], 10) : 1,
    };
}

/**
 * Transforms a single raw Canvas course object into the `Subject` shape
 * that your frontend components expect.
 */
export function mapCanvasCourseToSubject(course: CanvasCourse): Subject {
    const { year, semester } = parseTerm(course.term?.name);

    const topics: Topic[] = course.modules.map(module => {
        const files: TopicFile[] = [];

        // Ensure module.items exists and is an array before iterating
        if (Array.isArray(module.items)) {
            module.items.forEach(item => {
                // Add direct files from the module
                if (item.type === 'File' && item.url) {
                    files.push({ id: item.id.toString(), title: item.title, url: item.url });
                }
                // Add files found embedded inside of Pages
                if (item.page_content_files) {
                    item.page_content_files.forEach(file => {
                        // Create a unique-ish ID for embedded files
                        files.push({ id: `${item.id}-${file.name}`, title: file.name, url: file.url });
                    });
                }
            });
        }

        return {
            id: module.id.toString(),
            title: module.name,
            files: files,
        };
    });

    return {
        _id: course.id.toString(),
        courseCode: course.course_code,
        title: course.name,
        year: year,
        semester: semester,
        imageUrl: `https://placehold.co/400x400/0056d2/FFF?text=${encodeURIComponent(course.course_code)}`,
        canvasUrl: `https://sirirajcanvas.instructure.com/courses/${course.id}`,
        filesUrl: `https://sirirajcanvas.instructure.com/courses/${course.id}/files`,
        // This safely handles cases where syllabus_body is null, undefined, or missing.
        syllabus: '',
        topics: topics,
    };
}