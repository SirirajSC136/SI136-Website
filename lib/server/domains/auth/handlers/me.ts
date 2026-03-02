import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { getSessionUserFromRequest } from "@/lib/server/domains/auth/service";

export const getAuthMeHandler = withErrorHandling(async (request: Request) => {
	const user = await getSessionUserFromRequest(request);
	if (!user) {
		throw new HttpError(401, "Authentication required", "unauthenticated");
	}
	return NextResponse.json({ user });
});

