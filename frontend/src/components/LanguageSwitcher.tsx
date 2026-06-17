import { useI18n } from "../i18n/I18nContext";
import { LANGS } from "../i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="row" style={{ margin: 0, gap: "var(--space-2)" }} title={t("common.language")}>
      <select
        style={{ width: "auto" }}
        value={lang}
        aria-label={t("common.language")}
        onChange={(e) => setLang(e.target.value as (typeof LANGS)[number])}
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
