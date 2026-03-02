import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { adminContentService } from "@/lib/server/domains/content/service";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import { createInteractiveSchema } from "@/lib/server/domains/content/schemas";
import { revalidateSubjectDetailCache } from "@/lib/subjects";
import { withAdminAudit } from "@/lib/server/domains/adminLogs/audit";

export const postAdminInteractiveHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "interactive.create",
			resourceType: "interactive",
			resolveResourceId: ({ requestPayload }) =>
				typeof requestPayload?.courseId === "string"
					? `${requestPayload.courseId}:${String(requestPayload.title ?? "")}`
					: undefined,
		},
		async (request: Request) => {
			await requireAdminFromRequest(request);
			const body = await request.json();
			const parsed = createInteractiveSchema.safeParse(body);
			if (!parsed.success) {
				throw new HttpError(
					400,
					"Invalid interactive content payload",
					"validation_error",
					parsed.error.flatten()
				);
			}

			const created = await adminContentService.createInteractiveContent(parsed.data);
			revalidateSubjectDetailCache(created.courseId);
			return NextResponse.json({ success: true, data: created }, { status: 201 });
		}
	)
);
