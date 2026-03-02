import { z } from "zod";
import { normalizeAdminEmail } from "@/lib/server/domains/admins/utils";

const limitSchema = z
	.coerce.number()
	.int()
	.min(1)
	.max(100)
	.default(25);

const isoDateSchema = z
	.string()
	.trim()
	.min(1)
	.transform((value) => new Date(value))
	.refine((value) => !Number.isNaN(value.getTime()), "Invalid ISO date");

export const adminLogsQuerySchema = z
	.object({
		cursor: z.string().trim().min(1).optional(),
		limit: limitSchema.optional(),
		action: z.string().trim().min(1).max(120).optional(),
		status: z.enum(["success", "error"]).optional(),
		actorEmail: z
			.string()
			.trim()
			.email()
			.transform((value) => normalizeAdminEmail(value) ?? value)
			.optional(),
		from: isoDateSchema.optional(),
		to: isoDateSchema.optional(),
	})
	.refine(
		(value) => {
			if (!value.from || !value.to) return true;
			return value.from.getTime() <= value.to.getTime();
		},
		{
			message: "`from` must be before or equal to `to`",
			path: ["from"],
		}
	);
