"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Save, X } from "lucide-react";
import {
	FlashcardContent,
	QuizContent,
	TopicItemData,
} from "@/types";
import LinkFileForm from "./LinkFileForm";
import QuizForm from "./QuizForm";
import FlashcardForm from "./FlashcardForm";
import { createClientCustomId } from "@/lib/client/ids";

type EditableItemType = "Link" | "File" | "Quiz" | "Flashcard";

type EditableItem = {
	id: string;
	title: string;
	type: EditableItemType;
	url?: string;
	content?: QuizContent | FlashcardContent;
	interactiveRefId?: string;
};

type Props = {
	courseId: string;
	topicId: string;
	itemToEdit?: TopicItemData;
	defaultItemId?: string;
	onSave: (item: TopicItemData) => Promise<void>;
	onCancel: () => void;
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

function defaultFlashcardContent(): FlashcardContent {
	return {
		settings: {
			shuffleAllowed: true,
		},
		cards: [],
	};
}

function fromItemToEdit(item: TopicItemData | undefined, fallbackItemId: string): EditableItem {
	if (!item) {
		return {
			id: fallbackItemId,
			title: "",
			type: "Link",
			url: "",
		};
	}

	if (item.type === "Quiz") {
		return {
			id: item.id,
			title: item.title,
			type: "Quiz",
			interactiveRefId: item.interactiveRefId ?? item.id,
			content: (item.content as QuizContent | undefined) ?? defaultQuizContent(),
		};
	}
	if (item.type === "Flashcard") {
		return {
			id: item.id,
			title: item.title,
			type: "Flashcard",
			interactiveRefId: item.interactiveRefId ?? item.id,
			content: (item.content as FlashcardContent | undefined) ?? defaultFlashcardContent(),
		};
	}

	return {
		id: item.id,
		title: item.title,
		type: item.type as EditableItemType,
		url: item.url ?? "",
	};
}

function validateEditableItem(item: EditableItem): string | null {
	if (!item.title.trim()) return "Title is required.";
	if ((item.type === "Link" || item.type === "File") && !item.url?.trim()) {
		return "URL is required for link/file items.";
	}
	if (item.type === "Quiz") {
		const quiz = item.content as QuizContent | undefined;
		if (!quiz || quiz.questions.length === 0) return "Quiz must have at least 1 question.";
		if (quiz.questions.length > 100) return "Quiz cannot exceed 100 questions.";
		for (const question of quiz.questions) {
			if (!question.promptMarkdown.trim()) return "Each quiz question needs a prompt.";
			if (question.maxPoints < 0) return "Question max points cannot be negative.";
			if (question.kind === "mcq") {
				if (question.options.length < 2) return "MCQ requires at least 2 options.";
				if (question.options.length > 8) return "MCQ cannot exceed 8 options.";
				if (question.options.some((option) => !option.textMarkdown.trim())) {
					return "Each MCQ option must have text.";
				}
			}
			if (question.kind === "short_answer") {
				if (question.acceptedAnswers.length === 0) {
					return "Short answer requires at least 1 accepted answer.";
				}
				if (question.acceptedAnswers.some((answer) => !answer.trim())) {
					return "Accepted answers cannot be empty.";
				}
			}
		}
	}
	if (item.type === "Flashcard") {
		const flashcard = item.content as FlashcardContent | undefined;
		if (!flashcard || flashcard.cards.length === 0) {
			return "Flashcard deck must have at least 1 card.";
		}
		if (flashcard.cards.length > 300) return "Flashcard deck cannot exceed 300 cards.";
		for (const card of flashcard.cards) {
			if (!card.frontMarkdown.trim()) return "Each card front is required.";
			if (!card.backMarkdown.trim()) return "Each card back is required.";
		}
	}
	return null;
}

export default function ItemEditorModal({
	courseId,
	topicId,
	itemToEdit,
	defaultItemId,
	onSave,
	onCancel,
}: Props) {
	const initialId = useMemo(
		() => itemToEdit?.id ?? defaultItemId ?? createClientCustomId(),
		[itemToEdit?.id, defaultItemId]
	);
	const [itemData, setItemData] = useState<EditableItem>(() =>
		fromItemToEdit(itemToEdit, initialId)
	);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setItemData(fromItemToEdit(itemToEdit, initialId));
		setError(null);
	}, [itemToEdit, initialId]);

	const handleTypeChange = (nextType: EditableItemType) => {
		setItemData((previous) => {
			const title = previous.title;
			if (nextType === "Quiz") {
				return {
					id: previous.id,
					title,
					type: "Quiz",
					interactiveRefId: previous.id,
					content: defaultQuizContent(),
				};
			}
			if (nextType === "Flashcard") {
				return {
					id: previous.id,
					title,
					type: "Flashcard",
					interactiveRefId: previous.id,
					content: defaultFlashcardContent(),
				};
			}
			return {
				id: previous.id,
				title,
				type: nextType,
				url: "",
			};
		});
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const validationError = validateEditableItem(itemData);
		if (validationError) {
			setError(validationError);
			return;
		}

		setSaving(true);
		setError(null);
		try {
			await onSave({
				id: itemData.id,
				title: itemData.title.trim(),
				type: itemData.type,
				url: itemData.url?.trim() || undefined,
				content: itemData.content,
				interactiveRefId:
					itemData.type === "Quiz" || itemData.type === "Flashcard"
						? itemData.interactiveRefId ?? itemData.id
						: undefined,
				isCustom: true,
			});
		} catch (saveError) {
			console.error("Item save failed:", saveError);
			setError("Could not save item. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-xl"
			>
				<h3 className="mb-4 text-xl font-bold text-foreground">
					{itemToEdit ? "Edit Item" : "Add New Item"}
				</h3>

				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label className="mb-1 block text-sm font-medium text-muted-foreground">
								Title
							</label>
							<input
								value={itemData.title}
								onChange={(event) =>
									setItemData((previous) => ({
										...previous,
										title: event.target.value,
									}))
								}
								placeholder="Item Title"
								required
								className="block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-muted-foreground">
								Type
							</label>
							<select
								value={itemData.type}
								onChange={(event) => handleTypeChange(event.target.value as EditableItemType)}
								className="block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
								disabled={Boolean(itemToEdit)}
							>
								<option value="Link">Link</option>
								<option value="File">File</option>
								<option value="Quiz">Quiz</option>
								<option value="Flashcard">Flashcard Deck</option>
							</select>
						</div>
					</div>

					<hr className="border-border" />

					{(itemData.type === "Link" || itemData.type === "File") && (
						<LinkFileForm data={itemData} setData={setItemData} />
					)}

					{itemData.type === "Quiz" && (
						<QuizForm
							courseId={courseId}
							topicId={topicId}
							itemId={itemData.id}
							content={(itemData.content as QuizContent) ?? defaultQuizContent()}
							setContent={(nextContent) =>
								setItemData((previous) => ({
									...previous,
									content: nextContent,
								}))
							}
						/>
					)}

					{itemData.type === "Flashcard" && (
						<FlashcardForm
							courseId={courseId}
							topicId={topicId}
							itemId={itemData.id}
							content={(itemData.content as FlashcardContent) ?? defaultFlashcardContent()}
							setContent={(nextContent) =>
								setItemData((previous) => ({
									...previous,
									content: nextContent,
								}))
							}
						/>
					)}

					{error && <p className="text-sm font-medium text-red-600">{error}</p>}
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
					>
						<X size={16} /> Cancel
					</button>
					<button
						type="submit"
						disabled={saving}
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
					>
						<Save size={16} /> {saving ? "Saving..." : "Save"}
					</button>
				</div>
			</form>
		</div>
	);
}
