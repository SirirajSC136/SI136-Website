import { getSubjectsHandler } from "@/lib/server/domains/subjects/handlers/listSubjects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = getSubjectsHandler;
