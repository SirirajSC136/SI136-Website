import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/server/auth/session";
import { HttpError, toErrorResponse } from "@/lib/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
	try {
		const user = await getSessionUserFromRequest(request);
		if (!user) {
			throw new HttpError(401, "Authentication required", "unauthenticated");
		}
		return NextResponse.json({ user });
	} catch (error) {
		return toErrorResponse(error);
	}
}
