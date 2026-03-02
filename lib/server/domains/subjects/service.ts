import { fetchCourseDetails, fetchEnrolledCourses } from "@/lib/server/integrations/canvas/client";
import { contentRepository } from "@/lib/server/domains/content/repository";
import { isCustomId } from "@/lib/server/domains/content/ids";
import { mapCanvasCourseToSubject } from "@/lib/server/domains/subjects/mappers/canvasToSubject";
import { mapCustomCourseToSubject } from "@/lib/server/domains/subjects/mappers/customToSubject";
import { Subject, Topic, TopicItemData } from "@/types";
import { TopicRecord } from "@/lib/server/domains/content/types";
import { HttpError } from "@/lib/server/core/errors";

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
	private useSubjectProjections(): boolean {
		return process.env.USE_SUBJECT_PROJECTIONS !== "0";
	}

	private mapCustomCourseSummaryToSubject(course: {
		id: string;
		courseCode: string;
		title: string;
		year: number;
		semester: number;
	}): Subject {
		return mapCustomCourseToSubject({
			id: course.id,
			courseCode: course.courseCode,
			title: course.title,
			year: course.year,
			semester: course.semester,
			topics: [],
		});
	}

	private async listCustomSubjectsForListing(): Promise<Subject[]> {
		if (this.useSubjectProjections()) {
			try {
				const catalog = await contentRepository.getSubjectCatalog();
				if (catalog) {
					return catalog.courses.map((course) =>
						this.mapCustomCourseSummaryToSubject(course)
					);
				}
			} catch (error) {
				console.error("Custom subject catalog fetch failed:", error);
			}
		}

		const customCourses = await contentRepository.listCustomCourses();
		return customCourses.map((course) =>
			this.mapCustomCourseSummaryToSubject({
				id: course.id,
				courseCode: course.courseCode,
				title: course.title,
				year: course.year,
				semester: course.semester,
			})
		);
	}

	async getAllSubjects(): Promise<Subject[]> {
		const [canvasCoursesResult, customCoursesResult] = await Promise.allSettled([
			fetchEnrolledCourses(),
			this.listCustomSubjectsForListing(),
		]);

		const canvasSubjects =
			canvasCoursesResult.status === "fulfilled"
				? canvasCoursesResult.value.map(mapCanvasCourseToSubject)
				: [];
		const customSubjects =
			customCoursesResult.status === "fulfilled" ? customCoursesResult.value : [];

		if (canvasCoursesResult.status === "rejected") {
			console.error("Canvas subjects fetch failed:", canvasCoursesResult.reason);
		}

		if (customCoursesResult.status === "rejected") {
			console.error("Custom subjects fetch failed:", customCoursesResult.reason);
		}

		return [...canvasSubjects, ...customSubjects];
	}

	async getSubjectById(subjectId: string): Promise<Subject> {
		if (this.useSubjectProjections()) {
			try {
				const projected = await contentRepository.getSubjectView(subjectId);
				if (projected) {
					return projected;
				}
			} catch (error) {
				console.error("Subject projection fetch failed:", error);
			}
		}

		const customCourse = isCustomId(subjectId)
			? await contentRepository.getCourseById(subjectId)
			: null;

		if (customCourse && customCourse.kind === "custom") {
			const customTopics = await contentRepository.listTopicsForCourse(subjectId);
			const customMaterialsMap = await contentRepository.listMaterialsForCourse(
				subjectId,
				customTopics.map((topic) => topic.id)
			);
			const subject = mapCustomCourseToSubject({
				id: customCourse.id,
				courseCode: customCourse.courseCode,
				title: customCourse.title,
				year: customCourse.year,
				semester: customCourse.semester,
				topics: customTopics
					.filter((topic) => topic.kind === "custom")
					.map((topic) => ({ id: topic.id, title: topic.title })),
			});

			let mergedTopics = appendItemsToTopics(subject.topics, customMaterialsMap);
			for (const customTopic of customTopics) {
				mergedTopics = ensureTopicExists(mergedTopics, customTopic, customMaterialsMap);
			}

			return {
				...subject,
				topics: mergedTopics,
			};
		}

		const canvasCourse = await fetchCourseDetails(subjectId);
		if (!canvasCourse) {
			throw new HttpError(404, "Subject not found", "subject_not_found");
		}
		const subject = mapCanvasCourseToSubject(canvasCourse);

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
