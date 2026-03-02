import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { adminContentService } from "@/lib/server/domains/content/service";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import { isCustomId } from "@/lib/server/domains/content/ids";
import { revalidateSubjectDetailCache } from "@/lib/subjects";
import { withAdminAudit } from "@/lib/server/domains/adminLogs/audit";

export const deleteAdminTopicByIdHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "topic.delete",
			resourceType: "topic",
			resolveResourceId: ({ request }) => {
				const segments = new URL(request.url).pathname.split("/");
				return segments[segments.length - 1] || undefined;
			},
		},
		async (
			request: Request,
			{ params }: { params: Promise<{ topicId: string }> }
		) => {
			await requireAdminFromRequest(request);
			const { topicId } = await params;

			if (!isCustomId(topicId)) {
				throw new HttpError(400, "Valid Topic ID is required", "validation_error");
			}

			const { searchParams } = new URL(request.url);
			const courseId = searchParams.get("courseId") ?? undefined;
			const deleted = await adminContentService.deleteTopic(topicId, { courseId });
			if (deleted.courseId) {
				revalidateSubjectDetailCache(deleted.courseId);
			}
			return NextResponse.json({
				success: true,
				message: "Topic and associated materials deleted.",
			});
		}
	)
);
