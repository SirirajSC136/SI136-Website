import { getAuthMeHandler } from "@/lib/server/domains/auth/handlers/me";

export const runtime = "nodejs";

export const GET = getAuthMeHandler;
