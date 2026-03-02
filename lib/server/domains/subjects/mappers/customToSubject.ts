import { Subject } from "@/types";

export type CustomCourseAdapterInput = {
	id: string;
	courseCode: string;
	title: string;
	year: number;
	semester: number;
	topics: Array<{ id: string; title: string }>;
};

export function mapCustomCourseToSubject(
	course: CustomCourseAdapterInput
): Subject {
	return {
		_id: course.id.toString(),
		courseCode: course.courseCode,
		title: course.title,
		year: course.year,
		semester: course.semester,
		imageUrl: `/images/subjects/${course.id}.png`,
		canvasUrl: "",
		filesUrl: "",
		syllabus: "",
		topics: course.topics.map((topic) => ({
			id: topic.id.toString(),
			title: topic.title,
			isCustom: true,
			items: [],
		})),
	};
}

