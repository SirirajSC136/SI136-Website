import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import { adminLogsQuerySchema } from "@/lib/server/domains/adminLogs/schemas";
import { adminLogsService } from "@/lib/server/domains/adminLogs/service";

export const getAdminLogsHandler = withErrorHandling(async (request: Request) => {
	await requireAdminFromRequest(request);
	const { searchParams } = new URL(request.url);
	const parsed = adminLogsQuerySchema.safeParse({
		cursor: searchParams.get("cursor") ?? undefined,
		limit: searchParams.get("limit") ?? undefined,
		action: searchParams.get("action") ?? undefined,
		status: searchParams.get("status") ?? undefined,
		actorEmail: searchParams.get("actorEmail") ?? undefined,
		from: searchParams.get("from") ?? undefined,
		to: searchParams.get("to") ?? undefined,
	});

	if (!parsed.success) {
		throw new HttpError(
			400,
			"Invalid log query",
			"validation_error",
			parsed.error.flatten()
		);
	}

	const result = await adminLogsService.listLogs({
		limit: parsed.data.limit ?? 25,
		cursor: parsed.data.cursor,
		action: parsed.data.action,
		status: parsed.data.status,
		actorEmail: parsed.data.actorEmail,
		from: parsed.data.from,
		to: parsed.data.to,
	});

	return NextResponse.json({ success: true, data: result });
});
