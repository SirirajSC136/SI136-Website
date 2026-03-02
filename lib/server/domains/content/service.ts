import { TopicItemData } from "@/types";
import { contentRepository } from "@/lib/server/domains/content/repository";
import {
	CreateCourseInput,
	CreateInteractiveInput,
	CreateMaterialInput,
	CreateTopicInput,
	InteractiveContentRecord,
	MaterialRecord,
	CourseRecord,
	TopicRecord,
	UpdateMaterialInput,
} from "@/lib/server/domains/content/types";
import { isCustomId } from "@/lib/server/domains/content/ids";
import { HttpError } from "@/lib/server/core/errors";
import {
	collectInteractiveImagePaths,
	diffRemovedImagePaths,
	interactiveService,
	isInteractiveContentType,
	QuizAttemptSubmission,
} from "@/lib/server/domains/content/interactiveService";
import { QuizContent } from "@/types";

function sanitizeMaterialItem(item: TopicItemData): TopicItemData {
	if (item.type === "Quiz" || item.type === "Flashcard") {
		return {
			...item,
			interactiveRefId: item.interactiveRefId ?? item.id,
			content: undefined,
		};
	}

	return {
		...item,
		content: undefined,
		interactiveRefId: undefined,
	};
}

export class AdminContentService {
	private useContextMutationPaths(): boolean {
		return process.env.USE_CONTEXT_MUTATION_PATHS !== "0";
	}

	private async refreshCustomSubjectProjection(courseId: string): Promise<void> {
		if (!isCustomId(courseId)) return;
		try {
			await contentRepository.rebuildCustomCourseSubjectView(courseId);
		} catch (error) {
			console.error("Failed to rebuild custom subject projection:", error);
		}
	}

	async createCourse(input: CreateCourseInput): Promise<CourseRecord> {
		const created = await contentRepository.createCustomCourse(input);
		await Promise.allSettled([
			contentRepository.upsertCustomCourseInCatalog(created),
			this.refreshCustomSubjectProjection(created.id),
		]);
		return created;
	}

	async deleteCourse(courseId: string): Promise<{ courseId: string }> {
		const deleted = await contentRepository.deleteCourseCascade(courseId);
		if (!deleted) {
			throw new HttpError(404, "Course not found", "course_not_found");
		}
		await Promise.allSettled([
			contentRepository.removeCustomCourseFromCatalog(courseId),
			contentRepository.deleteSubjectView(courseId),
		]);
		return { courseId };
	}

	async createTopic(input: CreateTopicInput): Promise<TopicRecord> {
		const created = await contentRepository.createTopic(input);
		await this.refreshCustomSubjectProjection(created.courseId);
		return created;
	}

	async deleteTopic(
		topicId: string,
		context?: { courseId?: string }
	): Promise<{ deleted: boolean; courseId?: string }> {
		const deleted =
			this.useContextMutationPaths() && context?.courseId
				? await contentRepository.deleteTopicCascadeByIdInCourse(context.courseId, topicId)
				: await contentRepository.deleteTopicCascadeById(topicId);

		if (!deleted.deleted) {
			throw new HttpError(404, "Topic not found", "topic_not_found");
		}
		if (deleted.courseId) {
			await this.refreshCustomSubjectProjection(deleted.courseId);
		}
		return deleted;
	}

	async createMaterial(input: CreateMaterialInput): Promise<MaterialRecord> {
		const sanitized = sanitizeMaterialItem(input.item);
		const created = await contentRepository.createMaterial({
			courseId: input.courseId,
			topicId: input.topicId,
			itemId: input.itemId,
			item: sanitized,
		});

		if (isInteractiveContentType(created.item.type)) {
			if (!input.interactive) {
				throw new HttpError(
					400,
					"Interactive payload is required for quiz and flashcard materials.",
					"validation_error"
				);
			}

			await interactiveService.upsertInteractiveContent({
				itemId: created.id,
				courseId: created.courseId,
				topicId: created.topicId,
				title: created.item.title,
				contentType: input.interactive.contentType,
				content: input.interactive.content,
			});
		}

		await this.refreshCustomSubjectProjection(created.courseId);
		return created;
	}

	async updateMaterial(
		itemId: string,
		input: UpdateMaterialInput,
		context?: { courseId?: string; topicId?: string }
	): Promise<MaterialRecord> {
		const previousInteractive = await interactiveService.getInteractiveContent(itemId);
		const sanitized = sanitizeMaterialItem(input.item);
		const updated =
			this.useContextMutationPaths() && context?.courseId && context.topicId
				? await contentRepository.updateMaterialByIdInTopic(
						context.courseId,
						context.topicId,
						itemId,
						sanitized
					)
				: await contentRepository.updateMaterialById(itemId, sanitized);
		if (!updated) {
			throw new HttpError(404, "Material not found", "material_not_found");
		}

		if (isInteractiveContentType(updated.item.type)) {
			if (!input.interactive) {
				throw new HttpError(
					400,
					"Interactive payload is required for quiz and flashcard materials.",
					"validation_error"
				);
			}
			const { previous } = await interactiveService.upsertInteractiveContent({
				itemId,
				courseId: updated.courseId,
				topicId: updated.topicId,
				title: updated.item.title,
				contentType: input.interactive.contentType,
				content: input.interactive.content,
			});
			if (previous) {
				const removedPaths = diffRemovedImagePaths(
					previous.contentType,
					previous.content,
					input.interactive.contentType,
					input.interactive.content
				);
				if (removedPaths.length > 0) {
					await interactiveService.deleteStoragePaths(removedPaths);
				}
			}
		} else if (previousInteractive) {
			await interactiveService.deleteInteractiveContent(itemId);
			await interactiveService.deleteAttemptsAndSessionsByItemId(itemId);
			await interactiveService.deleteStoragePaths(
				collectInteractiveImagePaths(
					previousInteractive.contentType,
					previousInteractive.content
				)
			);
		}

		await this.refreshCustomSubjectProjection(updated.courseId);
		return updated;
	}

