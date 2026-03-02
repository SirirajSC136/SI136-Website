import { z } from "zod";

export const createSessionSchema = z.object({
	idToken: z.string().trim().min(1),
});
