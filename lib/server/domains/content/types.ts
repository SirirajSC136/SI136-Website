import {
	FlashcardContent,
	QuizContent,
	Subject,
	TopicItemData,
} from "@/types";

export type CourseKind = "custom" | "overlay";
export type TopicKind = "custom" | "overlay";

export type CourseRecord = {
	id: string;
	kind: CourseKind;
	courseCode: string;
	title: string;
	year: number;
	semester: number;
	createdAt?: string;
	updatedAt?: string;
};

export type TopicRecord = {
	id: string;
	courseId: string;
	title: string;
	kind: TopicKind;
	createdAt?: string;
	updatedAt?: string;
};

export type MaterialRecord = {
	id: string;
	courseId: string;
	topicId: string;
	item: TopicItemData;
	createdAt?: string;
	updatedAt?: string;
};

export type InteractiveContentRecord = {
	id: string;
	courseId: string;
	topicId: string;
	title: string;
	contentType: "Quiz" | "Flashcard";
	version: number;
	content: QuizContent | FlashcardContent;
	createdAt?: string;
	updatedAt?: string;
};

export type CreateCourseInput = {
	courseCode: string;
	title: string;
	year: number;
	semester: number;
};

export type CreateTopicInput = {
	courseId: string;
	title: string;
};

export type CreateMaterialInput = {
	courseId: string;
	topicId: string;
	itemId?: string;
	item: TopicItemData;
	interactive?: {
		contentType: "Quiz" | "Flashcard";
		content: QuizContent | FlashcardContent;
	};
};

export type CreateInteractiveInput = {
	itemId: string;
	courseId: string;
	topicId: string;
	title: string;
	contentType: "Quiz" | "Flashcard";
	content: QuizContent | FlashcardContent;
};

export type UpdateMaterialInput = {
	courseId?: string;
	topicId?: string;
	item: TopicItemData;
	interactive?: {
		contentType: "Quiz" | "Flashcard";
		content: QuizContent | FlashcardContent;
	};
};

export type SubjectCatalogCourseSummary = {
	id: string;
	courseCode: string;
	title: string;
	year: number;
	semester: number;
};

export type SubjectCatalogDoc = {
	courses: SubjectCatalogCourseSummary[];
	updatedAt?: string;
};

export type SubjectViewDoc = {
	subject: Subject;
	updatedAt?: string;
	source: "projection";
};
