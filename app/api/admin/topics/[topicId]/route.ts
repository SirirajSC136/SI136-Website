import { NextResponse } from "next/server";
import { adminContentService } from "@/lib/server/services/adminContentService";
import { requireAdminFromRequest } from "@/lib/server/auth/session";
import { isCustomId } from "@/lib/server/utils/id";
import { HttpError, toErrorResponse } from "@/lib/server/http/errors";

export const runtime = "nodejs";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ topicId: string }> }
) {
	try {
		await requireAdminFromRequest(request);
		const { topicId } = await params;

		if (!isCustomId(topicId)) {
			throw new HttpError(400, "Valid Topic ID is required", "validation_error");
		}

		await adminContentService.deleteTopic(topicId);
		return NextResponse.json({
			success: true,
			message: "Topic and associated materials deleted.",
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}
