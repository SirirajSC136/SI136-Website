import { NextResponse } from "next/server";
import { getSecondUpcomingData } from "@/lib/server/domains/canvasUpcoming/service";

export async function getSecondUpcomingHandler() {
	try {
		const data = await getSecondUpcomingData();
		return NextResponse.json({
			message: "Successfully fetched assignments and examinations data.",
			assignments: {
				count: data.assignments.length,
				data: data.assignments,
			},
			examinations: {
				count: data.examinations.length,
				data: data.examinations,
			},
		});
	} catch (error) {
		console.error("Failed to fetch Google Sheet data:", error);
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		return NextResponse.json(
			{
				error: "Failed to fetch data from one or more Google Sheets",
				details: errorMessage,
			},
			{ status: 500 }
		);
	}
}