	async deleteMaterial(
		itemId: string,
		context?: { courseId?: string; topicId?: string }
	): Promise<{ deleted: boolean; courseId?: string; topicId?: string }> {
		const interactive = await interactiveService.getInteractiveContent(itemId);
		const deleted =
			this.useContextMutationPaths() && context?.courseId && context.topicId
				? await contentRepository.deleteMaterialByIdInTopic(
						context.courseId,
						context.topicId,
						itemId
					)
				: await contentRepository.deleteMaterialById(itemId);

		if (!deleted.deleted) {
			throw new HttpError(404, "Material not found", "material_not_found");
		}
		if (deleted.courseId) {
			await this.refreshCustomSubjectProjection(deleted.courseId);
		}

		if (interactive) {
			await interactiveService.deleteInteractiveContent(itemId);
			await interactiveService.deleteAttemptsAndSessionsByItemId(itemId);
			await interactiveService.deleteStoragePaths(
				collectInteractiveImagePaths(interactive.contentType, interactive.content)
			);
		}

		return deleted;
	}

	async createInteractiveContent(
		input: CreateInteractiveInput
	): Promise<InteractiveContentRecord> {
		const created = await interactiveService.upsertInteractiveContent({
			itemId: input.itemId,
			courseId: input.courseId,
			topicId: input.topicId,
			title: input.title,
			contentType: input.contentType,
			content: input.content,
		});
		return created.record;
	}

	async getInteractiveContentByItemId(itemId: string): Promise<InteractiveContentRecord> {
		const content = await interactiveService.getInteractiveContent(itemId);
		if (!content) {
			throw new HttpError(404, "Interactive content not found", "not_found");
		}
		return content;
	}

	async submitQuizAttempt(input: {
		itemId: string;
		uid: string;
		answers: QuizAttemptSubmission;
	}): Promise<{
		attemptId: string;
		score: number;
		maxScore: number;
		perQuestion: Array<{
			questionId: string;
			earnedPoints: number;
			maxPoints: number;
			correct: boolean;
		}>;
	}> {
		const interactive = await this.getInteractiveContentByItemId(input.itemId);
		if (interactive.contentType !== "Quiz") {
			throw new HttpError(400, "Material is not a quiz", "validation_error");
		}

		const quizContent = interactive.content as QuizContent;
		const scored = interactiveService.scoreQuiz(quizContent, input.answers);
		const attempt = await interactiveService.createQuizAttempt({
			itemId: interactive.id,
			courseId: interactive.courseId,
			topicId: interactive.topicId,
			uid: input.uid,
			quizVersion: interactive.version,
			answers: input.answers,
			snapshot: quizContent,
			score: scored,
		});

		return {
			attemptId: attempt.id,
			score: scored.score,
			maxScore: scored.maxScore,
			perQuestion: scored.perQuestion,
		};
	}

	async createFlashcardSession(input: {
		itemId: string;
		uid: string;
		meta?: { shuffleEnabled?: boolean };
	}): Promise<{ sessionId: string }> {
		const interactive = await this.getInteractiveContentByItemId(input.itemId);
		if (interactive.contentType !== "Flashcard") {
			throw new HttpError(400, "Material is not a flashcard", "validation_error");
		}
		const session = await interactiveService.createFlashcardSession({
			itemId: interactive.id,
			courseId: interactive.courseId,
			topicId: interactive.topicId,
			uid: input.uid,
			meta: input.meta,
		});
		return { sessionId: session.id };
	}

	async appendFlashcardSessionEvents(input: {
		sessionId: string;
		uid: string;
		events: Array<{
			at: string;
			type: "flip" | "next" | "prev" | "shuffle" | "open" | "close";
			cardId?: string;
			payload?: Record<string, unknown>;
		}>;
	}): Promise<void> {
		await interactiveService.appendFlashcardSessionEvents(input);
	}

	async completeFlashcardSession(input: {
		sessionId: string;
		uid: string;
		summary?: {
			cardsViewed: number;
			flipCount: number;
			durationMs: number;
		};
	}): Promise<void> {
		await interactiveService.completeFlashcardSession(input);
	}

	async cleanupExpiredInteractiveData(retentionDays = 180): Promise<{
		attemptsDeleted: number;
		sessionsDeleted: number;
	}> {
		const before = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
		return interactiveService.cleanupExpiredInteractions(before);
	}

	async cleanupLegacyInlineInteractiveMaterials(): Promise<{ deletedMaterials: number }> {
		return interactiveService.cleanupLegacyInlineInteractiveMaterials();
	}
}

export const adminContentService = new AdminContentService();
