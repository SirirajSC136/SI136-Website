declare module "ical" {
	export function parseICS(data: string): Record<string, unknown>;
}
