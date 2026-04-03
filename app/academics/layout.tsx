"use client";

import LoginButton from "@/components/LoginButton";
import { useAuth } from "@/components/auth/AuthProvider";

export default function AcademicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div
          className="w-full max-w-md mx-auto 
          rounded-2xl border border-gray-200/80 dark:border-gray-700/80
          bg-white/50 dark:bg-gray-800/50
          shadow-lg backdrop-blur-lg 
          p-8 text-center 
          transition-all duration-300 ease-in-out"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please sign in with your{" "}
            <strong className="text-emerald-600 dark:text-emerald-400">
              @student.mahidol.edu
            </strong>{" "}
            account to view academic resources.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}