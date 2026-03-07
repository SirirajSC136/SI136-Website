import "server-only";

import { getOptionalEnv } from "@/lib/server/core/env";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function isLocalHostname(hostname: string): boolean {
	return LOCAL_HOSTNAMES.has(hostname.toLowerCase());
}

function normalizeAppUrlInput(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error("NEXT_PUBLIC_APP_URL is empty");
	}

	if (/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	const hostname = trimmed.split("/")[0]?.split(":")[0] ?? "";
	const protocol = isLocalHostname(hostname) ? "http://" : "https://";
	return `${protocol}${trimmed}`;
}

export function getServerAppBaseUrl(): string | null {
	const rawValue = getOptionalEnv("NEXT_PUBLIC_APP_URL");
	if (!rawValue) {
		return null;
	}

	let parsed: URL;
	try {
		parsed = new URL(normalizeAppUrlInput(rawValue));
	} catch {
		throw new Error(`Invalid app URL: ${rawValue}`);
	}

	const isLocal = isLocalHostname(parsed.hostname);
	if (!isLocal && process.env.NODE_ENV !== "development" && parsed.protocol !== "https:") {
		parsed.protocol = "https:";
	}

	const pathname = parsed.pathname.replace(/\/+$/, "");
	return `${parsed.origin}${pathname}`;
}

export function buildServerAppUrl(path: string): string {
	const baseUrl = getServerAppBaseUrl();
	if (!baseUrl) {
		throw new Error("Missing NEXT_PUBLIC_APP_URL for server-side internal fetches");
	}

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return new URL(normalizedPath, `${baseUrl}/`).toString();
}
