import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { adminContentService } from "@/lib/server/domains/content/service";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import { isCustomId } from "@/lib/server/domains/content/ids";
import { updateMaterialSchema } from "@/lib/server/domains/content/schemas";
import { revalidateSubjectDetailCache } from "@/lib/subjects";
import { withAdminAudit } from "@/lib/server/domains/adminLogs/audit";

function getItemIdFromPath(request: Request): string | undefined {
	const segments = new URL(request.url).pathname.split("/");
	return segments[segments.length - 1] || undefined;
}

export const putAdminMaterialByIdHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "material.update",
			resourceType: "material",
			resolveResourceId: ({ request }) => getItemIdFromPath(request),
		},
		async (
			request: Request,
			{ params }: { params: Promise<{ itemId: string }> }
		) => {
			await requireAdminFromRequest(request);
			const { itemId } = await params;
			if (!isCustomId(itemId)) {
				throw new HttpError(400, "Invalid Item ID format", "validation_error");
			}

			const body = await request.json();
			const parsed = updateMaterialSchema.safeParse(body);
			if (!parsed.success) {
				throw new HttpError(
					400,
					"Invalid material payload",
					"validation_error",
					parsed.error.flatten()
				);
			}

			const updated = await adminContentService.updateMaterial(
				itemId,
				{
					courseId: parsed.data.courseId,
					topicId: parsed.data.topicId,
					item: {
						...parsed.data.item,
						id: parsed.data.item.id ?? itemId,
					},
					interactive: parsed.data.interactive,
				},
				{
				courseId: parsed.data.courseId,
				topicId: parsed.data.topicId,
				}
			);
			revalidateSubjectDetailCache(updated.courseId);
			return NextResponse.json({ success: true, data: updated });
		}
	)
);

export const deleteAdminMaterialByIdHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "material.delete",
			resourceType: "material",
			resolveResourceId: ({ request }) => getItemIdFromPath(request),
		},
		async (
			request: Request,
			{ params }: { params: Promise<{ itemId: string }> }
		) => {
			await requireAdminFromRequest(request);
			const { itemId } = await params;
			if (!isCustomId(itemId)) {
				throw new HttpError(400, "Invalid Item ID format", "validation_error");
			}

			const { searchParams } = new URL(request.url);
			const deleted = await adminContentService.deleteMaterial(itemId, {
				courseId: searchParams.get("courseId") ?? undefined,
				topicId: searchParams.get("topicId") ?? undefined,
			});
			if (deleted.courseId) {
				revalidateSubjectDetailCache(deleted.courseId);
			}
			return NextResponse.json({ success: true, message: "Material deleted" });
		}
	)
);
