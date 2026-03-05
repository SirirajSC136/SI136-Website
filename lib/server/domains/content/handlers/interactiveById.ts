import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { isCustomId } from "@/lib/server/domains/content/ids";
import {
	requireAdminFromRequest,
	requireAuthFromRequest,
} from "@/lib/server/domains/auth/service";
import {
	adminContentService,
} from "@/lib/server/domains/content/service";
import {
	completeFlashcardSessionSchema,
	createFlashcardSessionSchema,
	quizAttemptSubmissionSchema,
	patchFlashcardSessionSchema,
} from "@/lib/server/domains/content/schemas";
import { createRateLimiter } from "@/lib/server/core/rateLimit";

// 10 quiz submissions per user per minute
const quizAttemptLimiter = createRateLimiter("quiz-attempt", {
	windowMs: 60_000,
	maxRequests: 10,
});

// 5 flashcard session creations per user per minute
const flashcardSessionLimiter = createRateLimiter("flashcard-session", {
	windowMs: 60_000,
	maxRequests: 5,
});

// 30 event flush requests per user per minute
const flashcardEventLimiter = createRateLimiter("flashcard-events", {
	windowMs: 60_000,
	maxRequests: 30,
});

function assertCustomId(itemId: string): void {
	if (!isCustomId(itemId)) {
		throw new HttpError(400, "Invalid Item ID format", "validation_error");
	}
}

export const getInteractiveByIdHandler = withErrorHandling(
	async (
		request: Request,
		{ params }: { params: Promise<{ itemId: string }> }
	) => {
		await requireAuthFromRequest(request);
		const { itemId } = await params;
		assertCustomId(itemId);
		const content = await adminContentService.getInteractiveContentByItemId(itemId);
		return NextResponse.json({ success: true, data: content });
	}
);

export const postInteractiveAttemptHandler = withErrorHandling(
	async (
		request: Request,
		{ params }: { params: Promise<{ itemId: string }> }
	) => {
		const user = await requireAuthFromRequest(request);
		const { itemId } = await params;
		assertCustomId(itemId);

		const rateLimit = quizAttemptLimiter.check(user.uid);
		if (!rateLimit.allowed) {
			throw new HttpError(
				429,
				"Too many quiz submissions. Try again shortly.",
				"rate_limited"
			);
		}

		const body = await request.json();
		const parsed = quizAttemptSubmissionSchema.safeParse(body);
		if (!parsed.success) {
			throw new HttpError(
				400,
				"Invalid quiz attempt payload",
				"validation_error",
				parsed.error.flatten()
			);
		}

		const result = await adminContentService.submitQuizAttempt({
			itemId,
			uid: user.uid,
			answers: parsed.data.answers,
		});
		return NextResponse.json({ success: true, data: result }, { status: 201 });
	}
);

export const postInteractiveSessionHandler = withErrorHandling(
	async (
		request: Request,
		{ params }: { params: Promise<{ itemId: string }> }
	) => {
		const user = await requireAuthFromRequest(request);
		const { itemId } = await params;
		assertCustomId(itemId);

		const rateLimit = flashcardSessionLimiter.check(user.uid);
		if (!rateLimit.allowed) {
			throw new HttpError(
				429,
				"Too many flashcard sessions created. Try again shortly.",
				"rate_limited"
			);
		}

		const body = await request.json().catch(() => ({}));
		const parsed = createFlashcardSessionSchema.safeParse(body);
		if (!parsed.success) {
			throw new HttpError(
				400,
				"Invalid flashcard session payload",
				"validation_error",
				parsed.error.flatten()
			);
		}

		const result = await adminContentService.createFlashcardSession({
			itemId,
			uid: user.uid,
			meta: parsed.data.meta,
		});
		return NextResponse.json({ success: true, data: result }, { status: 201 });
	}
);

export const patchInteractiveSessionByIdHandler = withErrorHandling(
	async (
		request: Request,
		{
			params,
		}: { params: Promise<{ itemId: string; sessionId: string }> }
	) => {
		const user = await requireAuthFromRequest(request);
		const { itemId, sessionId } = await params;
		assertCustomId(itemId);
		assertCustomId(sessionId);

		const rateLimit = flashcardEventLimiter.check(user.uid);
		if (!rateLimit.allowed) {
			throw new HttpError(
				429,
				"Too many event requests. Try again shortly.",
				"rate_limited"
			);
		}

		const body = await request.json();
		const parsed = patchFlashcardSessionSchema.safeParse(body);
		if (!parsed.success) {
			throw new HttpError(
				400,
				"Invalid flashcard session event payload",
				"validation_error",
				parsed.error.flatten()
			);
		}

		await adminContentService.appendFlashcardSessionEvents({
			sessionId,
			itemId,
			uid: user.uid,
			events: parsed.data.events,
		});
		return NextResponse.json({ success: true });
	}
);

export const postCompleteInteractiveSessionByIdHandler = withErrorHandling(
	async (
		request: Request,
		{
			params,
		}: { params: Promise<{ itemId: string; sessionId: string }> }
	) => {
		const user = await requireAuthFromRequest(request);
		const { itemId, sessionId } = await params;
		assertCustomId(itemId);
		assertCustomId(sessionId);

		const body = await request.json().catch(() => ({}));
		const parsed = completeFlashcardSessionSchema.safeParse(body);
		if (!parsed.success) {
			throw new HttpError(
				400,
				"Invalid flashcard session completion payload",
				"validation_error",
				parsed.error.flatten()
			);
		}

		await adminContentService.completeFlashcardSession({
			sessionId,
			itemId,
			uid: user.uid,
			summary: parsed.data.summary,
		});

		return NextResponse.json({ success: true });
	}
);

function hasValidCronSecret(request: Request): boolean {
	const configuredSecret = process.env.CRON_SECRET;
	if (!configuredSecret) return false;
	const providedSecret = request.headers.get("x-cron-secret");
	return providedSecret === configuredSecret;
}

export const postInteractiveRetentionCleanupHandler = withErrorHandling(
	async (request: Request) => {
		if (!hasValidCronSecret(request)) {
			await requireAdminFromRequest(request);
		}
		const retentionDays = Number(process.env.INTERACTIVE_RETENTION_DAYS ?? "180");
		const result = await adminContentService.cleanupExpiredInteractiveData(retentionDays);
		return NextResponse.json({ success: true, data: result });
	}
);

export const postLegacyInlineInteractiveCleanupHandler = withErrorHandling(
	async (request: Request) => {
		await requireAdminFromRequest(request);
		const result = await adminContentService.cleanupLegacyInlineInteractiveMaterials();
		return NextResponse.json({ success: true, data: result });
	}
);
