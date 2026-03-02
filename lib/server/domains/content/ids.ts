import crypto from "crypto";

export function createCustomId(): string {
	return crypto.randomBytes(12).toString("hex");
}

export function isCustomId(value: string): boolean {
	return /^[0-9a-f]{24}$/i.test(value);
}
