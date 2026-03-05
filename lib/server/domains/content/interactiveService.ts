import { FieldValue, Firestore, Timestamp } from "firebase-admin/firestore";
import type { Bucket } from "@google-cloud/storage";
import {
	FlashcardContent,
	ImageAsset,
	QuizContent,
	ShortAnswerMatchMode,
} from "@/types";
import { createCustomId } from "@/lib/server/domains/content/ids";
import {
	getFirebaseStorageBucket,
	getFirestoreDb,
} from "@/lib/server/integrations/firebase/admin";
import { HttpError } from "@/lib/server/core/errors";

type InteractiveDoc = {
	courseId: string;
	topicId: string;
	title: string;
	contentType: "Quiz" | "Flashcard";
	version: number;
	content: QuizContent | FlashcardContent;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
};

type QuizAttemptDoc = {
	itemId: string;
	courseId: string;
	topicId: string;
	uid: string;
	submittedAt?: FieldValue | Timestamp;
	quizVersion: number;
	answers: Record<
		string,
		{
			selectedOptionIds?: string[];
			shortAnswer?: string;
		}
	>;
	score: number;
	maxScore: number;
	snapshot: QuizContent;
	perQuestion: Array<{
		questionId: string;
		earnedPoints: number;
		maxPoints: number;
		correct: boolean;
	}>;
};

type FlashcardSessionEvent = {
	at: string;
	type: "flip" | "next" | "prev" | "shuffle" | "open" | "close";
	cardId?: string;
	payload?: Record<string, unknown>;
};

type FlashcardSessionDoc = {
	itemId: string;
	courseId: string;
	topicId: string;
	uid: string;
	startedAt?: FieldValue | Timestamp;
	endedAt?: FieldValue | Timestamp;
	events: FlashcardSessionEvent[];
	meta?: {
		shuffleEnabled?: boolean;
	};
	summary?: {
		cardsViewed: number;
		flipCount: number;
		durationMs: number;
	};
	updatedAt?: FieldValue | Timestamp;
};

export type InteractiveContentRecord = {
	id: string;
	courseId: string;
	topicId: string;
	title: string;
	contentType: "Quiz" | "Flashcard";
	version: number;
	content: QuizContent | FlashcardContent;
};

export type QuizAttemptSubmission = Record<
	string,
	{
		selectedOptionIds?: string[];
		shortAnswer?: string;
	}
>;

export type ScoredQuizAttempt = {
	score: number;
	maxScore: number;
	perQuestion: Array<{
		questionId: string;
		earnedPoints: number;
		maxPoints: number;
		correct: boolean;
	}>;
};

