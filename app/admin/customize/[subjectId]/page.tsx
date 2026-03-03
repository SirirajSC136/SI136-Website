"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlashcardContent, QuizContent, Subject, TopicItemData } from "@/types";
import { useParams } from "next/navigation";
import {
	PlusCircle,
	Trash2,
	Edit,
	File as FileIcon,
	Link as LinkIcon,
	BrainCircuit,
	Layers3,
} from "lucide-react";
import ItemEditorModal from "./components/ItemEditorModal";
import AdminCard from "@/components/admin/AdminCard";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminShell from "@/components/admin/AdminShell";
import ConfirmActionDialog from "@/components/admin/ConfirmActionDialog";
import NoticeBanner from "@/components/admin/NoticeBanner";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { createClientCustomId } from "@/lib/client/ids";

const isCustomId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

const NewTopicForm = ({
	onSave,
	onCancel,
}: {
	onSave: (title: string) => void;
	onCancel: () => void;
}) => {
	const [title, setTitle] = useState("");
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSave(title);
			}}
			className="grid gap-3 md:grid-cols-[1fr_auto_auto]"
		>
			<input
				value={title}
				onChange={(event) => setTitle(event.target.value)}
				placeholder="Topic Title"
				required
				className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
			/>
			<button
				type="submit"
				className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
			>
				Save Topic
			</button>
			<button
				type="button"
				onClick={onCancel}
				className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
			>
				Cancel
			</button>
		</form>
	);
};

function getItemIcon(item: TopicItemData) {
	switch (item.type) {
		case "Quiz":
			return <BrainCircuit size={16} className="text-blue-500" />;
		case "Flashcard":
			return <Layers3 size={16} className="text-emerald-500" />;
		case "File":
			return <FileIcon size={16} className="text-muted-foreground" />;
		default:
			return <LinkIcon size={16} className="text-muted-foreground" />;
	}
}

