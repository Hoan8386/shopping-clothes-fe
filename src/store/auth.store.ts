import { create } from "zustand";
import { ResLoginUser } from "@/types";

interface AuthState {
  user: ResLoginUser | null;
  isAuthenticated: boolean;
  setUser: (user: ResLoginUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem("access_token");
    set({ user: null, isAuthenticated: false });
  },
}));
