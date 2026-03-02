"use client";

import { PlusCircle, Trash2 } from "lucide-react";

export default function FlashcardForm({
	content,
	setContent,
}: {
	content: any;
	setContent: (content: any) => void;
}) {
	const cards = content?.cards || [];

	const handleCardChange = (
		cardIndex: number,
		side: "front" | "back",
		value: string
	) => {
		const newCards = [...cards];
		newCards[cardIndex][side] = value;
		setContent({ ...content, cards: newCards });
	};

	const addCard = () => {
		const newCards = [...cards, { front: "", back: "" }];
		setContent({ ...content, cards: newCards });
	};

	const removeCard = (cardIndex: number) => {
		const newCards = cards.filter((_: any, index: number) => index !== cardIndex);
		setContent({ ...content, cards: newCards });
	};

	return (
		<div className="max-h-[50vh] space-y-4 overflow-y-auto p-1">
			{cards.map((card: any, cardIndex: number) => (
				<div
					key={cardIndex}
					className="relative grid grid-cols-1 gap-4 rounded-lg border border-border bg-secondary-background p-3 md:grid-cols-2"
				>
					<div>
						<label className="mb-1 block font-semibold text-foreground">
							Card {cardIndex + 1}: Front
						</label>
						<textarea
							value={card.front}
							onChange={(event) =>
								handleCardChange(cardIndex, "front", event.target.value)
							}
							placeholder="Term or question..."
							className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
							rows={3}
						/>
					</div>
					<div>
						<label className="mb-1 block font-semibold text-foreground">
							Card {cardIndex + 1}: Back
						</label>
						<textarea
							value={card.back}
							onChange={(event) =>
								handleCardChange(cardIndex, "back", event.target.value)
							}
							placeholder="Definition or answer..."
							className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
							rows={3}
						/>
					</div>
					<button
						type="button"
						onClick={() => removeCard(cardIndex)}
						className="absolute right-2 top-2 rounded-md p-1 text-red-500 hover:bg-red-500/10"
					>
						<Trash2 size={16} />
					</button>
				</div>
			))}
			<button
				type="button"
				onClick={addCard}
				className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
			>
				<PlusCircle size={16} /> Add Card
			</button>
		</div>
	);
}
