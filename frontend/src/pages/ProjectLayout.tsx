import { NavLink, Outlet, useOutletContext, useParams } from "react-router-dom";
import { api } from "../api";
import type { Membership, Project, Status } from "../api";
import { useAuth } from "../auth/AuthContext";
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
  { to: "board", label: "Board" },
  { to: "roadmap", label: "Roadmap" },
  { to: "tasklist", label: "Tasklist" },
  { to: "calendar", label: "Calendar" },
  { to: "members", label: "Members" },
];

export function ProjectLayout() {
  const { projectId = "" } = useParams();
  const { me } = useAuth();

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
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet context={ctx} />
    </div>
  );
}
