"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import LinkFileForm from "./LinkFileForm";
import QuizForm from "./QuizForm";
import FlashcardForm from "./FlashcardForm";

const getInitialData = (type: string) => {
	switch (type) {
		case "Quiz":
			return { type, title: "", content: { questions: [] } };
		case "Flashcard":
			return { type, title: "", content: { cards: [] } };
		case "File":
			return { type, title: "", url: "" };
		case "Link":
		default:
			return { type: "Link", title: "", url: "" };
	}
};

export default function ItemEditorModal({
	itemToEdit,
	onSave,
	onCancel,
}: {
	itemToEdit?: any;
	onSave: (data: any) => void;
	onCancel: () => void;
}) {
	const [itemData, setItemData] = useState(getInitialData(itemToEdit?.type || "Link"));

	useEffect(() => {
		if (itemToEdit) {
			setItemData(itemToEdit);
		} else {
			setItemData(getInitialData("Link"));
		}
	}, [itemToEdit]);

	const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newType = event.target.value;
		const currentTitle = itemData.title;
		const newData = getInitialData(newType);
		newData.title = currentTitle;
		setItemData(newData);
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		onSave(itemData);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<form
				onSubmit={handleSubmit}
				className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl"
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
									setItemData({ ...itemData, title: event.target.value })
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
								onChange={handleTypeChange}
								className="block w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
								disabled={!!itemToEdit}
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
							content={itemData.content}
							setContent={(newContent: any) =>
								setItemData({ ...itemData, content: newContent })
							}
						/>
					)}
					{itemData.type === "Flashcard" && (
						<FlashcardForm
							content={itemData.content}
							setContent={(newContent: any) =>
								setItemData({ ...itemData, content: newContent })
							}
						/>
					)}
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
						className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
					>
						<Save size={16} /> Save
					</button>
				</div>
			</form>
		</div>
	);
}
