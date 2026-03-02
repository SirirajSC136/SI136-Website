import { NextResponse } from "next/server";
import { adminContentService } from "@/lib/server/services/adminContentService";
import { requireAdminFromRequest } from "@/lib/server/auth/session";
import { isCustomId } from "@/lib/server/utils/id";
import { updateMaterialSchema } from "@/lib/server/validation/admin";
import { HttpError, toErrorResponse } from "@/lib/server/http/errors";

export const runtime = "nodejs";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ itemId: string }> }
) {
	try {
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

		const updated = await adminContentService.updateMaterial(itemId, parsed.data.item);
		return NextResponse.json({ success: true, data: updated });
	} catch (error) {
		return toErrorResponse(error);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ itemId: string }> }
) {
	try {
		await requireAdminFromRequest(request);
		const { itemId } = await params;
		if (!isCustomId(itemId)) {
			throw new HttpError(400, "Invalid Item ID format", "validation_error");
		}

		await adminContentService.deleteMaterial(itemId);
		return NextResponse.json({ success: true, message: "Material deleted" });
	} catch (error) {
		return toErrorResponse(error);
	}
}
