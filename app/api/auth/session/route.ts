import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionSchema } from "@/lib/server/validation/auth";
import {
	createSessionCookie,
	SESSION_COOKIE_NAME,
	SESSION_MAX_AGE_MS,
} from "@/lib/server/auth/session";
import { getFirebaseAuth } from "@/lib/server/firebase/admin";
import { HttpError, toErrorResponse } from "@/lib/server/http/errors";

export const runtime = "nodejs";

function isAllowedEmail(email?: string | null): boolean {
	if (!email) return false;
	return (
		email.endsWith("@student.mahidol.edu") ||
		email.endsWith("@student.mahidol.ac.th")
	);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const parsed = createSessionSchema.safeParse(body);
		if (!parsed.success) {
			throw new HttpError(400, "Invalid auth payload", "validation_error");
		}

		const decoded = await getFirebaseAuth().verifyIdToken(parsed.data.idToken);
		if (!isAllowedEmail(decoded.email)) {
			throw new HttpError(403, "Only student accounts are allowed", "forbidden");
		}

		const sessionCookie = await createSessionCookie(parsed.data.idToken);
		const cookieStore = await cookies();
		cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return toErrorResponse(error);
	}
}

export async function DELETE() {
	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});
	return NextResponse.json({ success: true });
}
