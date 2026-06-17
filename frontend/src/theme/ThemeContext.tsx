import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Mode = "light" | "dark";
const STORAGE_KEY = "planning_theme";

function osPrefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function initialMode(): Mode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return osPrefersDark() ? "dark" : "light"; // default: follow the OS setting
}

interface ThemeState {
  mode: Mode;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  // Whether the user has explicitly overridden the OS setting.
  const [overridden, setOverridden] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) !== null,
  );

  // Apply the attribute the CSS keys off of.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // While not overridden, follow live OS changes.
  useEffect(() => {
    if (overridden) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [overridden]);

  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      setOverridden(true);
      return next;
    });
  }, []);

  return <ThemeCtx.Provider value={{ mode, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
