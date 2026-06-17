import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";

/** Dev/demo identity switcher (only shown when mock identities are available). */
export function UserSwitcher() {
  const { me, mockUsers, devSwitcher, activeUser, switchUser, logout } = useAuth();
  const { t } = useI18n();

  if (!devSwitcher) {
    return me ? (
      <div className="row" style={{ alignItems: "center", gap: "var(--space-2)" }}>
        <span className="badge">{me.displayName ?? me.subject}</span>
        <button data-variant="secondary" onClick={logout} style={{ padding: "4px 8px", fontSize: "var(--font-size-sm)" }}>
          Logout
        </button>
      </div>
    ) : null;
  }

  return (
    <label className="row" style={{ margin: 0, gap: "var(--space-2)" }} title={t("common.actingAs")}>
      <span className="muted">{t("common.actingAs")}</span>
      <select
        style={{ width: "auto" }}
        value={activeUser}
        onChange={(e) => switchUser(e.target.value)}
      >
        {mockUsers.map((u) => (
          <option key={u.subject} value={u.subject}>
            {u.displayName ?? u.subject}
            {u.admin ? " (admin)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
