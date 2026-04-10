"use client";

import { User, signInWithPopup, signOut } from "firebase/auth";
import { googleProvider, getFirebaseClientAuth } from "@/lib/firebase/client";

export async function clearServerSession(): Promise<void> {
	const response = await fetch("/api/auth/session", {
		method: "DELETE",
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || "Failed to clear existing session");
	}
}

export async function establishServerSession(user: User): Promise<void> {
	const idToken = await user.getIdToken(true);
	const sessionResponse = await fetch("/api/auth/session", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ idToken }),
	});

	if (!sessionResponse.ok) {
		const errorData = await sessionResponse.json().catch(() => ({}));
		throw new Error(errorData.error || "Failed to establish session");
	}
}

export async function resetAndSignInWithGoogle(): Promise<void> {
	const auth = getFirebaseClientAuth();

	await signOut(auth).catch(() => undefined);
	await clearServerSession();

	googleProvider.setCustomParameters({
		prompt: "select_account",
		hd: "student.mahidol.edu",
	});

	const result = await signInWithPopup(auth, googleProvider);
	try {
		await establishServerSession(result.user);
	} catch (error) {
		await signOut(auth).catch(() => undefined);
		throw error;
	}

	window.location.reload();
}

export async function signOutEverywhere(): Promise<void> {
	const auth = getFirebaseClientAuth();
	await signOut(auth).catch(() => undefined);
	await clearServerSession();
}
