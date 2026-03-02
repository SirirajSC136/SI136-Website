import { NextResponse } from "next/server";
import { HttpError } from "@/lib/server/core/errors";
import { getSessionUserFromRequest, SessionUser } from "@/lib/server/domains/auth/service";
import { normalizeAdminEmail } from "@/lib/server/domains/admins/utils";
import { adminLogsService } from "@/lib/server/domains/adminLogs/service";

const REDACTED = "[REDACTED]";
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 20;
const MAX_DEPTH = 5;
const MAX_KEYS_PER_OBJECT = 50;
const REDACT_KEY_PATTERN =
	/(token|password|secret|privatekey|authorization|cookie|credential|apikey|api_key)/i;

type AuditMethod = "POST" | "PUT" | "DELETE";

type AuditResolverInput<TArgs extends unknown[]> = {
	request: Request;
	args: TArgs;
	requestPayload?: Record<string, unknown>;
	response?: NextResponse;
	error?: unknown;
	sessionUser: SessionUser | null;
};

export type AdminAuditMetadata<TArgs extends unknown[]> = {
	action: string;
	resourceType: string;
	resolveResourceId?: (input: AuditResolverInput<TArgs>) => string | undefined;
};

type AdminAuditHandler<TArgs extends [Request, ...unknown[]]> = (
	...args: TArgs
) => Promise<NextResponse>;

function truncateString(value: string): string {
	if (value.length <= MAX_STRING_LENGTH) return value;
	return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
	if (value === null || value === undefined) return value;
	if (depth > MAX_DEPTH) return "[max_depth_reached]";

	if (typeof value === "string") return truncateString(value);
	if (typeof value === "number" || typeof value === "boolean") return value;

	if (Array.isArray(value)) {
		return value
			.slice(0, MAX_ARRAY_LENGTH)
			.map((item) => sanitizeValue(item, depth + 1));
	}

	if (typeof value === "object") {
		const objectValue = value as Record<string, unknown>;
		const result: Record<string, unknown> = {};
		let keyCount = 0;
		for (const [key, nestedValue] of Object.entries(objectValue)) {
			if (keyCount >= MAX_KEYS_PER_OBJECT) break;
			if (REDACT_KEY_PATTERN.test(key)) {
				result[key] = REDACTED;
			} else {
				result[key] = sanitizeValue(nestedValue, depth + 1);
			}
			keyCount += 1;
		}
		return result;
	}

	return String(value);
}

function parseHttpStatus(error: unknown): number {
	if (error instanceof HttpError) return error.status;
	if (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		typeof (error as { status?: unknown }).status === "number"
	) {
		return (error as { status: number }).status;
	}
	return 500;
}

function parseErrorCode(error: unknown): string | undefined {
	if (error instanceof HttpError) return error.code;
	if (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof (error as { code?: unknown }).code === "string"
	) {
		return (error as { code: string }).code;
	}
	return undefined;
}

function parseErrorMessage(error: unknown): string | undefined {
	if (error instanceof Error) return truncateString(error.message);
	if (typeof error === "string") return truncateString(error);
	return undefined;
}

function parseMethod(request: Request): AuditMethod {
	const method = request.method.toUpperCase();
	if (method === "POST" || method === "PUT" || method === "DELETE") return method;
	return "POST";
}

async function parseRequestPayload(
	request: Request
): Promise<Record<string, unknown> | undefined> {
	const method = request.method.toUpperCase();
	if (method !== "POST" && method !== "PUT" && method !== "DELETE") {
		return undefined;
	}

	try {
		const raw = await request.clone().json();
		if (raw && typeof raw === "object" && !Array.isArray(raw)) {
			return sanitizeValue(raw) as Record<string, unknown>;
		}
		return { value: sanitizeValue(raw) };
	} catch {
		return undefined;
	}
}

function parseQuery(request: Request): Record<string, string> | undefined {
	const searchParams = new URL(request.url).searchParams;
	if ([...searchParams.keys()].length === 0) return undefined;
	const result: Record<string, string> = {};
	for (const [key, value] of searchParams.entries()) {
		if (REDACT_KEY_PATTERN.test(key)) {
			result[key] = REDACTED;
		} else {
			result[key] = truncateString(value);
		}
	}
	return result;
}

async function writeAuditLogSafe(params: {
	action: string;
	resourceType: string;
	resourceId?: string;
	request: Request;
	requestPayload?: Record<string, unknown>;
	query?: Record<string, string>;
	sessionUser: SessionUser | null;
	status: "success" | "error";
	httpStatus: number;
	errorCode?: string;
	errorMessage?: string;
	durationMs: number;
}): Promise<void> {
	try {
		await adminLogsService.writeLog({
			action: params.action,
			resourceType: params.resourceType,
			resourceId: params.resourceId,
			method: parseMethod(params.request),
			path: new URL(params.request.url).pathname,
			status: params.status,
			httpStatus: params.httpStatus,
			errorCode: params.errorCode,
			errorMessage: params.errorMessage,
			requestPayload: params.requestPayload,
			query: params.query,
			durationMs: params.durationMs,
			actorUid: params.sessionUser?.uid,
			actorEmail: params.sessionUser?.email,
			actorEmailNormalized: normalizeAdminEmail(params.sessionUser?.email) ?? undefined,
			actorName: params.sessionUser?.name,
		});
	} catch (auditError) {
		console.error("Failed to write admin audit log:", auditError);
	}
}

export function withAdminAudit<TArgs extends [Request, ...unknown[]]>(
	metadata: AdminAuditMetadata<TArgs>,
	handler: AdminAuditHandler<TArgs>
): AdminAuditHandler<TArgs> {
	return async (...args: TArgs): Promise<NextResponse> => {
		const request = args[0];
		const startedAt = Date.now();
		const [sessionUser, requestPayload] = await Promise.all([
			getSessionUserFromRequest(request).catch(() => null),
			parseRequestPayload(request),
		]);
		const query = parseQuery(request);

		try {
			const response = await handler(...args);
			const resourceId = metadata.resolveResourceId?.({
				request,
				args,
				requestPayload,
				response,
				sessionUser,
			});
			await writeAuditLogSafe({
				action: metadata.action,
				resourceType: metadata.resourceType,
				resourceId,
				request,
				requestPayload,
				query,
				sessionUser,
				status: "success",
				httpStatus: response.status,
				durationMs: Date.now() - startedAt,
			});
			return response;
		} catch (error) {
			const resourceId = metadata.resolveResourceId?.({
				request,
				args,
				requestPayload,
				error,
				sessionUser,
			});
			await writeAuditLogSafe({
				action: metadata.action,
				resourceType: metadata.resourceType,
				resourceId,
				request,
				requestPayload,
				query,
				sessionUser,
				status: "error",
				httpStatus: parseHttpStatus(error),
				errorCode: parseErrorCode(error),
				errorMessage: parseErrorMessage(error),
				durationMs: Date.now() - startedAt,
			});
			throw error;
		}
	};
}
