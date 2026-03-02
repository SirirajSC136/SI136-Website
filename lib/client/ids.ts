export function createClientCustomId(): string {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function isCustomId(value: string): boolean {
	return /^[0-9a-f]{24}$/i.test(value);
}
