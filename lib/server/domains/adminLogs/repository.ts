import {
	CollectionReference,
	FieldValue,
	Firestore,
	Query,
	QueryDocumentSnapshot,
	Timestamp,
} from "firebase-admin/firestore";
import { getFirestoreDb } from "@/lib/server/integrations/firebase/admin";
import {
	AdminAuditLogListResult,
	AdminAuditLogQuery,
	AdminAuditLogRecord,
	AdminAuditLogWriteInput,
} from "@/lib/server/domains/adminLogs/types";

const DEFAULT_LIMIT = 25;
const RETENTION_DAYS = 180;

type AdminAuditLogDoc = {
	createdAt?: FieldValue | Timestamp;
	expiresAt?: Timestamp;
	actorUid?: string;
	actorEmail?: string;
	actorEmailNormalized?: string;
	actorName?: string;
	action: string;
	resourceType: string;
	resourceId?: string;
	method: "POST" | "PUT" | "DELETE";
	path: string;
	status: "success" | "error";
	httpStatus: number;
	errorCode?: string;
	errorMessage?: string;
	requestPayload?: Record<string, unknown>;
	query?: Record<string, string>;
	durationMs: number;
};

function asIso(value: unknown): string | undefined {
	if (value instanceof Timestamp) {
		return value.toDate().toISOString();
	}
	return undefined;
}

function toRecord(snapshot: QueryDocumentSnapshot<AdminAuditLogDoc>): AdminAuditLogRecord {
	const data = snapshot.data();
	return {
		id: snapshot.id,
		createdAt: asIso(data.createdAt),
		expiresAt: asIso(data.expiresAt),
		actorUid: data.actorUid,
		actorEmail: data.actorEmail,
		actorEmailNormalized: data.actorEmailNormalized,
		actorName: data.actorName,
		action: data.action,
		resourceType: data.resourceType,
		resourceId: data.resourceId,
		method: data.method,
		path: data.path,
		status: data.status,
		httpStatus: data.httpStatus,
		errorCode: data.errorCode,
		errorMessage: data.errorMessage,
		requestPayload: data.requestPayload,
		query: data.query,
		durationMs: data.durationMs,
	};
}

export class AdminLogsRepository {
	private db: Firestore | null = null;
	private logsRef: CollectionReference<AdminAuditLogDoc> | null = null;

	constructor(private readonly dbFactory: () => Firestore = getFirestoreDb) {}

	private getDb(): Firestore {
		if (!this.db) {
			this.db = this.dbFactory();
		}
		return this.db;
	}

	private getLogsRef(): CollectionReference<AdminAuditLogDoc> {
		if (!this.logsRef) {
			this.logsRef = this.getDb().collection(
				"admin_audit_logs"
			) as CollectionReference<AdminAuditLogDoc>;
		}
		return this.logsRef;
	}

	async createLog(input: AdminAuditLogWriteInput): Promise<void> {
		const expiresAt = Timestamp.fromDate(
			new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000)
		);
		const payload: AdminAuditLogDoc = {
			createdAt: FieldValue.serverTimestamp(),
			expiresAt,
			action: input.action,
			resourceType: input.resourceType,
			method: input.method,
			path: input.path,
			status: input.status,
			httpStatus: input.httpStatus,
			durationMs: input.durationMs,
		};

		if (input.actorUid !== undefined) payload.actorUid = input.actorUid;
		if (input.actorEmail !== undefined) payload.actorEmail = input.actorEmail;
		if (input.actorEmailNormalized !== undefined) {
			payload.actorEmailNormalized = input.actorEmailNormalized;
		}
		if (input.actorName !== undefined) payload.actorName = input.actorName;
		if (input.resourceId !== undefined) payload.resourceId = input.resourceId;
		if (input.errorCode !== undefined) payload.errorCode = input.errorCode;
		if (input.errorMessage !== undefined) payload.errorMessage = input.errorMessage;
		if (input.requestPayload !== undefined) payload.requestPayload = input.requestPayload;
		if (input.query !== undefined) payload.query = input.query;

		await this.getLogsRef().add(payload);
	}

	async listLogs(query: AdminAuditLogQuery): Promise<AdminAuditLogListResult> {
		const limit = query.limit || DEFAULT_LIMIT;
		let logsQuery: Query<AdminAuditLogDoc> = this.getLogsRef();

		if (query.action) {
			logsQuery = logsQuery.where("action", "==", query.action);
		}

		if (query.status) {
			logsQuery = logsQuery.where("status", "==", query.status);
		}

		if (query.actorEmail) {
			logsQuery = logsQuery.where("actorEmailNormalized", "==", query.actorEmail);
		}

		if (query.from) {
			logsQuery = logsQuery.where(
				"createdAt",
				">=",
				Timestamp.fromDate(query.from)
			);
		}

		if (query.to) {
			logsQuery = logsQuery.where("createdAt", "<=", Timestamp.fromDate(query.to));
		}

		logsQuery = logsQuery.orderBy("createdAt", "desc").limit(limit);

		if (query.cursor) {
			const cursorSnapshot = await this.getLogsRef().doc(query.cursor).get();
			if (cursorSnapshot.exists) {
				logsQuery = logsQuery.startAfter(cursorSnapshot);
			}
		}

		const snapshot = await logsQuery.get();
		const entries = snapshot.docs.map(toRecord);
		const nextCursor =
			snapshot.size === limit && snapshot.docs.length > 0
				? snapshot.docs[snapshot.docs.length - 1].id
				: undefined;

		return { entries, nextCursor };
	}
}

export const adminLogsRepository = new AdminLogsRepository();
