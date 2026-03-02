import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const INITIAL_ADMIN_EMAIL = "purin.den@student.mahidol.edu";
const INITIAL_ADMIN_NAME = "Purin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function normalizeEmail(email) {
	return email.trim().toLowerCase();
}

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
	ensureAdminApp();

	const db = getFirestore();
	const emailNormalized = normalizeEmail(INITIAL_ADMIN_EMAIL);
	const ref = db.collection("admin_users").doc(emailNormalized);
	const now = FieldValue.serverTimestamp();

	await db.runTransaction(async (transaction) => {
		const existing = await transaction.get(ref);
		const previous = existing.data() ?? {};
		const payload = {
			email: INITIAL_ADMIN_EMAIL,
			emailNormalized,
			name: previous.name ?? INITIAL_ADMIN_NAME,
			active: true,
			createdAt: previous.createdAt ?? now,
			updatedAt: now,
			createdByEmail: previous.createdByEmail ?? emailNormalized,
		};

		if (previous.lastSeenAt !== undefined) {
			payload.lastSeenAt = previous.lastSeenAt;
		}
		if (previous.lastSeenUid !== undefined) {
			payload.lastSeenUid = previous.lastSeenUid;
		}

		transaction.set(
			ref,
			payload,
			{ merge: true }
		);
	});

	console.log(`Seeded initial admin: ${INITIAL_ADMIN_EMAIL}`);
}

main().catch((error) => {
	console.error("seed-initial-admin failed:", error);
	process.exit(1);
});
