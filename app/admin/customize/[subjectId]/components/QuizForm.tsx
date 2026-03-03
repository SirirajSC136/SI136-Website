"use client";

import { PlusCircle, Trash2 } from "lucide-react";
import {
	QuizContent,
	QuizMcqQuestion,
	QuizQuestion,
	QuizShortAnswerQuestion,
} from "@/types";
import { createClientCustomId } from "@/lib/client/ids";
import InteractiveImageUploader from "./InteractiveImageUploader";

type Props = {
	courseId: string;
	topicId: string;
	itemId: string;
	content: QuizContent;
	setContent: (next: QuizContent) => void;
};

function defaultQuizContent(): QuizContent {
	return {
		settings: {
			feedbackMode: "after_submit",
			shuffleQuestions: false,
		},
		questions: [],
	};
}

function withDefaults(content?: QuizContent): QuizContent {
	const fallback = defaultQuizContent();
	return {
		settings: {
			feedbackMode: content?.settings?.feedbackMode ?? fallback.settings.feedbackMode,
			shuffleQuestions:
				content?.settings?.shuffleQuestions ?? fallback.settings.shuffleQuestions,
		},
		questions: Array.isArray(content?.questions) ? content.questions : [],
	};
}

function defaultMcqQuestion(): QuizMcqQuestion {
	return {
		id: createClientCustomId(),
		kind: "mcq",
		promptMarkdown: "",
		maxPoints: 1,
		explanationMarkdown: "",
		options: [
			{ id: createClientCustomId(), textMarkdown: "", weight: 1 },
			{ id: createClientCustomId(), textMarkdown: "", weight: 0 },
		],
	};
}

function defaultShortAnswerQuestion(): QuizShortAnswerQuestion {
	return {
		id: createClientCustomId(),
		kind: "short_answer",
		promptMarkdown: "",
		maxPoints: 1,
		explanationMarkdown: "",
		matchMode: "ignore_case_and_whitespace",
		acceptedAnswers: [""],
	};
}

