import { getAdminLogsHandler } from "@/lib/server/domains/adminLogs/handlers/logs";

export const runtime = "nodejs";

export const GET = getAdminLogsHandler;
