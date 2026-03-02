import { Subject, Topic, TopicItemData } from "@/types";
import {
	CanvasCourse,
	CanvasModuleItem,
} from "@/lib/server/integrations/canvas/client";

function parseTerm(termName: string | undefined): { year: number; semester: number } {
	if (!termName) {
		return { year: new Date().getFullYear(), semester: 1 };
	}

	const slashMatch = termName.match(/^(\d)\/(\d{4})$/);
	if (slashMatch) {
		return {
			semester: parseInt(slashMatch[1], 10),
			year: parseInt(slashMatch[2], 10),
		};
	}

	const semesterMatch = termName.match(/[Ss]emester\s*(\d)/i);
	const yearMatch = termName.match(/\b(20\d{2})\b/);

	return {
		year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
		semester: semesterMatch ? parseInt(semesterMatch[1], 10) : 1,
	};
}

function mapCanvasItemToTopicItem(item: CanvasModuleItem): TopicItemData | null {
	switch (item.type) {
		case "SubHeader":
			return {
				id: item.id.toString(),
				title: item.title,
				type: "Header",
				isCustom: false,
			};
		case "File":
			if (!item.url) return null;
			return {
				id: item.id.toString(),
				title: item.title,
				type: "File",
				url: item.url,
				isCustom: false,
			};
		case "ExternalUrl":
			if (!item.external_url) return null;
			return {
				id: item.id.toString(),
				title: item.title,
				type: "Link",
				url: item.external_url,
				isCustom: false,
			};
		case "Page":
			if (item.html_content) {
				return {
					id: item.id.toString(),
					title: item.title,
					type: "Page",
					htmlContent: item.html_content,
					canvasUrl: item.url,
					isCustom: false,
				};
			}
			return null;
		case "Assignment":
		case "Quiz":
		case "Discussion":
			return {
				id: item.id.toString(),
				title: item.title,
				type: "Link",
				url: item.url,
				isCustom: false,
			};
		default:
			return null;
	}
}

export function mapCanvasCourseToSubject(course: CanvasCourse): Subject {
	const { year, semester } = parseTerm(course.term?.name);

	const topics: Topic[] = course.modules.map((module) => {
		const items: TopicItemData[] = [];

		if (Array.isArray(module.items)) {
			for (const item of module.items) {
				const mappedItem = mapCanvasItemToTopicItem(item);
				if (mappedItem) {
					items.push(mappedItem);
				}
			}
		}

		return {
			id: module.id.toString(),
			title: module.name,
			isCustom: false,
			items,
		};
	});

	return {
		_id: course.id.toString(),
		courseCode: course.course_code,
		title: course.name,
		year,
		semester,
		imageUrl: `/images/subjects/${course.id}.png`,
		canvasUrl: `https://sirirajcanvas.instructure.com/courses/${course.id}`,
		filesUrl: `https://sirirajcanvas.instructure.com/courses/${course.id}/files`,
		syllabus: "",
		topics,
	};
}

