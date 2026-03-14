"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

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
      // Set basic info immediately, then fetch full account for diemTichLuy
      setUser({
        id: Number(session.user.id) || 0,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        sdt: session.user.sdt ?? null,
        role: session.user.role,
      });
      authService
        .getAccount()
        .then((account) => {
          setUser({
            id: account.id,
            email: account.email,
            name: account.name,
            sdt: account.sdt,
            role: account.role,
            diemTichLuy: account.diemTichLuy,
          });
        })
        .catch(() => {});
    } else if (status === "unauthenticated") {
      localStorage.removeItem("access_token");
      setUser(null);
    }
  }, [session, status, setUser]);

  return null;
}
