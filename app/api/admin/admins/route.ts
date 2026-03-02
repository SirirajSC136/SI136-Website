import {
	deleteAdminUsersHandler,
	getAdminUsersHandler,
	postAdminUsersHandler,
} from "@/lib/server/domains/admins/handlers/admins";

export const runtime = "nodejs";

export const GET = getAdminUsersHandler;
export const POST = postAdminUsersHandler;
export const DELETE = deleteAdminUsersHandler;
