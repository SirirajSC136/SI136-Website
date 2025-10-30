'use client';

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="px-4 py-2 bg-emerald-600 dark:bg-emerald-900 text-white rounded-lg hover:cursor-pointer hover:bg-emerald-700 transition "
    >
      Sign in with Google
    </button>
  );
}
