const ALLOWED_EMAIL_DOMAINS = ["@student.mahidol.edu"];

export function normalizeAdminEmail(email?: string | null): string | null {
	if (!email) return null;
	const normalized = email.trim().toLowerCase();
	if (!normalized) return null;
	return normalized;
}

export function isAllowedStudentEmail(email?: string | null): boolean {
	const normalized = normalizeAdminEmail(email);
	if (!normalized) return false;
	return ALLOWED_EMAIL_DOMAINS.some((domain) => normalized.endsWith(domain));
}
