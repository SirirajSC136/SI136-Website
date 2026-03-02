import { NextResponse } from "next/server";
import { adminContentService } from "@/lib/server/services/adminContentService";
import { requireAdminFromRequest } from "@/lib/server/auth/session";
import { createMaterialSchema } from "@/lib/server/validation/admin";
import { HttpError, toErrorResponse } from "@/lib/server/http/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
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

		const created = await adminContentService.createMaterial(parsed.data);
		return NextResponse.json({ success: true, data: created }, { status: 201 });
	} catch (error) {
		return toErrorResponse(error);
	}
}
