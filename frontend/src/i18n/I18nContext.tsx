import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { initialLangPref, resolveLang, systemLang, translate } from "./translations";
import type { Lang, LangPref } from "./translations";
import { setLocale } from "../util/format";

interface I18n {
  /** Effective language actually used for rendering. */
  lang: Lang;
  /** The user's chosen preference (system follows the browser). */
  pref: LangPref;
  setPref: (p: LangPref) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nCtx = createContext<I18n | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<LangPref>(() => initialLangPref());
  const [sysLang, setSysLang] = useState<Lang>(() => systemLang());

  // React to OS language changes while on "system".
  useEffect(() => {
    const onLang = () => setSysLang(systemLang());
    window.addEventListener("languagechange", onLang);
    return () => window.removeEventListener("languagechange", onLang);
  }, []);

  const lang: Lang = pref === "system" ? sysLang : resolveLang(pref);

  useEffect(() => {
    setLocale(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setPref = useCallback((p: LangPref) => {
    localStorage.setItem("planning_lang", p);
    setPrefState(p);
  }, []);

  const value = useMemo<I18n>(
    () => ({ lang, pref, setPref, t: (key, params) => translate(lang, key, params) }),
    [lang, pref, setPref],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
