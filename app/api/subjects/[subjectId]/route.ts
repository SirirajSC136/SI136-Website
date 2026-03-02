import {
	getSubjectByIdHandler,
} from "@/lib/server/domains/subjects/handlers/getSubjectById";

export const runtime = "nodejs";

export const GET = getSubjectByIdHandler;
