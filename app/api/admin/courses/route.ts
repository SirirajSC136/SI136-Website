import {
	deleteAdminCoursesHandler,
	postAdminCoursesHandler,
} from "@/lib/server/domains/content/handlers/courses";

export const runtime = "nodejs";

export const POST = postAdminCoursesHandler;
export const DELETE = deleteAdminCoursesHandler;
