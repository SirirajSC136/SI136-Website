import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { adminContentService } from "@/lib/server/domains/content/service";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import { createCourseSchema } from "@/lib/server/domains/content/schemas";
import {
	revalidateSubjectDetailCache,
	revalidateSubjectsListCache,
} from "@/lib/subjects";
import { withAdminAudit } from "@/lib/server/domains/adminLogs/audit";

export const postAdminCoursesHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "course.create",
			resourceType: "course",
			resolveResourceId: ({ requestPayload }) =>
				typeof requestPayload?.courseCode === "string"
					? requestPayload.courseCode
					: undefined,
		},
		async (request: Request) => {
			await requireAdminFromRequest(request);
			const body = await request.json();
			const parsed = createCourseSchema.safeParse(body);
			if (!parsed.success) {
				throw new HttpError(
					400,
					"Invalid course payload",
					"validation_error",
					parsed.error.flatten()
				);
			}

			const created = await adminContentService.createCourse(parsed.data);
			revalidateSubjectsListCache();
			revalidateSubjectDetailCache(created.id);
			return NextResponse.json({ success: true, data: created }, { status: 201 });
		}
	)
);

export const deleteAdminCoursesHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "course.delete",
			resourceType: "course",
			resolveResourceId: ({ request }) =>
				new URL(request.url).searchParams.get("id") ?? undefined,
		},
		async (request: Request) => {
			await requireAdminFromRequest(request);
			const { searchParams } = new URL(request.url);
			const courseId = searchParams.get("id");
			if (!courseId) {
				throw new HttpError(400, "Course ID is required", "validation_error");
			}

			const deleted = await adminContentService.deleteCourse(courseId);
			revalidateSubjectsListCache();
			revalidateSubjectDetailCache(deleted.courseId);
			return NextResponse.json({
				success: true,
				message: "Course and all associated materials deleted.",
			});
		}
	)
);
