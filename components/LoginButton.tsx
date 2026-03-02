"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { firebaseGoogleProvider, getFirebaseClientAuth } from "@/lib/firebase/client";

export default function LoginButton() {
	const [loading, setLoading] = useState(false);

	const handleSignIn = async () => {
		setLoading(true);
		try {
			const auth = getFirebaseClientAuth();
			const result = await signInWithPopup(auth, firebaseGoogleProvider);
			const idToken = await result.user.getIdToken();

			const sessionResponse = await fetch("/api/auth/session", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ idToken }),
			});

			if (!sessionResponse.ok) {
				const errorData = await sessionResponse.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to establish session");
			}

			window.location.reload();
		} catch (error) {
			console.error("Login failed:", error);
			alert("Login failed. Please try again with your student email.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			onClick={handleSignIn}
			disabled={loading}
			className="mt-8 inline-flex items-center gap-2.5 rounded-full
      bg-emerald-600 dark:bg-emerald-400
      px-8 py-3 font-semibold text-white
      shadow-lg shadow-emerald-500/30
      backdrop-blur-sm
      transition-all duration-300 ease-in-out
      disabled:cursor-not-allowed disabled:opacity-60
      hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/50
      relative overflow-hidden">
			{loading ? "Signing in..." : "Sign in with Google"}
		</button>
	);
}
