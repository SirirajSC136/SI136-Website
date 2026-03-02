import {
	CollectionReference,
	FieldValue,
	Firestore,
	QueryDocumentSnapshot,
	Timestamp,
} from "firebase-admin/firestore";
import { getFirestoreDb } from "@/lib/server/integrations/firebase/admin";
import { normalizeAdminEmail } from "@/lib/server/domains/admins/utils";
import { AdminUserRecord, UpsertAdminInput } from "@/lib/server/domains/admins/types";
import { HttpError } from "@/lib/server/core/errors";

type AdminUserDoc = {
	email: string;
	emailNormalized: string;
	name?: string;
	active: boolean;
	createdAt?: FieldValue | Timestamp;
	updatedAt?: FieldValue | Timestamp;
	createdByEmail?: string;
	lastSeenAt?: FieldValue | Timestamp;
	lastSeenUid?: string;
};

function asIso(value: unknown): string | undefined {
	if (value instanceof Timestamp) {
		return value.toDate().toISOString();
	}
	return undefined;
}

function toAdminUserRecord(snapshot: QueryDocumentSnapshot<AdminUserDoc>): AdminUserRecord {
	const data = snapshot.data();
	return {
		email: data.email,
		emailNormalized: data.emailNormalized,
		name: data.name,
		active: data.active === true,
		createdAt: asIso(data.createdAt),
		updatedAt: asIso(data.updatedAt),
		createdByEmail: data.createdByEmail,
		lastSeenAt: asIso(data.lastSeenAt),
		lastSeenUid: data.lastSeenUid,
	};
}

export class AdminsRepository {
	private db: Firestore | null = null;
	private adminsRef: CollectionReference<AdminUserDoc> | null = null;

	constructor(private readonly dbFactory: () => Firestore = getFirestoreDb) {}

	private getDb(): Firestore {
		if (!this.db) {
			this.db = this.dbFactory();
		}
		return this.db;
	}

	private getAdminsRef(): CollectionReference<AdminUserDoc> {
		if (!this.adminsRef) {
			this.adminsRef = this.getDb().collection("admin_users") as CollectionReference<AdminUserDoc>;
		}
		return this.adminsRef;
	}

	async listAdmins(): Promise<AdminUserRecord[]> {
		const snapshot = await this.getAdminsRef().get();
		return snapshot.docs
			.map(toAdminUserRecord)
			.sort((a, b) => {
				if (a.active !== b.active) return a.active ? -1 : 1;
				return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
			});
	}

	async getAdminByNormalizedEmail(
		emailNormalized: string
	): Promise<AdminUserRecord | null> {
		const snapshot = await this.getAdminsRef().doc(emailNormalized).get();
		if (!snapshot.exists) return null;
		const data = snapshot.data();
		if (!data) return null;
		return {
			email: data.email,
			emailNormalized: data.emailNormalized,
			name: data.name,
			active: data.active === true,
			createdAt: asIso(data.createdAt),
			updatedAt: asIso(data.updatedAt),
			createdByEmail: data.createdByEmail,
			lastSeenAt: asIso(data.lastSeenAt),
			lastSeenUid: data.lastSeenUid,
		};
	}

	async isActiveAdminByEmail(email?: string | null): Promise<boolean> {
		const emailNormalized = normalizeAdminEmail(email);
		if (!emailNormalized) return false;
		const admin = await this.getAdminByNormalizedEmail(emailNormalized);
		return admin?.active === true;
	}

	async upsertAdmin(input: UpsertAdminInput): Promise<AdminUserRecord> {
		const emailNormalized = normalizeAdminEmail(input.email);
		if (!emailNormalized) {
			throw new HttpError(400, "Invalid email", "validation_error");
		}

		const now = FieldValue.serverTimestamp();
		const ref = this.getAdminsRef().doc(emailNormalized);
		await this.getDb().runTransaction(async (transaction) => {
			const existing = await transaction.get(ref);
			const previous = existing.data();
			const payload: AdminUserDoc = {
				email: input.email.trim(),
				emailNormalized,
				active: true,
				createdAt: previous?.createdAt ?? now,
				updatedAt: now,
			};

			const resolvedName = input.name?.trim() || previous?.name;
			if (resolvedName !== undefined) {
				payload.name = resolvedName;
			}

			const resolvedCreatedByEmail = previous?.createdByEmail ?? input.createdByEmail;
			if (resolvedCreatedByEmail !== undefined) {
				payload.createdByEmail = resolvedCreatedByEmail;
			}

			if (previous?.lastSeenAt !== undefined) {
				payload.lastSeenAt = previous.lastSeenAt;
			}

			if (previous?.lastSeenUid !== undefined) {
				payload.lastSeenUid = previous.lastSeenUid;
			}

			transaction.set(
				ref,
				payload,
				{ merge: true }
			);
		});

		const saved = await this.getAdminByNormalizedEmail(emailNormalized);
		if (!saved) {
			throw new HttpError(500, "Failed to upsert admin", "admin_upsert_failed");
		}
		return saved;
	}

	async countActiveAdmins(): Promise<number> {
		const snapshot = await this.getAdminsRef().where("active", "==", true).get();
		return snapshot.size;
	}

	async deactivateAdminByEmail(email: string): Promise<boolean> {
		const emailNormalized = normalizeAdminEmail(email);
		if (!emailNormalized) return false;

		const ref = this.getAdminsRef().doc(emailNormalized);
		const snapshot = await ref.get();
		if (!snapshot.exists) return false;
		const data = snapshot.data();
		if (!data || data.active !== true) return false;

		await ref.set(
			{
				active: false,
				updatedAt: FieldValue.serverTimestamp(),
			},
			{ merge: true }
		);
		return true;
	}
}

export const adminsRepository = new AdminsRepository();
