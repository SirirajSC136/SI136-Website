import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

function ensureFirebaseAdminApp() {
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

function parseFlag(name) {
	return process.argv.includes(`--${name}`);
}

async function batchDeleteRefs(db, refs) {
	let deleted = 0;
	const chunkSize = 400;
	for (let i = 0; i < refs.length; i += chunkSize) {
		const batch = db.batch();
		const chunk = refs.slice(i, i + chunkSize);
		for (const ref of chunk) {
			batch.delete(ref);
		}
		await batch.commit();
		deleted += chunk.length;
	}
	return deleted;
}

async function main() {
	loadEnvLocal();
	ensureFirebaseAdminApp();
	const db = getFirestore();
	const apply = parseFlag("apply");

	const [quizSnapshot, flashcardSnapshot] = await Promise.all([
		db.collectionGroup("items").where("item.type", "==", "Quiz").get(),
		db.collectionGroup("items").where("item.type", "==", "Flashcard").get(),
	]);

	const candidates = [...quizSnapshot.docs, ...flashcardSnapshot.docs];
	const staleRefs = candidates
		.filter((doc) => {
			const item = doc.data()?.item || {};
			const hasInteractiveRefId =
				typeof item.interactiveRefId === "string" && item.interactiveRefId.length > 0;
			const hasInlineContent = typeof item.content === "object" && item.content !== null;
			return !hasInteractiveRefId || hasInlineContent;
		})
		.map((doc) => doc.ref);

	console.log(`Found ${staleRefs.length} legacy inline interactive materials.`);
	if (!apply) {
		console.log("Dry run mode. Re-run with --apply to delete them.");
		return;
	}

	const deleted = await batchDeleteRefs(db, staleRefs);
	console.log(`Deleted ${deleted} legacy materials.`);
}

main().catch((error) => {
	console.error("Legacy interactive cleanup failed:", error);
	process.exit(1);
});
