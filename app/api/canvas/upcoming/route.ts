import { NextResponse } from "next/server";
import { Task } from "@/types";

const getTaskType = (title: string): "assignment" | "examination" => {
	const lowerCaseTitle = title.toLowerCase();
	const examKeywords = ["exam", "quiz", "midterm", "final"];
	return examKeywords.some((keyword) => lowerCaseTitle.includes(keyword))
		? "examination"
		: "assignment";
};

export async function GET(request: Request) {
	const canvasUrl = process.env.CANVAS_URL;
	const accessToken = process.env.CANVAS_API;
	if (!canvasUrl || !accessToken) {
		return NextResponse.json(
			{ error: "Server configuration error" },
			{ status: 500 }
		);
	}
	const headers = { Authorization: `Bearer ${accessToken}` };

	try {
		const todoResponse = await fetch(`${canvasUrl}/users/self/todo`, {
			headers,
		});
		if (!todoResponse.ok) throw new Error("Failed to fetch To-Do items");
		const rawTodos: any[] = await todoResponse.json();

		// --- DATA ENRICHMENT ---
		// 1. Collect all unique course IDs from the assignments.
		const courseIds = [
			...new Set(
				rawTodos.map((item) => item.assignment?.course_id).filter((id) => id)
			),
		];

		// 2. Fetch details for all those courses in parallel.
		const coursePromises = courseIds.map((id) =>
			fetch(`${canvasUrl}/courses/${id}`, { headers }).then((res) =>
				res.ok ? res.json() : null
			)
		);
		const courseResults = await Promise.all(coursePromises);

		// 3. Create a quick-lookup map for course details.
		const courseDetailsMap = new Map<
			string,
			{ name: string; course_code: string }
		>();
		courseResults.forEach((course) => {
			if (course) {
				courseDetailsMap.set(course.id.toString(), {
					name: course.name,
					course_code: course.course_code,
				});
			}
		});
		// --- END ENRICHMENT ---

		const tasks: Task[] = [];
		const now = new Date();

		for (const item of rawTodos) {
			if (item.type === "submitting" && item.assignment) {
				const deadline = item.assignment.due_at;
				if (!deadline || new Date(deadline) > now) {
					const courseId = item.assignment.course_id.toString();
					const courseDetails = courseDetailsMap.get(courseId);

					tasks.push({
						id: item.assignment.id.toString(),
						type: getTaskType(item.assignment.name),
						// Use the definitive data fetched from the course endpoint.
						courseCode: courseDetails?.course_code || "N/A",
						subjectTitle: courseDetails?.name || item.context_name,
						title: item.assignment.name,
						deadline: deadline,
						subjectId: courseId,
					});
				}
			}
		}
		return NextResponse.json({ tasks });
	} catch (error) {
		console.error("Canvas upcoming tasks API error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
