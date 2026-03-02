import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

function readPrivateKey(): string | undefined {
	const raw = process.env.FIREBASE_PRIVATE_KEY;
	if (!raw) return undefined;
	let value = raw.trim();
	if (value.endsWith(",")) {
		value = value.slice(0, -1).trim();
	}
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		value = value.slice(1, -1);
	}
	return value.replace(/\\n/g, "\n");
}

function initAdminApp(): App {
	if (getApps().length > 0) {
		return getApp();
	}

	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = readPrivateKey();

	if (!projectId) {
		throw new Error("Missing FIREBASE_PROJECT_ID");
	}

	if (clientEmail && privateKey) {
		return initializeApp({
			credential: cert({
				projectId,
				clientEmail,
				privateKey,
			}),
			projectId,
		});
	}

	return initializeApp({ projectId });
}

let cachedApp: App | null = null;

export function getFirebaseAdminApp(): App {
	if (!cachedApp) {
		cachedApp = initAdminApp();
	}
	return cachedApp;
}

export function getFirestoreDb(): Firestore {
	return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAuth(): Auth {
	return getAuth(getFirebaseAdminApp());
}
