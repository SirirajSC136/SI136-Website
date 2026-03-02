import {
	deleteAuthSessionHandler,
	postAuthSessionHandler,
} from "@/lib/server/domains/auth/handlers/session";

export const runtime = "nodejs";

export const POST = postAuthSessionHandler;
export const DELETE = deleteAuthSessionHandler;
