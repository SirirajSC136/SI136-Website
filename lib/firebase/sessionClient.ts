"use client";

import { signInWithPopup, signOut } from "firebase/auth";
import { googleProvider, getFirebaseClientAuth } from "@/lib/firebase/client";

async function clearServerSession(): Promise<void> {
	const response = await fetch("/api/auth/session", {
		method: "DELETE",
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || "Failed to clear existing session");
	}
}

export async function resetAndSignInWithGoogle(): Promise<void> {
	const auth = getFirebaseClientAuth();

	await signOut(auth).catch(() => undefined);
	await clearServerSession();

	googleProvider.setCustomParameters({
		prompt: "select_account",
	});

	const result = await signInWithPopup(auth, googleProvider);
	const idToken = await result.user.getIdToken(true);
	const sessionResponse = await fetch("/api/auth/session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
	});

	if (!sessionResponse.ok) {
		await signOut(auth).catch(() => undefined);
		const errorData = await sessionResponse.json().catch(() => ({}));
		throw new Error(errorData.error || "Failed to establish session");
	}

	window.location.reload();
}
