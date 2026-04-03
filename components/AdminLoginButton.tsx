"use client";

import { useState } from "react";
import { resetAndSignInWithGoogle } from "@/lib/firebase/sessionClient";

export default function AdminLoginButton() {
	const [loading, setLoading] = useState(false);

	const handleSignIn = async () => {
		setLoading(true);
		try {
			await resetAndSignInWithGoogle();
		} catch (error) {
			console.error("Login failed:", error);
			alert("Sign in failed. Please try again with your student email.");
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
