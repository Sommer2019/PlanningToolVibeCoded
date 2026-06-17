import { NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { api } from "../api";
import type { Membership, Project, Status } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { useAsync } from "../hooks/useAsync";
import { Spinner, ErrorBanner } from "../components/Feedback";

export interface ProjectCtx {
  project: Project;
  statuses: Status[];
  members: Membership[];
  isOwnerOrAdmin: boolean;
  reload: () => void;
}

export function useProjectCtx(): ProjectCtx {
  return useOutletContext<ProjectCtx>();
}

const tabs = [
  { to: "board", key: "nav.board" },
  { to: "roadmap", key: "nav.roadmap" },
  { to: "tasklist", key: "nav.tasklist" },
  { to: "calendar", key: "nav.calendar" },
  { to: "leaderboard", key: "nav.leaderboard" },
  { to: "members", key: "nav.members" },
];

export function ProjectLayout() {
  const { projectId = "" } = useParams();
  const { me } = useAuth();
  const { t } = useI18n();

  const { data, loading, error, reload } = useAsync(async () => {
    const [project, statuses, members] = await Promise.all([
      api.getProject(projectId),
      api.listStatuses(projectId),
      api.listMembers(projectId),
    ]);
    return { project, statuses, members };
  }, [projectId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!data) return null;

  const isOwnerOrAdmin = Boolean(me?.admin) || data.project.createdBy === me?.subject;
  const ctx: ProjectCtx = { ...data, isOwnerOrAdmin, reload };

  return (
    <div className="col">
      <div className="row wrap">
        <h2 style={{ margin: 0 }}>{data.project.name}</h2>
        {data.project.description && <span className="muted">{data.project.description}</span>}
      </div>
      <nav className="app-nav">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to}>
            {t(tab.key)}
          </NavLink>
        ))}
      </nav>
      <Outlet context={ctx} />
    </div>
  );
}
