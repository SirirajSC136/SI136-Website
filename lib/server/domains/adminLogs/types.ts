export type AdminAuditLogStatus = "success" | "error";

export type AdminAuditLogRecord = {
	id: string;
	createdAt?: string;
	expiresAt?: string;
	actorUid?: string;
	actorEmail?: string;
	actorEmailNormalized?: string;
	actorName?: string;
	action: string;
	resourceType: string;
	resourceId?: string;
	method: "POST" | "PUT" | "DELETE";
	path: string;
	status: AdminAuditLogStatus;
	httpStatus: number;
	errorCode?: string;
	errorMessage?: string;
	requestPayload?: Record<string, unknown>;
	query?: Record<string, string>;
	durationMs: number;
};

export type AdminAuditLogWriteInput = Omit<
	AdminAuditLogRecord,
	"id" | "createdAt" | "expiresAt"
>;

export type AdminAuditLogQuery = {
	cursor?: string;
	limit: number;
	action?: string;
	status?: AdminAuditLogStatus;
	actorEmail?: string;
	from?: Date;
	to?: Date;
};

export type AdminAuditLogListResult = {
	entries: AdminAuditLogRecord[];
	nextCursor?: string;
};
