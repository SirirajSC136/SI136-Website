import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/server/core/route";
import { HttpError } from "@/lib/server/core/errors";
import { requireAdminFromRequest } from "@/lib/server/domains/auth/service";
import { createCustomId } from "@/lib/server/domains/content/ids";
import { getFirebaseStorageBucket } from "@/lib/server/integrations/firebase/admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ID_RE = /^[A-Za-z0-9_-]+$/;
const INTERACTIVE_PREFIX = "admin/interactive/";

function extFromMime(mimeType: string): string {
	if (mimeType === "image/jpeg") return "jpg";
	if (mimeType === "image/png") return "png";
	if (mimeType === "image/webp") return "webp";
	throw new HttpError(400, "Unsupported image type", "validation_error");
}

function assertId(value: string, label: string): void {
	if (!value || !ID_RE.test(value)) {
		throw new HttpError(400, `Invalid ${label}`, "validation_error");
	}
}

function readString(formData: FormData, key: string): string {
	const value = formData.get(key);
	if (typeof value !== "string") {
		throw new HttpError(400, `Missing ${key}`, "validation_error");
	}
	const trimmed = value.trim();
	if (!trimmed) {
		throw new HttpError(400, `Missing ${key}`, "validation_error");
	}
	return trimmed;
}

function isInteractivePath(path: string): boolean {
	return path.startsWith(INTERACTIVE_PREFIX) && !path.includes("..");
}

export const postAdminInteractiveAssetHandler = withErrorHandling(async (request: Request) => {
	await requireAdminFromRequest(request);
	const formData = await request.formData();

	const courseId = readString(formData, "courseId");
	const topicId = readString(formData, "topicId");
	const itemId = readString(formData, "itemId");
	const previousPath = formData.get("previousPath");
	const file = formData.get("file");

	assertId(courseId, "courseId");
	assertId(topicId, "topicId");
	assertId(itemId, "itemId");

	if (!(file instanceof File)) {
		throw new HttpError(400, "Missing file", "validation_error");
	}
	if (!ALLOWED_MIME.has(file.type)) {
		throw new HttpError(400, "Only JPEG, PNG, and WebP images are allowed.", "validation_error");
	}
	if (file.size > MAX_SIZE_BYTES) {
		throw new HttpError(400, "Image must be 5MB or less.", "validation_error");
	}

	const extension = extFromMime(file.type);
	const assetId = createCustomId();
	const path = `${INTERACTIVE_PREFIX}${courseId}/${topicId}/${itemId}/${assetId}.${extension}`;

	const buffer = Buffer.from(await file.arrayBuffer());
	const token = randomUUID();
	const bucket = getFirebaseStorageBucket();
	const target = bucket.file(path);

	await target.save(buffer, {
		resumable: false,
		contentType: file.type,
		metadata: {
			metadata: {
				firebaseStorageDownloadTokens: token,
			},
		},
	});

	if (typeof previousPath === "string") {
		const normalized = previousPath.trim();
		if (normalized && normalized !== path && isInteractivePath(normalized)) {
			await bucket.file(normalized).delete({ ignoreNotFound: true }).catch(() => null);
		}
	}

	const encodedPath = encodeURIComponent(path);
	const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

	return NextResponse.json({
		success: true,
		data: {
			path,
			url,
		},
	});
});

export const deleteAdminInteractiveAssetHandler = withErrorHandling(async (request: Request) => {
	await requireAdminFromRequest(request);
	const body = await request.json().catch(() => ({}));
	const rawPath = typeof body?.path === "string" ? body.path.trim() : "";
	if (!rawPath || !isInteractivePath(rawPath)) {
		throw new HttpError(400, "Invalid storage path", "validation_error");
	}
	await getFirebaseStorageBucket().file(rawPath).delete({ ignoreNotFound: true });
	return NextResponse.json({ success: true });
});
