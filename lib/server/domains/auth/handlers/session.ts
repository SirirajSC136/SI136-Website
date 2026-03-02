import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { createSessionSchema } from "@/lib/server/domains/auth/schemas";
import {
	createSessionCookie,
	SESSION_COOKIE_NAME,
	SESSION_MAX_AGE_MS,
} from "@/lib/server/domains/auth/service";
import { getFirebaseAuth } from "@/lib/server/integrations/firebase/admin";
import { isAllowedStudentEmail } from "@/lib/server/domains/admins/utils";

export const postAuthSessionHandler = withErrorHandling(async (request: Request) => {
	const body = await request.json();
	const parsed = createSessionSchema.safeParse(body);
	if (!parsed.success) {
		throw new HttpError(400, "Invalid auth payload", "validation_error");
	}

	const decoded = await getFirebaseAuth().verifyIdToken(parsed.data.idToken);
	if (!isAllowedStudentEmail(decoded.email)) {
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
});

export const deleteAuthSessionHandler = async () => {
	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE_NAME, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});
	return NextResponse.json({ success: true });
};
