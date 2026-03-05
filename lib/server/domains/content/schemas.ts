import { z } from "zod";

const customIdRegex = /^[0-9a-f]{24}$/i;

export const imageAssetSchema = z.object({
	path: z.string().trim().min(1),
	url: z.string().trim().url(),
	alt: z.string().trim().min(1),
});

const quizMcqOptionSchema = z.object({
	id: z.string().trim().min(1),
	textMarkdown: z.string().trim().min(1),
	weight: z.number(),
});

const quizQuestionBaseSchema = z.object({
	id: z.string().trim().min(1),
	promptMarkdown: z.string().trim().min(1),
	image: imageAssetSchema.optional(),
	maxPoints: z.number().min(0),
	explanationMarkdown: z.string().trim().optional(),
});

const quizMcqQuestionSchema = quizQuestionBaseSchema.extend({
	kind: z.literal("mcq"),
	options: z.array(quizMcqOptionSchema).min(2).max(8),
});

const quizShortAnswerQuestionSchema = quizQuestionBaseSchema.extend({
	kind: z.literal("short_answer"),
	acceptedAnswers: z.array(z.string().trim().min(1)).min(1),
	matchMode: z.enum(["exact", "ignore_case", "ignore_case_and_whitespace"]),
});

const quizQuestionSchema = z.discriminatedUnion("kind", [
	quizMcqQuestionSchema,
	quizShortAnswerQuestionSchema,
]);

export const quizContentSchema = z.object({
	settings: z.object({
		feedbackMode: z.enum(["instant", "after_submit"]),
		shuffleQuestions: z.boolean(),
	}),
	questions: z.array(quizQuestionSchema).min(1).max(100),
});

const flashcardCardSchema = z.object({
	id: z.string().trim().min(1),
	frontMarkdown: z.string().trim().min(1),
	frontImage: imageAssetSchema.optional(),
	backMarkdown: z.string().trim().min(1),
	backImage: imageAssetSchema.optional(),
});

export const flashcardContentSchema = z.object({
	settings: z.object({
		shuffleAllowed: z.boolean(),
	}),
	cards: z.array(flashcardCardSchema).min(1).max(300),
});

const baseItemSchema = z.object({
	id: z.string().trim().min(1).optional(),
	title: z.string().trim().min(1),
	isCustom: z.boolean().optional(),
});

const linkItemSchema = baseItemSchema.extend({
	type: z.literal("Link"),
	url: z.string().trim().url(),
});

const fileItemSchema = baseItemSchema.extend({
	type: z.literal("File"),
	url: z.string().trim().url(),
});

const quizItemSchema = baseItemSchema.extend({
	type: z.literal("Quiz"),
	interactiveRefId: z.string().trim().regex(customIdRegex).optional(),
});

const flashcardItemSchema = baseItemSchema.extend({
	type: z.literal("Flashcard"),
	interactiveRefId: z.string().trim().regex(customIdRegex).optional(),
});

export const adminMaterialItemSchema = z.discriminatedUnion("type", [
	linkItemSchema,
	fileItemSchema,
	quizItemSchema,
	flashcardItemSchema,
]);

const quizInteractivePayloadSchema = z.object({
	contentType: z.literal("Quiz"),
	content: quizContentSchema,
});

const flashcardInteractivePayloadSchema = z.object({
	contentType: z.literal("Flashcard"),
	content: flashcardContentSchema,
});

const interactivePayloadSchema = z.discriminatedUnion("contentType", [
	quizInteractivePayloadSchema,
	flashcardInteractivePayloadSchema,
]);

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
	itemId: z.string().trim().regex(customIdRegex).optional(),
	item: adminMaterialItemSchema,
	interactive: interactivePayloadSchema.optional(),
}).superRefine((value, ctx) => {
	const isInteractiveItem = value.item.type === "Quiz" || value.item.type === "Flashcard";
	if (!isInteractiveItem && value.interactive) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["interactive"],
			message: "Interactive payload is only valid for Quiz or Flashcard materials.",
		});
	}
	if (isInteractiveItem && !value.interactive) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["interactive"],
			message: "Interactive payload is required for Quiz and Flashcard materials.",
		});
	}
	if (isInteractiveItem && value.interactive) {
		if (value.item.type !== value.interactive.contentType) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["interactive", "contentType"],
				message: "Interactive content type must match material type.",
			});
		}
	}
});

export const updateMaterialSchema = z.object({
	courseId: z.string().trim().min(1).optional(),
	topicId: z.string().trim().min(1).optional(),
	item: adminMaterialItemSchema,
	interactive: interactivePayloadSchema.optional(),
}).superRefine((value, ctx) => {
	const isInteractiveItem = value.item.type === "Quiz" || value.item.type === "Flashcard";
	if (!isInteractiveItem && value.interactive) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["interactive"],
			message: "Interactive payload is only valid for Quiz or Flashcard materials.",
		});
	}
	if (isInteractiveItem && !value.interactive) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["interactive"],
			message: "Interactive payload is required for Quiz and Flashcard materials.",
		});
	}
	if (isInteractiveItem && value.interactive) {
		if (value.item.type !== value.interactive.contentType) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["interactive", "contentType"],
				message: "Interactive content type must match material type.",
			});
		}
	}
});

export const createInteractiveSchema = z.object({
	itemId: z.string().trim().regex(customIdRegex),
	courseId: z.string().trim().min(1),
	topicId: z.string().trim().min(1),
	title: z.string().trim().min(1),
	contentType: z.enum(["Quiz", "Flashcard"]),
	content: z.union([quizContentSchema, flashcardContentSchema]),
}).superRefine((value, ctx) => {
	if (value.contentType === "Quiz") {
		const result = quizContentSchema.safeParse(value.content);
		if (!result.success) {
			for (const issue of result.error.issues) {
				ctx.addIssue({ ...issue, path: ["content", ...issue.path] });
			}
		}
	} else {
		const result = flashcardContentSchema.safeParse(value.content);
		if (!result.success) {
			for (const issue of result.error.issues) {
				ctx.addIssue({ ...issue, path: ["content", ...issue.path] });
			}
		}
	}
});

const attemptAnswerSchema = z.object({
	selectedOptionIds: z.array(z.string().trim().min(1)).optional(),
	shortAnswer: z.string().max(10_000).optional(),
});

export const quizAttemptSubmissionSchema = z.object({
	answers: z.record(z.string().trim().min(1), attemptAnswerSchema),
});

export const createFlashcardSessionSchema = z.object({
	meta: z
		.object({
			shuffleEnabled: z.boolean().optional(),
		})
		.optional(),
});

export const flashcardSessionEventSchema = z.object({
	at: z.string().trim().min(1),
	type: z.enum(["flip", "next", "prev", "shuffle", "open", "close"]),
	cardId: z.string().trim().min(1).optional(),
	payload: z.record(z.string(), z.unknown()).optional(),
});

export const patchFlashcardSessionSchema = z.object({
	events: z.array(flashcardSessionEventSchema).max(200),
});

export const completeFlashcardSessionSchema = z.object({
	summary: z.object({
		cardsViewed: z.number().int().min(0),
		flipCount: z.number().int().min(0),
		durationMs: z.number().int().min(0),
	}).optional(),
});
