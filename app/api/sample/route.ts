import { NextRequest, NextResponse } from 'next/server';

const CANVAS_API_URL = process.env.CANVAS_URL;
const CANVAS_API_TOKEN = process.env.CANVAS_API;

if (!CANVAS_API_URL || !CANVAS_API_TOKEN) {
    throw new Error('Canvas API URL or Token is not configured in .env.local');
}

const parseLinkHeader = (header: string | null): { [key: string]: string } => {
    if (!header) return {};
    const links: { [key: string]: string } = {};
    header.split(',').forEach(part => {
        const section = part.split(';');
        if (section.length < 2) return;
        const url = section[0].replace(/<(.*)>/, '$1').trim();
        const name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    });
    return links;
};

const canvasApiFetch = async (path: string) => {
    const url = path.startsWith('http') ? path : `${CANVAS_API_URL}/api/v1${path}`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${CANVAS_API_TOKEN}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Canvas API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
};

const fetchAllPages = async (initialPath: string) => {
    let results: any[] = [];
    let nextUrl: string | null = `${CANVAS_API_URL}/api/v1${initialPath}`;

    while (nextUrl) {
        const response = await canvasApiFetch(nextUrl);
        const data = await response.json();
        results = results.concat(data);

        const links = parseLinkHeader(response.headers.get('Link'));
        nextUrl = links.next || null;
    }

    return results;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const assignmentId = searchParams.get('assignmentId');

    try {
        let data;
        switch (resource) {
            // User-level endpoints
            case 'profile':
                data = await (await canvasApiFetch('/users/self/profile')).json();
                break;
            case 'courses':
                data = await fetchAllPages('/courses?enrollment_state=active&include[]=term');
                break;
            case 'activity_stream':
                data = await fetchAllPages('/users/self/activity_stream');
                break;

            // Course-level endpoints
            case 'course_details':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await (await canvasApiFetch(`/courses/${courseId}`)).json();
                break;
            case 'assignments':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/assignments`);
                break;
            case 'students':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/users?enrollment_type[]=student`);
                break;
            case 'teachers':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/users?enrollment_type[]=teacher`);
                break;
            case 'announcements':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/discussion_topics?only_announcements=true`);
                break;
            case 'modules':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/modules?include[]=items`);
                break;
            case 'quizzes':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/quizzes`);
                break;
            case 'files':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/files`);
                break;
            case 'pages':
                if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/pages`);
                break;

            // Submission-level endpoints
            case 'submissions':
                if (!courseId || !assignmentId) return NextResponse.json({ error: 'courseId and assignmentId are required' }, { status: 400 });
                data = await fetchAllPages(`/courses/${courseId}/assignments/${assignmentId}/submissions`);
                break;
            case 'submission_single':
                if (!courseId || !assignmentId || !userId) return NextResponse.json({ error: 'courseId, assignmentId, and userId are required' }, { status: 400 });
                data = await (await canvasApiFetch(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`)).json();
                break;

            default:
                return NextResponse.json({ error: 'Invalid or missing resource specified' }, { status: 400 });
        }
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}