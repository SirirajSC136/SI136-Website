import { adminLogsRepository } from "@/lib/server/domains/adminLogs/repository";
import {
	AdminAuditLogListResult,
	AdminAuditLogQuery,
	AdminAuditLogWriteInput,
} from "@/lib/server/domains/adminLogs/types";

export class AdminLogsService {
	async writeLog(input: AdminAuditLogWriteInput): Promise<void> {
		await adminLogsRepository.createLog(input);
	}

	async listLogs(query: AdminAuditLogQuery): Promise<AdminAuditLogListResult> {
		return adminLogsRepository.listLogs(query);
	}
}

export const adminLogsService = new AdminLogsService();
