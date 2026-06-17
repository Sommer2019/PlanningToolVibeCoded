import { useI18n } from "../i18n/I18nContext";
import { LANG_PREFS } from "../i18n/translations";

/** Three-way language selector: System / DE / EN. */
export function LanguageSwitcher() {
  const { pref, setPref, t } = useI18n();
  const label = (p: (typeof LANG_PREFS)[number]) => (p === "system" ? t("lang.system") : p.toUpperCase());
  return (
    <div className="segmented" role="group" aria-label={t("common.language")}>
      {LANG_PREFS.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={pref === p}
          onClick={() => setPref(p)}
          title={label(p)}
        >
          {label(p)}
        </button>
      ))}
    </div>
  );
}
