'use client';

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
    >
      Sign in with Google
    </button>
  );
}
