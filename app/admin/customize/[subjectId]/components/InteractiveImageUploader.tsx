"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { ImageAsset } from "@/types";
import { getFirebaseClientStorage } from "@/lib/firebase/client";
import { createClientCustomId } from "@/lib/client/ids";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromFile(file: File): string {
	if (file.type === "image/jpeg") return "jpg";
	if (file.type === "image/png") return "png";
	if (file.type === "image/webp") return "webp";
	const nameParts = file.name.split(".");
	return nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : "img";
}

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

	const uploadPathPrefix = `admin/interactive/${courseId}/${topicId}/${itemId}`;

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setError(null);
		if (!ALLOWED_MIME.has(file.type)) {
			setError("Only JPEG, PNG, and WebP images are allowed.");
			event.currentTarget.value = "";
			return;
		}
		if (file.size > MAX_SIZE_BYTES) {
			setError("Image must be 5MB or less.");
			event.currentTarget.value = "";
			return;
		}

		setUploading(true);
		try {
			const extension = extFromFile(file);
			const assetId = createClientCustomId();
			const path = `${uploadPathPrefix}/${assetId}.${extension}`;
			const storage = getFirebaseClientStorage();
			const uploadRef = ref(storage, path);
			await uploadBytes(uploadRef, file, { contentType: file.type });
			const url = await getDownloadURL(uploadRef);
			const previousPath = value?.path;
			onChange({
				path,
				url,
				alt: value?.alt?.trim() || file.name,
			});
			if (previousPath && previousPath !== path) {
				await deleteObject(ref(storage, previousPath)).catch(() => null);
			}
		} catch (uploadError) {
			console.error("Interactive image upload failed:", uploadError);
			setError("Failed to upload image. Please try again.");
		} finally {
			setUploading(false);
			event.currentTarget.value = "";
		}
	};

	const handleRemoveImage = async () => {
		if (!value) return;
		const previousPath = value.path;
		onChange(undefined);
		try {
			const storage = getFirebaseClientStorage();
			await deleteObject(ref(storage, previousPath));
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
