import { z } from "zod";
import { TopicItemData } from "@/types";

const topicItemSchema = z.custom<TopicItemData>(
	(value) => typeof value === "object" && value !== null,
	"Invalid topic item payload"
);

export const createCourseSchema = z.object({
	courseCode: z.string().trim().min(1),
	title: z.string().trim().min(1),
	year: z.number().int().min(1),
	semester: z.number().int().min(1).max(3),
});

export const createTopicSchema = z.object({
	courseId: z.string().trim().min(1),
	title: z.string().trim().min(1),
});

export const createMaterialSchema = z.object({
	courseId: z.string().trim().min(1),
	topicId: z.string().trim().min(1),
	item: topicItemSchema,
});

export const updateMaterialSchema = z.object({
	item: topicItemSchema,
});

export const createInteractiveSchema = z.object({
	courseId: z.string().trim().min(1),
	title: z.string().trim().min(1),
	contentType: z.enum(["Quiz", "Flashcard"]),
	content: z.unknown(),
});
