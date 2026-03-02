import { z } from "zod";
import { isAllowedStudentEmail, normalizeAdminEmail } from "@/lib/server/domains/admins/utils";

const studentEmailSchema = z
	.string()
	.trim()
	.email("Invalid email format")
	.transform((value) => normalizeAdminEmail(value) ?? value)
	.refine((email) => isAllowedStudentEmail(email), {
		message: "Only student emails are allowed",
	});

export const upsertAdminSchema = z.object({
	email: studentEmailSchema,
	name: z.string().trim().min(1).max(120).optional(),
});

export const deleteAdminSchema = z.object({
	email: studentEmailSchema,
});
