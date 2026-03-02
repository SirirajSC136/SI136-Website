import { mapCanvasCourseToSubject, mapCustomCourseToSubject } from "@/lib/canvasAdapter";
import { fetchEnrolledCourses } from "@/lib/canvas";
import connectToDatabase from "@/lib/mongodb";
import CustomCourse from "@/models/CustomCourse";
import { Subject } from "@/types";

export async function getAllSubjects(): Promise<Subject[]> {
	await connectToDatabase();

	const [canvasCoursesResult, customCoursesResult] = await Promise.allSettled([
		fetchEnrolledCourses(),
		CustomCourse.find({}).sort({ year: -1, semester: -1 }).exec(),
	]);

	const canvasSubjects =
		canvasCoursesResult.status === "fulfilled"
			? canvasCoursesResult.value.map(mapCanvasCourseToSubject)
			: [];
	const customSubjects =
		customCoursesResult.status === "fulfilled"
			? customCoursesResult.value.map(mapCustomCourseToSubject)
			: [];

	if (canvasCoursesResult.status === "rejected") {
		console.error("Canvas subjects fetch failed:", canvasCoursesResult.reason);
	}

	if (customCoursesResult.status === "rejected") {
		console.error("Custom subjects fetch failed:", customCoursesResult.reason);
	}

	return [...canvasSubjects, ...customSubjects];
}
