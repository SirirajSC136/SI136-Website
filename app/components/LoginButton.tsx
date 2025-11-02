"use client";

import { signIn } from "next-auth/react";

export default function LoginButton() {
	return (
		<button
			onClick={() => signIn("google")}
			className="mt-8 inline-flex items-center gap-2.5 rounded-full
      bg-emerald-600 dark:bg-emerald-400
      px-8 py-3 font-semibold text-white
      shadow-lg shadow-emerald-500/30
      backdrop-blur-sm
      transition-all duration-300 ease-in-out
      hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/50
      relative overflow-hidden">
			Sign in with Google
		</button>
	);
}
