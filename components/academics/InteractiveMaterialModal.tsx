"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import {
	FlashcardContent,
	QuizContent,
	QuizQuestion,
	ShortAnswerMatchMode,
} from "@/types";
import MarkdownMath from "@/components/academics/MarkdownMath";

type InteractiveRecord = {
	id: string;
	courseId: string;
	topicId: string;
	title: string;
	contentType: "Quiz" | "Flashcard";
	version: number;
	content: QuizContent | FlashcardContent;
};

type QuizAnswer = {
	selectedOptionIds?: string[];
	shortAnswer?: string;
};

type QuizResponse = {
	attemptId: string;
	score: number;
	maxScore: number;
	perQuestion: Array<{
		questionId: string;
		earnedPoints: number;
		maxPoints: number;
		correct: boolean;
	}>;
};

type FlashcardEvent = {
	at: string;
	type: "flip" | "next" | "prev" | "shuffle" | "open" | "close";
	cardId?: string;
	payload?: Record<string, unknown>;
};

type Props = {
	isOpen: boolean;
	loading: boolean;
	error: string | null;
	data: InteractiveRecord | null;
	onClose: () => void;
};

function normalizeShortAnswer(value: string, mode: ShortAnswerMatchMode): string {
	if (mode === "exact") return value;
	if (mode === "ignore_case") return value.toLowerCase();
	return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function gradeSingleQuestion(question: QuizQuestion, answer: QuizAnswer | undefined) {
	if (question.kind === "mcq") {
		const selected = new Set(answer?.selectedOptionIds ?? []);
		const total = question.options.reduce((sum, option) => {
			if (!selected.has(option.id)) return sum;
			return sum + option.weight;
		}, 0);
		const earned = Math.max(0, Math.min(question.maxPoints, total));
		return {
			earnedPoints: earned,
			maxPoints: question.maxPoints,
			correct: earned >= question.maxPoints,
		};
	}

	const submitted = normalizeShortAnswer(answer?.shortAnswer ?? "", question.matchMode);
	const matched = question.acceptedAnswers.some(
		(candidate) => normalizeShortAnswer(candidate, question.matchMode) === submitted
	);
	return {
		earnedPoints: matched ? question.maxPoints : 0,
		maxPoints: question.maxPoints,
		correct: matched,
	};
}

function shuffleArray<T>(source: T[]): T[] {
	const result = [...source];
	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

function InteractiveQuizPlayer({
	data,
	onClose,
}: {
	data: InteractiveRecord;
	onClose: () => void;
}) {
	const quiz = data.content as QuizContent;
	const shouldReduceMotion = useReducedMotion();
	const questionOrder = useMemo(() => {
		if (quiz.settings.shuffleQuestions) {
			return shuffleArray(quiz.questions);
		}
		return quiz.questions;
	}, [quiz.questions, quiz.settings.shuffleQuestions]);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
	const [instantResults, setInstantResults] = useState<
		Record<string, { earnedPoints: number; maxPoints: number; correct: boolean }>
	>({});
	const [submitting, setSubmitting] = useState(false);
	const [submitResult, setSubmitResult] = useState<QuizResponse | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const currentQuestion = questionOrder[currentIndex];

	const updateQuestionAnswer = (questionId: string, updater: (previous: QuizAnswer) => QuizAnswer) => {
		setAnswers((previous) => {
			const current = previous[questionId] ?? {};
			return {
				...previous,
				[questionId]: updater(current),
			};
		});
	};

	const handleSubmitQuiz = async () => {
		const answeredCount = Object.keys(answers).length;
		const totalCount = questionOrder.length;
		if (answeredCount < totalCount) {
			const confirmed = window.confirm(
				`You have answered ${answeredCount} of ${totalCount} questions. Submit anyway?`
			);
			if (!confirmed) return;
		}
		setSubmitError(null);
		setSubmitting(true);
		try {
			const response = await fetch(`/api/interactive/${data.id}/attempts`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ answers }),
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload?.error || "Failed to submit quiz.");
			}
			setSubmitResult(payload.data as QuizResponse);
		} catch (error) {
			console.error("Submit quiz failed:", error);
			setSubmitError("Could not submit quiz. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	const activeFeedback =
		quiz.settings.feedbackMode === "instant"
			? instantResults[currentQuestion.id]
			: submitResult?.perQuestion.find((entry) => entry.questionId === currentQuestion.id);

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-xl font-bold text-primary leading-tight">{data.title}</h3>
				<button
					type="button"
					onClick={onClose}
					className="shrink-0 rounded-lg bg-muted p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
				>
					<X size={16} />
				</button>
			</div>

			{/* Progress bar */}
			<div className="space-y-1.5">
				<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
					<span>Question {currentIndex + 1} of {questionOrder.length}</span>
					{submitResult && (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
							Score: {submitResult.score.toFixed(2)} / {submitResult.maxScore.toFixed(2)}
						</span>
					)}
				</div>
				<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
					<div
						className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
						style={{ width: `${((currentIndex + 1) / questionOrder.length) * 100}%` }}
					/>
				</div>
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={currentQuestion.id}
					initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
					animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
					exit={shouldReduceMotion ? {} : { opacity: 0, x: -18 }}
					transition={{ duration: 0.2 }}
					className="rounded-xl bg-card ring-1 ring-border shadow-sm p-5 space-y-4"
				>
					<div className="prose prose-slate max-w-none">
						<MarkdownMath value={currentQuestion.promptMarkdown} />
					</div>
					{currentQuestion.image && (
						<img
							src={currentQuestion.image.url}
							alt={currentQuestion.image.alt}
							className="max-h-64 w-full rounded border object-contain bg-white"
						/>
					)}

					{currentQuestion.kind === "mcq" ? (
						<div className="space-y-2">
							{currentQuestion.options.map((option) => {
								const checked = Boolean(
									answers[currentQuestion.id]?.selectedOptionIds?.includes(option.id)
								);
								return (
									<label
										key={option.id}
										className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-all ring-1 ${checked
											? "ring-blue-500/60 bg-blue-500/10"
											: "ring-border bg-muted/50 hover:ring-primary/40 hover:bg-muted"
											}`}
									>
										<input
											type="checkbox"
											checked={checked}
											className="accent-blue-500"
											onChange={(event) =>
												updateQuestionAnswer(currentQuestion.id, (previous) => {
													const nextSet = new Set(previous.selectedOptionIds ?? []);
													if (event.target.checked) {
														nextSet.add(option.id);
													} else {
														nextSet.delete(option.id);
													}
													return {
														...previous,
														selectedOptionIds: [...nextSet],
													};
												})
											}
										/>
										<div className="prose prose-slate dark:prose-invert max-w-none text-sm">
											<MarkdownMath value={option.textMarkdown} />
										</div>
									</label>
								);
							})}
						</div>
					) : (
						<textarea
							value={answers[currentQuestion.id]?.shortAnswer ?? ""}
							maxLength={10_000}
							onChange={(event) =>
								updateQuestionAnswer(currentQuestion.id, (previous) => ({
									...previous,
									shortAnswer: event.target.value,
								}))
							}
							className="w-full rounded-lg bg-muted/50 ring-1 ring-border p-3 text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
							placeholder="Type your answer…"
							rows={3}
						/>
					)}

					{quiz.settings.feedbackMode === "instant" && !submitResult && (() => {
						const currentAnswer = answers[currentQuestion.id];
						const hasAnswer = currentQuestion.kind === "mcq"
							? (currentAnswer?.selectedOptionIds?.length ?? 0) > 0
							: (currentAnswer?.shortAnswer?.trim().length ?? 0) > 0;
						return (
							<button
								type="button"
								disabled={!hasAnswer}
								onClick={() =>
									setInstantResults((previous) => ({
										...previous,
										[currentQuestion.id]: gradeSingleQuestion(
											currentQuestion,
											currentAnswer
										),
									}))
								}
								className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:brightness-110 transition-all disabled:opacity-50"
							>
								Check Answer
							</button>
						);
					})()}

					{activeFeedback && (
						<div
							className={`rounded-lg p-3 text-sm ring-1 ${activeFeedback.correct
								? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30"
								: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30"
								}`}
						>
							<p className="font-semibold">
								{activeFeedback.correct ? "✓ Correct" : "○ Needs Review"} — {activeFeedback.earnedPoints.toFixed(2)} / {activeFeedback.maxPoints.toFixed(2)} pts
							</p>
							{currentQuestion.explanationMarkdown && (
								<div className="prose prose-sm dark:prose-invert max-w-none mt-2">
									<MarkdownMath value={currentQuestion.explanationMarkdown} />
								</div>
							)}
						</div>
					)}
				</motion.div>
			</AnimatePresence>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex gap-2">
					<button
						type="button"
						disabled={currentIndex === 0}
						onClick={() => setCurrentIndex((previous) => Math.max(0, previous - 1))}
						className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
					>
						← Previous
					</button>
					<button
						type="button"
						disabled={currentIndex >= questionOrder.length - 1}
						onClick={() =>
							setCurrentIndex((previous) => Math.min(questionOrder.length - 1, previous + 1))
						}
						className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
					>
						Next →
					</button>
				</div>
				<button
					type="button"
					disabled={submitting || !!submitResult || questionOrder.length === 0}
					onClick={handleSubmitQuiz}
					className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50"
				>
					{submitting ? "Submitting…" : "Submit Quiz"}
				</button>
			</div>

			{submitError && <p className="text-sm text-destructive">{submitError}</p>}
		</div>
	);
}

function InteractiveFlashcardPlayer({
	data,
	onClose,
}: {
	data: InteractiveRecord;
	onClose: () => void;
}) {
	const deck = data.content as FlashcardContent;
	const shouldReduceMotion = useReducedMotion();
	const [shuffleEnabled, setShuffleEnabled] = useState(deck.settings.shuffleAllowed);
	const [cards, setCards] = useState(() => (shuffleEnabled ? shuffleArray(deck.cards) : deck.cards));
	const [currentIndex, setCurrentIndex] = useState(0);
	const [flipped, setFlipped] = useState(false);
	const [sessionStart] = useState(() => Date.now());
	const [sessionError, setSessionError] = useState<string | null>(null);
	const eventBufferRef = useRef<FlashcardEvent[]>([]);
	const flushingRef = useRef(false);
	const flipCountRef = useRef(0);
	const viewedCardIdsRef = useRef<Set<string>>(new Set());
	const sessionIdRef = useRef<string | null>(null);
	const currentCardIdRef = useRef<string | undefined>(undefined);

	const currentCard = cards[currentIndex];

	const flushEvents = useCallback(async () => {
		const currentSessionId = sessionIdRef.current;
		if (!currentSessionId || flushingRef.current) return;
		if (eventBufferRef.current.length === 0) return;
		flushingRef.current = true;
		const toFlush = [...eventBufferRef.current];
		eventBufferRef.current = [];
		try {
			await fetch(`/api/interactive/${data.id}/sessions/${currentSessionId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ events: toFlush }),
			});
		} catch (error) {
			console.error("Failed to flush flashcard events:", error);
			eventBufferRef.current = [...toFlush, ...eventBufferRef.current];
		} finally {
			flushingRef.current = false;
		}
	}, [data.id]);

	const pushEvent = useCallback(
		(event: Omit<FlashcardEvent, "at">) => {
			eventBufferRef.current.push({
				at: new Date().toISOString(),
				...event,
			});
			if (eventBufferRef.current.length >= 5) {
				void flushEvents();
			}
		},
		[flushEvents]
	);

	const completeSession = useCallback(async (isUnmount = false) => {
		const currentSessionId = sessionIdRef.current;
		if (!currentSessionId) return;
		pushEvent({ type: "close", cardId: currentCardIdRef.current });

		// Flush remaining events
		const pendingEvents = [...eventBufferRef.current];
		eventBufferRef.current = [];
		if (pendingEvents.length > 0) {
			try {
				await fetch(`/api/interactive/${data.id}/sessions/${currentSessionId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ events: pendingEvents }),
					keepalive: isUnmount,
				});
			} catch {
				// Best effort on unmount
			}
		}

		const durationMs = Math.max(0, Date.now() - sessionStart);
		const completeBody = JSON.stringify({
			summary: {
				cardsViewed: viewedCardIdsRef.current.size,
				flipCount: flipCountRef.current,
				durationMs,
			},
		});

		if (isUnmount && navigator.sendBeacon) {
			navigator.sendBeacon(
				`/api/interactive/${data.id}/sessions/${currentSessionId}/complete`,
				new Blob([completeBody], { type: "application/json" })
			);
		} else {
			await fetch(`/api/interactive/${data.id}/sessions/${currentSessionId}/complete`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: completeBody,
				keepalive: isUnmount,
			}).catch((error) => {
				console.error("Failed to complete flashcard session:", error);
			});
		}
		sessionIdRef.current = null;
	}, [data.id, pushEvent, sessionStart]);

	useEffect(() => {
		let cancelled = false;
		const createSession = async () => {
			try {
				const response = await fetch(`/api/interactive/${data.id}/sessions`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ meta: { shuffleEnabled } }),
				});
				const payload = await response.json();
				if (!response.ok || !payload?.data?.sessionId) {
					throw new Error(payload?.error || "Failed to create flashcard session.");
				}
				if (cancelled) return;
				sessionIdRef.current = payload.data.sessionId as string;
				pushEvent({ type: "open", cardId: cards[0]?.id });
				if (cards[0]?.id) {
					viewedCardIdsRef.current.add(cards[0].id);
				}
			} catch (error) {
				console.error("Failed to start flashcard session:", error);
				if (!cancelled) {
					setSessionError("Failed to start session. Your progress may not be saved.");
				}
			}
		};
		void createSession();
		return () => {
			cancelled = true;
			void completeSession(true);
		};
	}, [completeSession, data.id, pushEvent]);
	useEffect(() => {
		currentCardIdRef.current = currentCard?.id;
	}, [currentCard?.id]);

	useEffect(() => {
		const interval = setInterval(() => {
			void flushEvents();
		}, 4000);
		return () => clearInterval(interval);
	}, [flushEvents]);

	const goTo = (nextIndex: number) => {
		const bounded = Math.max(0, Math.min(cards.length - 1, nextIndex));
		if (bounded === currentIndex) return;
		setCurrentIndex(bounded);
		setFlipped(false);
		const nextCard = cards[bounded];
		if (nextCard?.id) {
			viewedCardIdsRef.current.add(nextCard.id);
		}
		pushEvent({
			type: bounded > currentIndex ? "next" : "prev",
			cardId: nextCard?.id,
		});
	};

	const toggleFlip = () => {
		setFlipped((previous) => !previous);
		flipCountRef.current += 1;
		pushEvent({
			type: "flip",
			cardId: currentCard?.id,
			payload: { flippedTo: !flipped ? "back" : "front" },
		});
	};

	const toggleShuffle = () => {
		if (!deck.settings.shuffleAllowed) return;
		const nextEnabled = !shuffleEnabled;
		setShuffleEnabled(nextEnabled);
		const nextCards = nextEnabled ? shuffleArray(deck.cards) : deck.cards;
		setCards(nextCards);
		setCurrentIndex(0);
		setFlipped(false);
		pushEvent({
			type: "shuffle",
			cardId: nextCards[0]?.id,
			payload: { enabled: nextEnabled },
		});
	};

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-xl font-bold text-primary leading-tight">{data.title}</h3>
				<button
					type="button"
					onClick={() => {
						void completeSession(false).finally(onClose);
					}}
					className="shrink-0 rounded-lg bg-muted p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
				>
					<X size={16} />
				</button>
			</div>

			{sessionError && (
				<p className="text-xs text-amber-600 dark:text-amber-400">{sessionError}</p>
			)}

			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-sm font-medium text-muted-foreground">
					Card {currentIndex + 1} of {cards.length}
				</span>
				<label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
					<input
						type="checkbox"
						checked={shuffleEnabled}
						disabled={!deck.settings.shuffleAllowed}
						className="accent-emerald-500"
						onChange={toggleShuffle}
					/>
					Shuffle
				</label>
			</div>

			<div className="perspective-[1200px] h-[360px]">
				<AnimatePresence mode="wait">
					<motion.button
						key={`${currentCard.id}-${flipped ? "back" : "front"}`}
						type="button"
						onClick={toggleFlip}
						className="relative h-full w-full rounded-2xl bg-card ring-1 ring-border p-6 text-left shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
						initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
						animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
						exit={shouldReduceMotion ? {} : { opacity: 0, y: -16 }}
						transition={{ duration: 0.22 }}
					>
						{/* Gradient accent bar */}
						<div className={`absolute inset-x-0 top-0 h-1 ${flipped
							? "bg-gradient-to-r from-emerald-500 to-teal-500"
							: "bg-gradient-to-r from-blue-500 to-indigo-500"
							}`} />
						{flipped ? (
							<div className="space-y-3 pt-2">
								<p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
									<span className="h-2 w-2 rounded-full bg-emerald-500" /> Back
								</p>
								<div className="prose prose-slate dark:prose-invert max-w-none">
									<MarkdownMath value={currentCard.backMarkdown} />
								</div>
								{currentCard.backImage && (
									<img
										src={currentCard.backImage.url}
										alt={currentCard.backImage.alt}
										className="max-h-52 w-full rounded-lg border border-border object-contain bg-muted"
									/>
								)}
							</div>
						) : (
							<div className="space-y-3 pt-2">
								<p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
									<span className="h-2 w-2 rounded-full bg-blue-500" /> Front
								</p>
								<div className="prose prose-slate dark:prose-invert max-w-none">
									<MarkdownMath value={currentCard.frontMarkdown} />
								</div>
								{currentCard.frontImage && (
									<img
										src={currentCard.frontImage.url}
										alt={currentCard.frontImage.alt}
										className="max-h-52 w-full rounded-lg border border-border object-contain bg-muted"
									/>
								)}
							</div>
						)}
					</motion.button>
				</AnimatePresence>
			</div>

			<div className="flex justify-between gap-2">
				<button
					type="button"
					onClick={() => goTo(currentIndex - 1)}
					disabled={currentIndex === 0}
					className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
				>
					← Previous
				</button>
				<button
					type="button"
					onClick={() => goTo(currentIndex + 1)}
					disabled={currentIndex >= cards.length - 1}
					className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
				>
					Next →
				</button>
			</div>
		</div>
	);
}

export default function InteractiveMaterialModal({
	isOpen,
	loading,
	error,
	data,
	onClose,
}: Props) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
					initial={shouldReduceMotion ? false : { opacity: 0 }}
					animate={shouldReduceMotion ? {} : { opacity: 1 }}
					exit={shouldReduceMotion ? {} : { opacity: 0 }}
				>
					<motion.div
						className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-background ring-1 ring-border shadow-2xl shadow-black/25 p-6"
						initial={shouldReduceMotion ? false : { scale: 0.96, opacity: 0 }}
						animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
						exit={shouldReduceMotion ? {} : { scale: 0.96, opacity: 0 }}
						transition={{ duration: 0.18 }}
					>
						{loading ? (
							<div className="flex min-h-[280px] items-center justify-center gap-2 text-muted-foreground">
								<Loader2 size={18} className="animate-spin" />
								<span>Loading interactive material…</span>
							</div>
						) : error ? (
							<div className="space-y-4 text-center py-6">
								<p className="text-destructive font-medium">{error}</p>
								<button
									type="button"
									onClick={onClose}
									className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
								>
									Close
								</button>
							</div>
						) : !data ? (
							<div className="space-y-4 text-center py-6">
								<p className="text-muted-foreground">Material not found.</p>
								<button
									type="button"
									onClick={onClose}
									className="rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
								>
									Close
								</button>
							</div>
						) : data.contentType === "Quiz" ? (
							<InteractiveQuizPlayer data={data} onClose={onClose} />
						) : (
							<InteractiveFlashcardPlayer data={data} onClose={onClose} />
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
