import { useTheme, THEME_MODES } from "../theme/ThemeContext";
import { useI18n } from "../i18n/I18nContext";

/** Three-way theme selector: System / Light / Dark. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();
  return (
    <div className="segmented" role="group" aria-label={t("common.theme")}>
      {THEME_MODES.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => setMode(m)}
          title={t(`theme.${m}`)}
        >
          {t(`theme.${m}`)}
        </button>
      ))}
    </div>
  );
}
