import { HttpError } from "@/lib/server/core/errors";
import { invalidateAdminStatusCache, SessionUser } from "@/lib/server/domains/auth/service";
import { adminsRepository } from "@/lib/server/domains/admins/repository";
import { normalizeAdminEmail } from "@/lib/server/domains/admins/utils";
import { AdminUserRecord } from "@/lib/server/domains/admins/types";

export class AdminsService {
	async listAdmins(): Promise<AdminUserRecord[]> {
		return adminsRepository.listAdmins();
	}

	async upsertAdmin(input: {
		email: string;
		name?: string;
		currentUser?: SessionUser;
	}): Promise<AdminUserRecord> {
		const createdByEmail = normalizeAdminEmail(input.currentUser?.email) ?? undefined;
		const admin = await adminsRepository.upsertAdmin({
			email: input.email,
			name: input.name,
			createdByEmail,
		});
		invalidateAdminStatusCache(admin.emailNormalized);
		return admin;
	}

	async removeAdmin(email: string, currentUser: SessionUser): Promise<void> {
		const targetEmail = normalizeAdminEmail(email);
		if (!targetEmail) {
			throw new HttpError(400, "Invalid email", "validation_error");
		}

		const target = await adminsRepository.getAdminByNormalizedEmail(targetEmail);
		if (!target || !target.active) {
			throw new HttpError(404, "Admin not found", "admin_not_found");
		}

		const activeCount = await adminsRepository.countActiveAdmins();
		if (activeCount <= 1) {
			throw new HttpError(
				400,
				"Cannot remove the last active admin",
				"last_admin_blocked"
			);
		}

		const removed = await adminsRepository.deactivateAdminByEmail(targetEmail);
		if (!removed) {
			throw new HttpError(404, "Admin not found", "admin_not_found");
		}

		invalidateAdminStatusCache(targetEmail);

		const currentEmail = normalizeAdminEmail(currentUser.email);
		if (currentEmail && currentEmail === targetEmail) {
			invalidateAdminStatusCache(currentEmail);
		}
	}

	async isEmailAdmin(email?: string | null): Promise<boolean> {
		return adminsRepository.isActiveAdminByEmail(email);
	}
}

export const adminsService = new AdminsService();
