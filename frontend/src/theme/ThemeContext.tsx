import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";
export const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];
const STORAGE_KEY = "planning_theme";

function osPrefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function initialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

interface ThemeState {
  /** The user's chosen preference. */
  mode: ThemeMode;
  /** The actually-applied theme (system resolved against the OS). */
  resolved: "light" | "dark";
  setMode: (m: ThemeMode) => void;
}

const ThemeCtx = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [osDark, setOsDark] = useState<boolean>(osPrefersDark);

  // Track OS preference (only matters while mode === "system").
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setOsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" = mode === "system" ? (osDark ? "dark" : "light") : mode;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    setModeState(m);
  }, []);

  return <ThemeCtx.Provider value={{ mode, resolved, setMode }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
