"use client";

import { PlusCircle, Trash2 } from "lucide-react";
import { FlashcardContent } from "@/types";
import { createClientCustomId } from "@/lib/client/ids";
import InteractiveImageUploader from "./InteractiveImageUploader";

type Props = {
	courseId: string;
	topicId: string;
	itemId: string;
	content: FlashcardContent;
	setContent: (next: FlashcardContent) => void;
};

function defaultFlashcardContent(): FlashcardContent {
	return {
		settings: {
			shuffleAllowed: true,
		},
		cards: [],
	};
}

function withDefaults(content?: FlashcardContent): FlashcardContent {
	const fallback = defaultFlashcardContent();
	return {
		settings: {
			shuffleAllowed:
				content?.settings?.shuffleAllowed ?? fallback.settings.shuffleAllowed,
		},
		cards: Array.isArray(content?.cards) ? content.cards : [],
	};
}

export default function FlashcardForm({
	courseId,
	topicId,
	itemId,
	content,
	setContent,
}: Props) {
	const safeContent = withDefaults(content);

	const updateCard = (
		cardId: string,
		updater: (
			card: FlashcardContent["cards"][number]
		) => FlashcardContent["cards"][number]
	) => {
		setContent({
			...safeContent,
			cards: safeContent.cards.map((card) => (card.id === cardId ? updater(card) : card)),
		});
	};

	const addCard = () => {
		if (safeContent.cards.length >= 300) return;
		setContent({
			...safeContent,
			cards: [
				...safeContent.cards,
				{
					id: createClientCustomId(),
					frontMarkdown: "",
					backMarkdown: "",
				},
			],
		});
	};

	const removeCard = (cardId: string) => {
		setContent({
			...safeContent,
			cards: safeContent.cards.filter((card) => card.id !== cardId),
		});
	};

	return (
		<div className="max-h-[55vh] space-y-4 overflow-y-auto p-1">
			<label className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary-background p-3 text-sm font-medium text-foreground">
				<input
					type="checkbox"
					checked={safeContent.settings.shuffleAllowed}
					onChange={(event) =>
						setContent({
							...safeContent,
							settings: {
								...safeContent.settings,
								shuffleAllowed: event.target.checked,
							},
						})
					}
				/>
				Allow shuffle
			</label>

			{safeContent.cards.map((card, cardIndex) => (
				<div
					key={card.id}
					className="relative space-y-3 rounded-lg border border-border bg-secondary-background p-3"
				>
					<div className="flex items-center justify-between gap-2">
						<h4 className="font-semibold text-foreground">Card {cardIndex + 1}</h4>
						<button
							type="button"
							onClick={() => removeCard(card.id)}
							className="rounded-md p-1 text-red-500 hover:bg-red-500/10"
						>
							<Trash2 size={16} />
						</button>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<label className="block text-sm font-medium text-foreground">
							Front (Markdown + LaTeX)
							<textarea
								value={card.frontMarkdown}
								onChange={(event) =>
									updateCard(card.id, (previous) => ({
										...previous,
										frontMarkdown: event.target.value,
									}))
								}
								className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
								rows={3}
							/>
						</label>
						<label className="block text-sm font-medium text-foreground">
							Back (Markdown + LaTeX)
							<textarea
								value={card.backMarkdown}
								onChange={(event) =>
									updateCard(card.id, (previous) => ({
										...previous,
										backMarkdown: event.target.value,
									}))
								}
								className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
								rows={3}
							/>
						</label>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<InteractiveImageUploader
							label="Front Image"
							courseId={courseId}
							topicId={topicId}
							itemId={itemId}
							value={card.frontImage}
							onChange={(nextImage) =>
								updateCard(card.id, (previous) => ({
									...previous,
									frontImage: nextImage,
								}))
							}
						/>
						<InteractiveImageUploader
							label="Back Image"
							courseId={courseId}
							topicId={topicId}
							itemId={itemId}
							value={card.backImage}
							onChange={(nextImage) =>
								updateCard(card.id, (previous) => ({
									...previous,
									backImage: nextImage,
								}))
							}
						/>
					</div>
				</div>
			))}

			<button
				type="button"
				disabled={safeContent.cards.length >= 300}
				onClick={addCard}
				className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
			>
				<PlusCircle size={16} /> Add Card
			</button>
		</div>
	);
}
