"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import {
  resetAndSignInWithGoogle,
  signOutEverywhere,
} from "@/lib/firebase/sessionClient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to fetch session");
        }
        const data = await res.json();
        setIsAdmin(Boolean(data.user?.isAdmin));
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const ALLOWED_DOMAINS = ["@student.mahidol.edu", "@student.mahidol.ac.th"];
        const isAllowed = ALLOWED_DOMAINS.some((d) => user.email?.endsWith(d));
        if (user && !isAllowed) {
          console.warn("Blocked non-Mahidol account:", user.email);
          await signOutEverywhere().catch(() => undefined);
          alert("Only Mahidol accounts are allowed");
          setUser(null);
          setLoading(false);
        } else if (user) {
          setUser(user);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth state error:", err);
        setUser(null);
        setLoading(false);
      } finally {
        clearTimeout(timeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await resetAndSignInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);

      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error("Unknown sign-in error");
      }
    }
  };

  const signOut = async () => {
    try {
      await signOutEverywhere();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signOut, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
