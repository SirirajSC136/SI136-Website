'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <button
        onClick={() => signIn('github')}
        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
