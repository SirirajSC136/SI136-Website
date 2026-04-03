"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginButton() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      alert("Sign in failed. Please try again.");
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
      transition-all duration-300
      disabled:cursor-not-allowed disabled:opacity-60
      hover:scale-105"
    >
      {loading ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}