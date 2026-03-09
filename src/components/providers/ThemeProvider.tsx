"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useThemeStore();

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const theme = saved || "light";
    setTheme(theme);
  }, [setTheme]);

  return <>{children}</>;
}
