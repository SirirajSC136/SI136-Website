"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { ImageAsset } from "@/types";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type Props = {
	label: string;
	courseId: string;
	topicId: string;
	itemId: string;
	value?: ImageAsset;
	onChange: (next?: ImageAsset) => void;
};

export default function InteractiveImageUploader({
	label,
	courseId,
	topicId,
	itemId,
	value,
	onChange,
}: Props) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const previewAlt = useMemo(() => value?.alt ?? "", [value?.alt]);

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const inputEl = event.currentTarget;
		const file = inputEl.files?.[0];
		if (!file) return;

		setError(null);
		if (!ALLOWED_MIME.has(file.type)) {
			setError("Only JPEG, PNG, and WebP images are allowed.");
			inputEl.value = "";
			return;
		}
		if (file.size > MAX_SIZE_BYTES) {
			setError("Image must be 5MB or less.");
			inputEl.value = "";
			return;
		}

		setUploading(true);
		try {
			const previousPath = value?.path;
			const formData = new FormData();
			formData.append("courseId", courseId);
			formData.append("topicId", topicId);
			formData.append("itemId", itemId);
			formData.append("file", file);
			if (previousPath) {
				formData.append("previousPath", previousPath);
			}

			const response = await fetch("/api/admin/interactive-assets", {
				method: "POST",
				body: formData,
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(
					typeof payload?.error === "string" ? payload.error : "Failed to upload image."
				);
			}
			const path = payload?.data?.path as string | undefined;
			const url = payload?.data?.url as string | undefined;
			if (!path || !url) {
				throw new Error("Upload response is missing image metadata.");
			}

			onChange({
				path,
				url,
				alt: value?.alt?.trim() || file.name,
			});
		} catch (uploadError) {
			console.error("Interactive image upload failed:", uploadError);
			setError("Failed to upload image. Please try again.");
		} finally {
			setUploading(false);
			inputEl.value = "";
		}
	};

	const handleRemoveImage = async () => {
		if (!value) return;
		const previousPath = value.path;
		onChange(undefined);
		try {
			await fetch("/api/admin/interactive-assets", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ path: previousPath }),
			});
		} catch {
			// Best effort delete only.
		}
	};

	return (
		<div className="rounded-md border p-3 space-y-2">
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-medium text-slate-700">{label}</p>
				<label className="inline-flex cursor-pointer items-center gap-2 rounded bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-900">
					{uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
					<span>{uploading ? "Uploading..." : "Upload Image"}</span>
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp"
						className="hidden"
						disabled={uploading}
						onChange={handleFileChange}
					/>
				</label>
			</div>

			{value && (
				<div className="space-y-2">
					<img
						src={value.url}
						alt={previewAlt || "Uploaded interactive image"}
						className="h-40 w-full rounded border object-contain bg-slate-50"
					/>
					<input
						value={value.alt}
						onChange={(event) =>
							onChange({
								...value,
								alt: event.target.value,
							})
						}
						placeholder="Describe the image for accessibility"
						className="block w-full rounded border p-2 text-sm"
					/>
					<button
						type="button"
						onClick={handleRemoveImage}
						className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
					>
						<Trash2 size={12} />
						Remove Image
					</button>
				</div>
			)}

			{error && <p className="text-xs text-red-600">{error}</p>}
		</div>
	);
}