export default function CustomizeSubjectPage() {
	const params = useParams();
	const subjectId = params.subjectId as string;

	const [subject, setSubject] = useState<Subject | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<
		{ type: "success" | "error" | "info"; message: string } | null
	>(null);
	const [showNewTopicForm, setShowNewTopicForm] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<TopicItemData | undefined>(undefined);
	const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
	const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
	const [draftItemId, setDraftItemId] = useState<string | null>(null);
	const [isModalBusy, setIsModalBusy] = useState(false);
	const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
	const [deleteTopicTarget, setDeleteTopicTarget] = useState<{
		id: string;
		title: string;
	} | null>(null);

	const fetchSubjectData = useCallback(async () => {
		if (!subjectId) return;
		setLoading(true);
		setError(null);
		try {
			const response = await fetch(`/api/subjects/${subjectId}`, { cache: "no-store" });
			if (!response.ok) throw new Error(`API Error: ${response.status}`);
			setSubject((await response.json()) as Subject);
		} catch (fetchError) {
			console.error("Error fetching subject data:", fetchError);
			setError("Could not load subject data.");
		} finally {
			setLoading(false);
		}
	}, [subjectId]);

	useEffect(() => {
		void fetchSubjectData();
	}, [fetchSubjectData]);

	const deleteItemTopicId = useMemo(() => {
		if (!deleteItemId || !subject) return undefined;
		return subject.topics.find((topic) =>
			topic.items.some((item) => item.id === deleteItemId)
		)?.id;
	}, [deleteItemId, subject]);

	const handleOpenModalToAdd = (topicId: string) => {
		setEditingItem(undefined);
		setActiveTopicId(topicId);
		setEditingTopicId(null);
		setDraftItemId(createClientCustomId());
		setIsModalOpen(true);
	};

	const handleOpenModalToEdit = async (item: TopicItemData) => {
		setIsModalBusy(true);
		try {
			const topicId = findTopicIdForItem(item.id) ?? null;
			if (item.type === "Quiz" || item.type === "Flashcard") {
				const response = await fetch(`/api/interactive/${item.id}`, { cache: "no-store" });
				const payload = await response.json().catch(() => ({}));
				if (!response.ok || !payload?.data) {
					throw new Error(payload?.error || "Failed to load interactive content.");
				}
				setEditingItem({
					...item,
					interactiveRefId: payload.data.id ?? item.id,
					content: payload.data.content as QuizContent | FlashcardContent,
				});
			} else {
				setEditingItem(item);
			}
			setActiveTopicId(null);
			setEditingTopicId(topicId);
			setDraftItemId(null);
			setIsModalOpen(true);
		} catch (openError) {
			console.error("Open editor failed:", openError);
			setNotice({
				type: "error",
				message: "Could not open item editor. Try again.",
			});
		} finally {
			setIsModalBusy(false);
		}
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingItem(undefined);
		setActiveTopicId(null);
		setEditingTopicId(null);
		setDraftItemId(null);
	};

	const findTopicIdForItem = (itemId: string): string | undefined => {
		return subject?.topics.find((topic) => topic.items.some((item) => item.id === itemId))?.id;
	};

	const handleSaveItem = async (itemData: TopicItemData) => {
		const isEditing = Boolean(editingItem);
		const url = isEditing ? `/api/admin/materials/${editingItem?.id}` : "/api/admin/materials";
		const method = isEditing ? "PUT" : "POST";
		const resolvedTopicId = editingTopicId ?? (editingItem ? findTopicIdForItem(editingItem.id) : undefined);
		const interactivePayload =
			itemData.type === "Quiz" || itemData.type === "Flashcard"
				? {
						contentType: itemData.type,
						content: itemData.content,
				  }
				: undefined;
		const normalizedItem: TopicItemData = {
			...itemData,
			interactiveRefId:
				itemData.type === "Quiz" || itemData.type === "Flashcard" ? itemData.id : undefined,
			content: undefined,
		};
		const body = isEditing
			? {
					item: normalizedItem,
					interactive: interactivePayload,
					courseId: subjectId,
					topicId: resolvedTopicId,
			  }
			: {
					courseId: subjectId,
					topicId: activeTopicId,
					itemId: itemData.id,
					item: normalizedItem,
					interactive: interactivePayload,
			  };

		try {
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const payload = await response.json();
			if (!response.ok || !payload?.data) {
				const details = payload?.details?.fieldErrors
					? JSON.stringify(payload.details.fieldErrors)
					: "";
				throw new Error(payload?.error || details || "Failed to save item.");
			}

			const savedItem = payload.data.item as TopicItemData;
			if (isEditing && editingItem) {
				setSubject((previous) => {
					if (!previous) return previous;
					return {
						...previous,
						topics: previous.topics.map((topic) => ({
							...topic,
							items: topic.items.map((item) =>
								item.id === editingItem.id ? { ...savedItem, id: editingItem.id } : item
							),
						})),
					};
				});
			} else if (activeTopicId) {
				setSubject((previous) => {
					if (!previous) return previous;
					return {
						...previous,
						topics: previous.topics.map((topic) =>
							topic.id === activeTopicId
								? { ...topic, items: [...topic.items, savedItem] }
								: topic
						),
					};
				});
			}

			setNotice({ type: "success", message: "Item saved successfully." });
			handleCloseModal();
		} catch (saveError) {
			console.error("Save item failed:", saveError);
			setNotice({ type: "error", message: `Could not save item: ${saveError}` });
			void fetchSubjectData();
		}
	};

	const confirmDeleteItem = async () => {
		if (!deleteItemId) return;
		const previousSubject = subject;
		const topicId = deleteItemTopicId;

		setSubject((previous) => {
			if (!previous) return previous;
			return {
				...previous,
				topics: previous.topics.map((topic) => ({
					...topic,
					items: topic.items.filter((item) => item.id !== deleteItemId),
				})),
			};
		});

		try {
			const response = await fetch(
				`/api/admin/materials/${deleteItemId}?courseId=${encodeURIComponent(
					subjectId
				)}&topicId=${encodeURIComponent(topicId ?? "")}`,
				{ method: "DELETE" }
			);
			if (!response.ok) {
				const payload = await response.json();
				throw new Error(payload?.error || "Failed to delete item.");
			}
			setNotice({ type: "success", message: "Item deleted." });
		} catch (deleteError) {
			setSubject(previousSubject);
			console.error("Delete item failed:", deleteError);
			setNotice({ type: "error", message: `Could not delete item: ${deleteError}` });
			void fetchSubjectData();
		} finally {
			setDeleteItemId(null);
		}
	};

	const handleAddTopic = async (title: string) => {
		try {
			const response = await fetch("/api/admin/topics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ courseId: subjectId, title }),
			});
			const payload = await response.json();
			if (!response.ok || !payload?.data) {
				throw new Error(payload?.error || "Failed to add topic.");
			}

			setSubject((previous) => {
				if (!previous) return previous;
				return {
					...previous,
					topics: [
						...previous.topics,
						{
							id: payload.data.id,
							title: payload.data.title,
							items: [],
							isCustom: true,
						},
					],
				};
			});
			setShowNewTopicForm(false);
			setNotice({ type: "success", message: "Topic added." });
		} catch (addError) {
			console.error("Add topic failed:", addError);
			setNotice({ type: "error", message: `Could not add topic: ${addError}` });
			void fetchSubjectData();
		}
	};

	const confirmDeleteTopic = async () => {
		if (!deleteTopicTarget) return;
		const topicId = deleteTopicTarget.id;
		const previousSubject = subject;
		setSubject((previous) => {
			if (!previous) return previous;
			return {
				...previous,
				topics: previous.topics.filter((topic) => topic.id !== topicId),
			};
		});

		try {
			const response = await fetch(
				`/api/admin/topics/${topicId}?courseId=${encodeURIComponent(subjectId)}`,
				{ method: "DELETE" }
			);
			if (!response.ok) {
				const payload = await response.json();
				throw new Error(payload?.error || "Failed to delete topic.");
			}
			setNotice({ type: "success", message: "Topic deleted." });
		} catch (deleteError) {
			setSubject(previousSubject);
			console.error("Delete topic failed:", deleteError);
			setNotice({ type: "error", message: `Could not delete topic: ${deleteError}` });
			void fetchSubjectData();
		} finally {
			setDeleteTopicTarget(null);
		}
	};

	if (loading) {
		return (
			<AdminShell>
				<AdminCard>Loading...</AdminCard>
			</AdminShell>
		);
	}

	if (error || !subject) {
		return (
			<AdminShell>
				<AdminEmptyState
					title="Could not load subject."
					description={error ?? "No data returned for this subject."}
				/>
			</AdminShell>
		);
	}

	return (
		<AdminShell>
			<AdminPageHeader
				title={`Customize: ${subject.title}`}
				subtitle="Add, edit, or remove materials and custom topics for this subject."
				actions={
					<button
						onClick={() => setShowNewTopicForm((value) => !value)}
						className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
					>
						<PlusCircle size={16} />
						{showNewTopicForm ? "Hide Topic Form" : "Add Custom Topic"}
					</button>
				}
			/>

			{notice ? <NoticeBanner type={notice.type} message={notice.message} /> : null}

			{showNewTopicForm ? (
				<AdminCard className="mb-4">
					<h2 className="mb-3 text-base font-semibold text-foreground">Add New Topic</h2>
					<NewTopicForm
						onSave={handleAddTopic}
						onCancel={() => setShowNewTopicForm(false)}
					/>
				</AdminCard>
			) : null}

			{isModalOpen ? (
				<ItemEditorModal
					courseId={subjectId}
					topicId={editingTopicId ?? activeTopicId ?? "unknown-topic"}
					itemToEdit={editingItem}
					defaultItemId={draftItemId ?? undefined}
					onSave={handleSaveItem}
					onCancel={handleCloseModal}
				/>
			) : null}

			<div className="space-y-4">
				{subject.topics.map((topic) => {
					const isCustomTopic = isCustomId(topic.id);
					return (
						<AdminCard key={topic.id} className="p-4">
							<div className="mb-3 flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-2">
									<h2 className="text-lg font-semibold text-foreground">{topic.title}</h2>
									<AdminStatusBadge
										variant={isCustomTopic ? "active" : "info"}
										label={isCustomTopic ? "Custom" : "Canvas"}
									/>
								</div>
								<div className="flex items-center gap-2">
									{isCustomTopic ? (
										<button
											onClick={() =>
												setDeleteTopicTarget({ id: topic.id, title: topic.title })
											}
											className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
											title="Delete Topic"
										>
											<Trash2 size={14} /> Delete Topic
										</button>
									) : null}
									<button
										onClick={() => handleOpenModalToAdd(topic.id)}
										className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
									>
										<PlusCircle size={14} /> Add Item
									</button>
								</div>
							</div>

							{topic.items.length > 0 ? (
								<ul className="space-y-2">
									{topic.items.map((item) => {
										const isCustomItem = isCustomId(item.id);
										return (
											<li
												key={item.id}
												className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
											>
												<div className="flex items-center gap-3">
													{getItemIcon(item)}
													<span className="text-sm text-foreground">{item.title}</span>
												</div>
												{isCustomItem ? (
													<div className="flex items-center gap-1">
														<button
															onClick={() => void handleOpenModalToEdit(item)}
															disabled={isModalBusy}
															className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-60"
															title="Edit Item"
														>
															<Edit size={14} />
														</button>
														<button
															onClick={() => setDeleteItemId(item.id)}
															className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
															title="Delete Item"
														>
															<Trash2 size={14} />
														</button>
													</div>
												) : null}
											</li>
										);
									})}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">No items in this topic yet.</p>
							)}
						</AdminCard>
					);
				})}
			</div>

			<ConfirmActionDialog
				open={deleteItemId !== null}
				title="Delete Item"
				description="Delete this item permanently?"
				confirmLabel="Delete Item"
				onCancel={() => setDeleteItemId(null)}
				onConfirm={confirmDeleteItem}
			/>

			<ConfirmActionDialog
				open={deleteTopicTarget !== null}
				title="Delete Topic"
				description={
					deleteTopicTarget
						? `Delete topic "${deleteTopicTarget.title}" and all materials inside it?`
						: ""
				}
				confirmLabel="Delete Topic"
				onCancel={() => setDeleteTopicTarget(null)}
				onConfirm={confirmDeleteTopic}
			/>
		</AdminShell>
	);
}
