import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvLocal() {
	const envPath = path.join(projectRoot, ".env.local");
	if (!fs.existsSync(envPath)) return;

	const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		let value = trimmed.slice(eqIndex + 1).trim();
		if (value.endsWith(",")) {
			value = value.slice(0, -1).trim();
		}
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) {
			process.env[key] = value;
		}
	}
}

function readArg(name) {
	const full = process.argv.find((arg) => arg.startsWith(`--${name}=`));
	return full ? full.split("=").slice(1).join("=") : undefined;
}

function ensureAdminApp() {
	if (getApps().length > 0) return;

	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
	const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, "\n") : undefined;

	if (!projectId || !clientEmail || !privateKey) {
		throw new Error(
			"Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY."
		);
	}

	initializeApp({
		credential: cert({ projectId, clientEmail, privateKey }),
		projectId,
	});
}

async function main() {
	loadEnvLocal();

	const uid = readArg("uid");
	const adminArg = readArg("admin");
	const adminValue = adminArg ? adminArg === "true" : true;

	if (!uid) {
		throw new Error("Usage: npm run firebase:set-admin -- --uid=<firebase_uid> [--admin=true|false]");
	}

	ensureAdminApp();
	await getAuth().setCustomUserClaims(uid, { admin: adminValue });

	console.log(`Updated custom claims for uid=${uid}: admin=${adminValue}`);
}

main().catch((error) => {
	console.error("set-admin-claims failed:", error);
	process.exit(1);
});
