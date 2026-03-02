export type AdminUserRecord = {
	email: string;
	emailNormalized: string;
	name?: string;
	active: boolean;
	createdAt?: string;
	updatedAt?: string;
	createdByEmail?: string;
	lastSeenAt?: string;
	lastSeenUid?: string;
};

export type UpsertAdminInput = {
	email: string;
	name?: string;
	createdByEmail?: string;
};
