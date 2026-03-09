"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth.store";

/**
 * Keeps the existing Zustand auth store and localStorage token in sync
 * with the NextAuth session so all legacy code continues to work unchanged.
 */
export function AuthSync() {
  const { data: session, status } = useSession();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.accessToken) {
      localStorage.setItem("access_token", session.user.accessToken);
      setUser({
        id: Number(session.user.id) || 0,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        role: session.user.role,
      });
    } else if (status === "unauthenticated") {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, [session, status, setUser]);

  return null;
}
