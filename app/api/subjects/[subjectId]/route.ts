import { NextResponse } from "next/server";
import { subjectsService } from "@/lib/server/services/subjectsService";
import { toErrorResponse } from "@/lib/server/http/errors";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ subjectId: string }> }
) {
	try {
		const { subjectId } = await params;
		return NextResponse.json(await subjectsService.getSubjectById(subjectId));
	} catch (error) {
		return toErrorResponse(error);
	}
}