export default function QuizForm({
	courseId,
	topicId,
	itemId,
	content,
	setContent,
}: Props) {
	const safeContent = withDefaults(content);

	const updateQuestion = (
		questionId: string,
		updater: (question: QuizQuestion) => QuizQuestion
	) => {
		setContent({
			...safeContent,
			questions: safeContent.questions.map((question) =>
				question.id === questionId ? updater(question) : question
			),
		});
	};

	const removeQuestion = (questionId: string) => {
		setContent({
			...safeContent,
			questions: safeContent.questions.filter((question) => question.id !== questionId),
		});
	};

	const addQuestion = (kind: "mcq" | "short_answer") => {
		if (safeContent.questions.length >= 100) return;
		const nextQuestion = kind === "mcq" ? defaultMcqQuestion() : defaultShortAnswerQuestion();
		setContent({
			...safeContent,
			questions: [...safeContent.questions, nextQuestion],
		});
	};

	return (
		<div className="max-h-[55vh] space-y-4 overflow-y-auto p-1">
			<div className="grid gap-3 rounded-lg border border-border bg-secondary-background p-3 md:grid-cols-2">
				<label className="text-sm font-medium text-foreground">
					Feedback Mode
					<select
						value={safeContent.settings.feedbackMode}
						onChange={(event) =>
							setContent({
								...safeContent,
								settings: {
									...safeContent.settings,
									feedbackMode: event.target.value as QuizContent["settings"]["feedbackMode"],
								},
							})
						}
						className="mt-1 block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
					>
						<option value="after_submit">After Submit</option>
						<option value="instant">Instant</option>
					</select>
				</label>

				<label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
					<input
						type="checkbox"
						checked={safeContent.settings.shuffleQuestions}
						onChange={(event) =>
							setContent({
								...safeContent,
								settings: {
									...safeContent.settings,
									shuffleQuestions: event.target.checked,
								},
							})
						}
					/>
					Shuffle questions
				</label>
			</div>

			{safeContent.questions.map((question, questionIndex) => (
				<div
					key={question.id}
					className="relative space-y-3 rounded-lg border border-border bg-secondary-background p-3"
				>
					<div className="flex items-center justify-between gap-2">
						<h4 className="font-semibold text-foreground">
							Question {questionIndex + 1} ({question.kind === "mcq" ? "MCQ" : "Short Answer"})
						</h4>
						<button
							type="button"
							onClick={() => removeQuestion(question.id)}
							className="rounded-md p-1 text-red-500 hover:bg-red-500/10"
						>
							<Trash2 size={16} />
						</button>
					</div>

					<label className="block text-sm font-medium text-foreground">
						Prompt (Markdown + LaTeX)
						<textarea
							value={question.promptMarkdown}
							onChange={(event) =>
								updateQuestion(question.id, (previous) => ({
									...previous,
									promptMarkdown: event.target.value,
								}))
							}
							className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
							rows={3}
						/>
					</label>

					<div className="grid gap-3 md:grid-cols-2">
						<label className="text-sm font-medium text-foreground">
							Max Points
							<input
								type="number"
								min={0}
								step="0.5"
								value={question.maxPoints}
								onChange={(event) =>
									updateQuestion(question.id, (previous) => ({
										...previous,
										maxPoints: Number(event.target.value || 0),
									}))
								}
								className="mt-1 block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
							/>
						</label>
						<label className="text-sm font-medium text-foreground">
							Explanation (optional)
							<input
								value={question.explanationMarkdown ?? ""}
								onChange={(event) =>
									updateQuestion(question.id, (previous) => ({
										...previous,
										explanationMarkdown: event.target.value,
									}))
								}
								className="mt-1 block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
							/>
						</label>
					</div>

					<InteractiveImageUploader
						label="Question Image"
						courseId={courseId}
						topicId={topicId}
						itemId={itemId}
						value={question.image}
						onChange={(nextImage) =>
							updateQuestion(question.id, (previous) => ({
								...previous,
								image: nextImage,
							}))
						}
					/>

					{question.kind === "mcq" ? (
						<div className="space-y-2">
							<p className="text-sm font-medium text-foreground">Options + Weights</p>
							{question.options.map((option) => (
								<div key={option.id} className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
									<input
										value={option.textMarkdown}
										onChange={(event) =>
											updateQuestion(question.id, (previous) => {
												if (previous.kind !== "mcq") return previous;
												return {
													...previous,
													options: previous.options.map((candidate) =>
														candidate.id === option.id
															? { ...candidate, textMarkdown: event.target.value }
															: candidate
													),
												};
											})
										}
										placeholder="Option text"
										className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
									/>
									<input
										type="number"
										step="0.5"
										value={option.weight}
										onChange={(event) =>
											updateQuestion(question.id, (previous) => {
												if (previous.kind !== "mcq") return previous;
												return {
													...previous,
													options: previous.options.map((candidate) =>
														candidate.id === option.id
															? {
																	...candidate,
																	weight: Number(event.target.value || 0),
															  }
															: candidate
													),
												};
											})
										}
										className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
									/>
									<button
										type="button"
										disabled={question.options.length <= 2}
										onClick={() =>
											updateQuestion(question.id, (previous) => {
												if (previous.kind !== "mcq") return previous;
												return {
													...previous,
													options: previous.options.filter(
														(candidate) => candidate.id !== option.id
													),
												};
											})
										}
										className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
									>
										Remove
									</button>
								</div>
							))}
							<button
								type="button"
								disabled={question.options.length >= 8}
								onClick={() =>
									updateQuestion(question.id, (previous) => {
										if (previous.kind !== "mcq") return previous;
										return {
											...previous,
											options: [
												...previous.options,
												{ id: createClientCustomId(), textMarkdown: "", weight: 0 },
											],
										};
									})
								}
								className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
							>
								<PlusCircle size={16} /> Add Option
							</button>
						</div>
					) : (
						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">
								Match Mode
								<select
									value={question.matchMode}
									onChange={(event) =>
										updateQuestion(question.id, (previous) => {
											if (previous.kind !== "short_answer") return previous;
											return {
												...previous,
												matchMode: event.target.value as QuizShortAnswerQuestion["matchMode"],
											};
										})
									}
									className="mt-1 block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
								>
									<option value="exact">Exact</option>
									<option value="ignore_case">Ignore case</option>
									<option value="ignore_case_and_whitespace">
										Ignore case + normalize spaces
									</option>
								</select>
							</label>

							<p className="text-sm font-medium text-foreground">Accepted Answers</p>
							{question.acceptedAnswers.map((answer, answerIndex) => (
								<div
									key={`${question.id}-${answerIndex}`}
									className="grid gap-2 md:grid-cols-[1fr_auto]"
								>
									<input
										value={answer}
										onChange={(event) =>
											updateQuestion(question.id, (previous) => {
												if (previous.kind !== "short_answer") return previous;
												return {
													...previous,
													acceptedAnswers: previous.acceptedAnswers.map((candidate, index2) =>
														index2 === answerIndex ? event.target.value : candidate
													),
												};
											})
										}
										className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
									/>
									<button
										type="button"
										disabled={question.acceptedAnswers.length <= 1}
										onClick={() =>
											updateQuestion(question.id, (previous) => {
												if (previous.kind !== "short_answer") return previous;
												return {
													...previous,
													acceptedAnswers: previous.acceptedAnswers.filter(
														(_, index2) => index2 !== answerIndex
													),
												};
											})
										}
										className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
									>
										Remove
									</button>
								</div>
							))}
							<button
								type="button"
								onClick={() =>
									updateQuestion(question.id, (previous) => {
										if (previous.kind !== "short_answer") return previous;
										return {
											...previous,
											acceptedAnswers: [...previous.acceptedAnswers, ""],
										};
									})
								}
								className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
							>
								<PlusCircle size={16} /> Add Accepted Answer
							</button>
						</div>
					)}
				</div>
			))}

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={safeContent.questions.length >= 100}
					onClick={() => addQuestion("mcq")}
					className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
				>
					<PlusCircle size={16} /> Add MCQ
				</button>
				<button
					type="button"
					disabled={safeContent.questions.length >= 100}
					onClick={() => addQuestion("short_answer")}
					className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
				>
					<PlusCircle size={16} /> Add Short Answer
				</button>
			</div>
		</div>
	);
}
