import { NextResponse } from "next/server";
import { adminContentService } from "@/lib/server/services/adminContentService";
import { requireAdminFromRequest } from "@/lib/server/auth/session";
import { createCourseSchema } from "@/lib/server/validation/admin";
import { HttpError, toErrorResponse } from "@/lib/server/http/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		await requireAdminFromRequest(request);
		const body = await request.json();
		const parsed = createCourseSchema.safeParse(body);
		if (!parsed.success) {
			throw new HttpError(400, "Invalid course payload", "validation_error", parsed.error.flatten());
		}

		const created = await adminContentService.createCourse(parsed.data);
		return NextResponse.json({ success: true, data: created }, { status: 201 });
	} catch (error) {
		return toErrorResponse(error);
	}
}

export async function DELETE(request: Request) {
	try {
		await requireAdminFromRequest(request);
		const { searchParams } = new URL(request.url);
		const courseId = searchParams.get("id");
		if (!courseId) {
			throw new HttpError(400, "Course ID is required", "validation_error");
		}

		await adminContentService.deleteCourse(courseId);
		return NextResponse.json({
			success: true,
			message: "Course and all associated materials deleted.",
		});
	} catch (error) {
		return toErrorResponse(error);
	}
}
