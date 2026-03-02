import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { getSubjectById } from "@/lib/subjects";

export const getSubjectByIdHandler = withErrorHandling(
	async (
		_request: Request,
		{ params }: { params: Promise<{ subjectId: string }> }
	) => {
		const { subjectId } = await params;
		return NextResponse.json(await getSubjectById(subjectId));
	}
);