function normalizeShortAnswer(value: string, mode: ShortAnswerMatchMode): string {
	if (mode === "exact") return value;
	if (mode === "ignore_case") return value.toLowerCase();
	return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function toNumber(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	return 0;
}

function toImagePathsFromQuiz(content: QuizContent): string[] {
	const paths: string[] = [];
	for (const question of content.questions) {
		if (question.image?.path) {
			paths.push(question.image.path);
		}
	}
	return paths;
}

function toImagePathsFromFlashcard(content: FlashcardContent): string[] {
	const paths: string[] = [];
	for (const card of content.cards) {
		if (card.frontImage?.path) {
			paths.push(card.frontImage.path);
		}
		if (card.backImage?.path) {
			paths.push(card.backImage.path);
		}
	}
	return paths;
}

export function collectInteractiveImagePaths(
	contentType: "Quiz" | "Flashcard",
	content: QuizContent | FlashcardContent
): string[] {
	return contentType === "Quiz"
		? toImagePathsFromQuiz(content as QuizContent)
		: toImagePathsFromFlashcard(content as FlashcardContent);
}

function unique(values: string[]): string[] {
	return [...new Set(values.filter(Boolean))];
}

async function deleteByRefs(db: Firestore, refs: string[]): Promise<number> {
	if (refs.length === 0) return 0;
	let deleted = 0;
	const chunkSize = 400;
	for (let index = 0; index < refs.length; index += chunkSize) {
		const batch = db.batch();
		const chunk = refs.slice(index, index + chunkSize);
		for (const path of chunk) {
			batch.delete(db.doc(path));
		}
		await batch.commit();
		deleted += chunk.length;
	}
	return deleted;
}

export class InteractiveService {
	constructor(
		private readonly dbFactory: () => Firestore = getFirestoreDb,
		private readonly bucketFactory: () => Bucket = getFirebaseStorageBucket
	) { }

	private getDb(): Firestore {
		return this.dbFactory();
	}

	private interactiveRef(itemId: string) {
		return this.getDb().collection("interactive_contents").doc(itemId);
	}

	private attemptsRef() {
		return this.getDb().collection("interactive_attempts");
	}

	private sessionsRef() {
		return this.getDb().collection("flashcard_sessions");
	}

	async getInteractiveContent(itemId: string): Promise<InteractiveContentRecord | null> {
		const snapshot = await this.interactiveRef(itemId).get();
		if (!snapshot.exists) return null;
		const data = snapshot.data() as InteractiveDoc | undefined;
		if (!data) return null;
		return {
			id: snapshot.id,
			courseId: data.courseId,
			topicId: data.topicId,
			title: data.title,
			contentType: data.contentType,
			version: data.version,
			content: data.content,
		};
	}

	async upsertInteractiveContent(input: {
		itemId: string;
		courseId: string;
		topicId: string;
		title: string;
		contentType: "Quiz" | "Flashcard";
		content: QuizContent | FlashcardContent;
	}): Promise<{
		record: InteractiveContentRecord;
		previous?: InteractiveContentRecord;
	}> {
		const ref = this.interactiveRef(input.itemId);
		const db = this.getDb();

		return db.runTransaction(async (tx) => {
			const snapshot = await tx.get(ref);
			const existing = snapshot.exists ? (snapshot.data() as InteractiveDoc) : null;
			const now = FieldValue.serverTimestamp();
			const nextVersion = (existing?.version ?? 0) + 1;
			tx.set(ref, {
				courseId: input.courseId,
				topicId: input.topicId,
				title: input.title,
				contentType: input.contentType,
				version: nextVersion,
				content: input.content,
				createdAt: existing?.createdAt ?? now,
				updatedAt: now,
			});

			const record: InteractiveContentRecord = {
				id: input.itemId,
				courseId: input.courseId,
				topicId: input.topicId,
				title: input.title,
				contentType: input.contentType,
				version: nextVersion,
				content: input.content,
			};

			const previous: InteractiveContentRecord | undefined = existing
				? {
					id: input.itemId,
					courseId: existing.courseId,
					topicId: existing.topicId,
					title: existing.title,
					contentType: existing.contentType,
					version: existing.version,
					content: existing.content,
				}
				: undefined;

			return { record, previous };
		});
	}

	async deleteInteractiveContent(itemId: string): Promise<InteractiveContentRecord | null> {
		const ref = this.interactiveRef(itemId);
		const snapshot = await ref.get();
		if (!snapshot.exists) return null;
		const data = snapshot.data() as InteractiveDoc | undefined;
		if (!data) return null;
		await ref.delete();
		return {
			id: itemId,
			courseId: data.courseId,
			topicId: data.topicId,
			title: data.title,
			contentType: data.contentType,
			version: data.version,
			content: data.content,
		};
	}

	async deleteStoragePaths(paths: string[]): Promise<void> {
		const bucket = this.bucketFactory();
		const uniquePaths = unique(paths);
		await Promise.allSettled(
			uniquePaths.map((path) => bucket.file(path).delete({ ignoreNotFound: true }))
		);
	}

	scoreQuiz(content: QuizContent, answers: QuizAttemptSubmission): ScoredQuizAttempt {
		const perQuestion: ScoredQuizAttempt["perQuestion"] = [];
		let totalScore = 0;
		let maxScore = 0;

		for (const question of content.questions) {
			maxScore += question.maxPoints;
			const answer = answers[question.id] ?? {};

			if (question.kind === "mcq") {
				const selected = new Set(answer.selectedOptionIds ?? []);
				let raw = 0;
				for (const option of question.options) {
					if (selected.has(option.id)) {
						raw += toNumber(option.weight);
					}
				}
				const earned = clamp(raw, 0, question.maxPoints);
				totalScore += earned;
				perQuestion.push({
					questionId: question.id,
					earnedPoints: earned,
					maxPoints: question.maxPoints,
					correct: earned >= question.maxPoints,
				});
				continue;
			}

			const submitted = answer.shortAnswer ?? "";
			const normalizedSubmitted = normalizeShortAnswer(submitted, question.matchMode);
			const matched = question.acceptedAnswers.some((candidate) => {
				return (
					normalizeShortAnswer(candidate, question.matchMode) === normalizedSubmitted
				);
			});
			const earned = matched ? question.maxPoints : 0;
			totalScore += earned;
			perQuestion.push({
				questionId: question.id,
				earnedPoints: earned,
				maxPoints: question.maxPoints,
				correct: matched,
			});
		}

		return { score: totalScore, maxScore, perQuestion };
	}

	async createQuizAttempt(input: {
		itemId: string;
		courseId: string;
		topicId: string;
		uid: string;
		quizVersion: number;
		answers: QuizAttemptSubmission;
		snapshot: QuizContent;
		score: ScoredQuizAttempt;
	}): Promise<{ id: string; submittedAt?: string }> {
		const id = createCustomId();
		const now = FieldValue.serverTimestamp();
		const payload: QuizAttemptDoc = {
			itemId: input.itemId,
			courseId: input.courseId,
			topicId: input.topicId,
			uid: input.uid,
			submittedAt: now,
			quizVersion: input.quizVersion,
			answers: input.answers,
			score: input.score.score,
			maxScore: input.score.maxScore,
			snapshot: input.snapshot,
			perQuestion: input.score.perQuestion,
		};
		await this.attemptsRef().doc(id).set(payload);
		return { id };
	}

	async createFlashcardSession(input: {
		itemId: string;
		courseId: string;
		topicId: string;
		uid: string;
		meta?: { shuffleEnabled?: boolean };
	}): Promise<{ id: string }> {
		const id = createCustomId();
		const now = FieldValue.serverTimestamp();
		const payload: FlashcardSessionDoc = {
			itemId: input.itemId,
			courseId: input.courseId,
			topicId: input.topicId,
			uid: input.uid,
			startedAt: now,
			events: [],
			meta: input.meta,
			updatedAt: now,
		};
		await this.sessionsRef().doc(id).set(payload);
		return { id };
	}

	async appendFlashcardSessionEvents(input: {
		sessionId: string;
		itemId?: string;
		uid: string;
		events: FlashcardSessionEvent[];
	}): Promise<void> {
		const MAX_EVENTS_PER_SESSION = 2000;
		const ref = this.sessionsRef().doc(input.sessionId);
		const db = this.getDb();

		await db.runTransaction(async (tx) => {
			const snapshot = await tx.get(ref);
			if (!snapshot.exists) {
				throw new HttpError(404, "Session not found", "session_not_found");
			}
			const existing = snapshot.data() as FlashcardSessionDoc | undefined;
			if (!existing || existing.uid !== input.uid) {
				throw new HttpError(403, "Forbidden", "forbidden");
			}
			if (input.itemId && existing.itemId !== input.itemId) {
				throw new HttpError(403, "Session does not belong to this item", "forbidden");
			}
			const currentEvents = existing.events ?? [];
			if (currentEvents.length + input.events.length > MAX_EVENTS_PER_SESSION) {
				throw new HttpError(
					400,
					`Session event limit reached (max ${MAX_EVENTS_PER_SESSION}).`,
					"event_limit_reached"
				);
			}
			tx.update(ref, {
				events: [...currentEvents, ...input.events],
				updatedAt: FieldValue.serverTimestamp(),
			});
		});
	}

	async completeFlashcardSession(input: {
		sessionId: string;
		itemId?: string;
		uid: string;
		summary?: {
			cardsViewed: number;
			flipCount: number;
			durationMs: number;
		};
	}): Promise<void> {
		const ref = this.sessionsRef().doc(input.sessionId);
		const snapshot = await ref.get();
		if (!snapshot.exists) {
			throw new HttpError(404, "Session not found", "session_not_found");
		}
		const existing = snapshot.data() as FlashcardSessionDoc | undefined;
		if (!existing || existing.uid !== input.uid) {
			throw new HttpError(403, "Forbidden", "forbidden");
		}
		if (input.itemId && existing.itemId !== input.itemId) {
			throw new HttpError(403, "Session does not belong to this item", "forbidden");
		}
		await ref.update({
			endedAt: FieldValue.serverTimestamp(),
			summary: input.summary ?? null,
			updatedAt: FieldValue.serverTimestamp(),
		});
	}

	async deleteAttemptsAndSessionsByItemId(itemId: string): Promise<void> {
		const [attempts, sessions] = await Promise.all([
			this.attemptsRef().where("itemId", "==", itemId).get(),
			this.sessionsRef().where("itemId", "==", itemId).get(),
		]);
		const paths = [
			...attempts.docs.map((doc) => doc.ref.path),
			...sessions.docs.map((doc) => doc.ref.path),
		];
		await deleteByRefs(this.getDb(), paths);
	}

	async cleanupExpiredInteractions(before: Date): Promise<{
		attemptsDeleted: number;
		sessionsDeleted: number;
	}> {
		const QUERY_LIMIT = 1000;
		const beforeTimestamp = Timestamp.fromDate(before);
		const [attemptsSnapshot, endedSessionsSnapshot, startedSessionsSnapshot] =
			await Promise.all([
				this.attemptsRef().where("submittedAt", "<=", beforeTimestamp).limit(QUERY_LIMIT).get(),
				this.sessionsRef().where("endedAt", "<=", beforeTimestamp).limit(QUERY_LIMIT).get(),
				this.sessionsRef().where("startedAt", "<=", beforeTimestamp).limit(QUERY_LIMIT).get(),
			]);

		const attemptPaths = attemptsSnapshot.docs.map((doc) => doc.ref.path);
		const sessionPaths = unique([
			...endedSessionsSnapshot.docs.map((doc) => doc.ref.path),
			...startedSessionsSnapshot.docs.map((doc) => doc.ref.path),
		]);

		const [attemptsDeleted, sessionsDeleted] = await Promise.all([
			deleteByRefs(this.getDb(), attemptPaths),
			deleteByRefs(this.getDb(), sessionPaths),
		]);

		return { attemptsDeleted, sessionsDeleted };
	}

	async cleanupLegacyInlineInteractiveMaterials(): Promise<{ deletedMaterials: number }> {
		const QUERY_LIMIT = 1000;
		const [quizSnapshot, flashcardSnapshot] = await Promise.all([
			this.getDb().collectionGroup("items").where("item.type", "==", "Quiz").limit(QUERY_LIMIT).get(),
			this.getDb().collectionGroup("items").where("item.type", "==", "Flashcard").limit(QUERY_LIMIT).get(),
		]);

		const stalePaths = unique(
			[...quizSnapshot.docs, ...flashcardSnapshot.docs]
				.filter((doc) => {
					const item = (doc.data()?.item ?? {}) as Record<string, unknown>;
					const hasInteractiveRefId =
						typeof item.interactiveRefId === "string" && item.interactiveRefId.length > 0;
					const hasInlineContent = typeof item.content === "object" && item.content !== null;
					return !hasInteractiveRefId || hasInlineContent;
				})
				.map((doc) => doc.ref.path)
		);

		const deletedMaterials = await deleteByRefs(this.getDb(), stalePaths);
		return { deletedMaterials };
	}
}

export const interactiveService = new InteractiveService();

export function diffRemovedImagePaths(
	previousContentType: "Quiz" | "Flashcard",
	previousContent: QuizContent | FlashcardContent,
	nextContentType: "Quiz" | "Flashcard",
	nextContent: QuizContent | FlashcardContent
): string[] {
	const previousPaths = new Set(
		collectInteractiveImagePaths(previousContentType, previousContent)
	);
	const nextPaths = new Set(collectInteractiveImagePaths(nextContentType, nextContent));
	const removed: string[] = [];
	for (const path of previousPaths) {
		if (!nextPaths.has(path)) {
			removed.push(path);
		}
	}
	return removed;
}

export function isInteractiveContentType(value: string): value is "Quiz" | "Flashcard" {
	return value === "Quiz" || value === "Flashcard";
}

export function toImageAsset(value: unknown): ImageAsset | undefined {
	if (!value || typeof value !== "object") return undefined;
	const candidate = value as Partial<ImageAsset>;
	if (!candidate.path || !candidate.url || !candidate.alt) return undefined;
	return {
		path: candidate.path,
		url: candidate.url,
		alt: candidate.alt,
	};
}
