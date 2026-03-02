import { cookies } from "next/headers";
import { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAuth } from "@/lib/server/firebase/admin";
import { HttpError } from "@/lib/server/http/errors";

export const SESSION_COOKIE_NAME = "si_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = {
	uid: string;
	email?: string;
	name?: string;
	picture?: string;
	isAdmin: boolean;
};

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
	if (!cookieHeader) return {};

	return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
		const [rawName, ...rawValue] = part.trim().split("=");
		if (!rawName || rawValue.length === 0) return acc;
		acc[decodeURIComponent(rawName)] = decodeURIComponent(rawValue.join("="));
		return acc;
	}, {});
}

function mapDecodedToken(token: DecodedIdToken): SessionUser {
	return {
		uid: token.uid,
		email: token.email,
		name: token.name,
		picture: token.picture,
		isAdmin: token.admin === true,
	};
}

export async function createSessionCookie(idToken: string): Promise<string> {
	return getFirebaseAuth().createSessionCookie(idToken, {
		expiresIn: SESSION_MAX_AGE_MS,
	});
}

export async function verifySessionCookieValue(
	sessionCookie: string,
	checkRevoked = true
): Promise<SessionUser> {
	const decoded = await getFirebaseAuth().verifySessionCookie(
		sessionCookie,
		checkRevoked
	);
	return mapDecodedToken(decoded);
}

export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
	if (!sessionCookie) return null;

	try {
		return await verifySessionCookieValue(sessionCookie);
	} catch {
		return null;
	}
}

export async function getSessionUserFromRequest(
	request: Request
): Promise<SessionUser | null> {
	const parsed = parseCookieHeader(request.headers.get("cookie"));
	const sessionCookie = parsed[SESSION_COOKIE_NAME];
	if (!sessionCookie) return null;

	try {
		return await verifySessionCookieValue(sessionCookie);
	} catch {
		return null;
	}
}

export async function requireAuthFromRequest(request: Request): Promise<SessionUser> {
	const user = await getSessionUserFromRequest(request);
	if (!user) {
		throw new HttpError(401, "Authentication required", "unauthenticated");
	}
	return user;
}

export async function requireAdminFromRequest(request: Request): Promise<SessionUser> {
	const user = await requireAuthFromRequest(request);
	if (!user.isAdmin) {
		throw new HttpError(403, "Admin access required", "forbidden");
	}
	return user;
}
