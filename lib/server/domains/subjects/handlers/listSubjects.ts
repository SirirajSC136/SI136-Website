import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { getAllSubjects } from "@/lib/subjects";

export const getSubjectsHandler = withErrorHandling(async () => {
	return NextResponse.json(await getAllSubjects());
});
