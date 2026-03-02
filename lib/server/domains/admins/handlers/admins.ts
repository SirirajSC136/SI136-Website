import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import {
	deleteAdminSchema,
	upsertAdminSchema,
} from "@/lib/server/domains/admins/schemas";
import { adminsService } from "@/lib/server/domains/admins/service";
import { withAdminAudit } from "@/lib/server/domains/adminLogs/audit";

export const getAdminUsersHandler = withErrorHandling(async (request: Request) => {
	await requireAdminFromRequest(request);
	const admins = await adminsService.listAdmins();
	return NextResponse.json({ success: true, data: admins });
});

export const postAdminUsersHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "admin.add",
			resourceType: "admin_user",
			resolveResourceId: ({ requestPayload }) =>
				typeof requestPayload?.email === "string" ? requestPayload.email : undefined,
		},
		async (request: Request) => {
			const currentUser = await requireAdminFromRequest(request);
			const body = await request.json();
			const parsed = upsertAdminSchema.safeParse(body);
			if (!parsed.success) {
				throw new HttpError(
					400,
					"Invalid admin payload",
					"validation_error",
					parsed.error.flatten()
				);
			}

			const saved = await adminsService.upsertAdmin({
				...parsed.data,
				currentUser,
			});
			return NextResponse.json({ success: true, data: saved }, { status: 201 });
		}
	)
);

export const deleteAdminUsersHandler = withErrorHandling(
	withAdminAudit(
		{
			action: "admin.remove",
			resourceType: "admin_user",
			resolveResourceId: ({ request }) =>
				new URL(request.url).searchParams.get("email") ?? undefined,
		},
		async (request: Request) => {
			const currentUser = await requireAdminFromRequest(request);
			const { searchParams } = new URL(request.url);
			const parsed = deleteAdminSchema.safeParse({
				email: searchParams.get("email") ?? "",
			});
			if (!parsed.success) {
				throw new HttpError(
					400,
					"Invalid email",
					"validation_error",
					parsed.error.flatten()
				);
			}

			await adminsService.removeAdmin(parsed.data.email, currentUser);
			return NextResponse.json({ success: true, message: "Admin removed" });
		}
	)
);
