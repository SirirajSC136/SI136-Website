import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { adminContentService } from "@/lib/server/domains/content/service";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import { createMaterialSchema } from "@/lib/server/domains/content/schemas";
import { createCustomId } from "@/lib/server/domains/content/ids";
import { revalidateSubjectDetailCache } from "@/lib/subjects";
import { withAdminAudit } from "@/lib/server/domains/adminLogs/audit";

export const postAdminMaterialsHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "material.create",
			resourceType: "material",
			resolveResourceId: ({ requestPayload }) =>
				typeof requestPayload?.topicId === "string"
					? `${requestPayload.topicId}:${String(
							(requestPayload.item as Record<string, unknown> | undefined)?.title ?? ""
						)}`
					: undefined,
		},
		async (request: Request) => {
			await requireAdminFromRequest(request);
			const body = await request.json();
			const parsed = createMaterialSchema.safeParse(body);
			if (!parsed.success) {
				throw new HttpError(
					400,
					"Invalid material payload",
					"validation_error",
					parsed.error.flatten()
				);
			}

			const itemId = parsed.data.itemId ?? parsed.data.item.id ?? createCustomId();
			const created = await adminContentService.createMaterial({
				courseId: parsed.data.courseId,
				topicId: parsed.data.topicId,
				itemId,
				item: {
					...parsed.data.item,
					id: itemId,
				},
				interactive: parsed.data.interactive,
			});
			revalidateSubjectDetailCache(created.courseId);
			return NextResponse.json({ success: true, data: created }, { status: 201 });
		}
	)
);
