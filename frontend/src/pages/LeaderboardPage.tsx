import { useProjectCtx } from "./ProjectLayout";
import { useI18n } from "../i18n/I18nContext";
import { useAsync } from "../hooks/useAsync";
import { api } from "../api";
import { Spinner, ErrorBanner } from "../components/Feedback";
import { userColor } from "../util/userColor";

export function LeaderboardPage() {
  const { project } = useProjectCtx();
  const { t } = useI18n();

  const { data: leaderboard, loading, error } = useAsync(
    () => api.getLeaderboard(project.id),
    [project.id],
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!leaderboard) return null;

  // Enhance leaderboard with display names if available
  const enhanced = leaderboard.map(entry => {
    return { ...entry, displayName: entry.userRef };
  });

  return (
    <div className="col">
      <div className="toolbar">
        <h2>{t("leaderboard.title")}</h2>
      </div>

      {enhanced.length === 0 ? (
        <div className="text-main muted">{t("leaderboard.empty")}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>{t("leaderboard.rank")}</th>
              <th>{t("leaderboard.employee")}</th>
              <th>{t("leaderboard.completedTasks")}</th>
              <th>{t("leaderboard.score")}</th>
            </tr>
          </thead>
          <tbody>
            {enhanced.map((entry, index) => (
              <tr key={entry.userRef}>
                <td>
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && index + 1}
                </td>
                <td>
                  <span
                    className="badge"
                    style={{ backgroundColor: userColor(entry.userRef), color: "var(--color-text)" }}
                  >
                    {entry.displayName}
                  </span>
                </td>
                <td>{entry.completedTasks}</td>
                <td>
                  <strong>{entry.score}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
