import { mapCanvasCourseToSubject, mapCustomCourseToSubject } from "@/lib/canvasAdapter";
import { fetchCourseDetails, fetchEnrolledCourses } from "@/lib/canvas";
import { contentRepository } from "@/lib/server/repositories/contentRepository";
import { isCustomId } from "@/lib/server/utils/id";
import { Subject, Topic, TopicItemData } from "@/types";
import { TopicRecord } from "@/lib/server/types/content";
import { HttpError } from "@/lib/server/http/errors";

function appendItemsToTopics(
	topics: Topic[],
	itemsMap: Map<string, TopicItemData[]>
): Topic[] {
	return topics.map((topic) => {
		const customItems = itemsMap.get(topic.id);
		if (!customItems || customItems.length === 0) return topic;
		return {
			...topic,
			items: [...topic.items, ...customItems],
		};
	});
}

function ensureTopicExists(
	subjectTopics: Topic[],
	customTopic: TopicRecord,
	itemsMap: Map<string, TopicItemData[]>
): Topic[] {
	const alreadyExists = subjectTopics.some((topic) => topic.id === customTopic.id);
	if (alreadyExists || customTopic.kind !== "custom") {
		return subjectTopics;
	}

	return [
		...subjectTopics,
		{
			id: customTopic.id,
			title: customTopic.title,
			isCustom: true,
			items: itemsMap.get(customTopic.id) ?? [],
		},
	];
}

export class SubjectsService {
	async getAllSubjects(): Promise<Subject[]> {
		const [canvasCoursesResult, customCoursesResult] = await Promise.allSettled([
			fetchEnrolledCourses(),
			contentRepository.listCustomCourses(),
		]);

		const canvasSubjects =
			canvasCoursesResult.status === "fulfilled"
				? canvasCoursesResult.value.map(mapCanvasCourseToSubject)
				: [];
		const customSubjects =
			customCoursesResult.status === "fulfilled"
				? customCoursesResult.value.map((course) =>
						mapCustomCourseToSubject({
							id: course.id,
							courseCode: course.courseCode,
							title: course.title,
							year: course.year,
							semester: course.semester,
							topics: [],
						})
					)
				: [];

		if (canvasCoursesResult.status === "rejected") {
			console.error("Canvas subjects fetch failed:", canvasCoursesResult.reason);
		}

		if (customCoursesResult.status === "rejected") {
			console.error("Custom subjects fetch failed:", customCoursesResult.reason);
		}

		return [...canvasSubjects, ...customSubjects];
	}

	async getSubjectById(subjectId: string): Promise<Subject> {
		const customCourse =
			isCustomId(subjectId) ? await contentRepository.getCourseById(subjectId) : null;

		let subject: Subject | null = null;

		if (customCourse && customCourse.kind === "custom") {
			const topics = await contentRepository.listTopicsForCourse(subjectId);
			subject = mapCustomCourseToSubject({
				id: customCourse.id,
				courseCode: customCourse.courseCode,
				title: customCourse.title,
				year: customCourse.year,
				semester: customCourse.semester,
				topics: topics
					.filter((topic) => topic.kind === "custom")
					.map((topic) => ({ id: topic.id, title: topic.title })),
			});
		} else {
			const canvasCourse = await fetchCourseDetails(subjectId);
			if (!canvasCourse) {
				throw new HttpError(404, "Subject not found", "subject_not_found");
			}
			subject = mapCanvasCourseToSubject(canvasCourse);
		}

		const [customTopicsResult, customMaterialsResult] = await Promise.allSettled([
			contentRepository.listTopicsForCourse(subjectId),
			contentRepository.listMaterialsForCourse(subjectId),
		]);

		const customTopics =
			customTopicsResult.status === "fulfilled" ? customTopicsResult.value : [];
		const customMaterialsMap =
			customMaterialsResult.status === "fulfilled"
				? customMaterialsResult.value
				: new Map<string, TopicItemData[]>();

		if (customTopicsResult.status === "rejected") {
			console.error("Custom topics fetch failed:", customTopicsResult.reason);
		}
		if (customMaterialsResult.status === "rejected") {
			console.error("Custom materials fetch failed:", customMaterialsResult.reason);
		}

		let mergedTopics = appendItemsToTopics(subject.topics, customMaterialsMap);

		for (const customTopic of customTopics) {
			mergedTopics = ensureTopicExists(mergedTopics, customTopic, customMaterialsMap);
		}

		return {
			...subject,
			topics: mergedTopics,
		};
	}
}

export const subjectsService = new SubjectsService();
