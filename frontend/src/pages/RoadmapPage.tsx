import { useMemo, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { useProjectCtx } from "./ProjectLayout";
import { useAsync } from "../hooks/useAsync";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { statusColor } from "../util/statusColor";
import { formatDate, getLocale } from "../util/format";
import { TaskPopover } from "../components/TaskPopover";
import { TaskFormDialog } from "../components/TaskFormDialog";
import type { Task } from "../api";

const MONTHS_VISIBLE = 3;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function RoadmapPage() {
  const { project, statuses, members } = useProjectCtx();
  const { t } = useI18n();
  const { data, loading, error, reload } = useAsync(() => api.listProjectTasks(project.id), [project.id]);
  const [view, setView] = useState(() => startOfMonth(new Date()));
  const [popoverTask, setPopoverTask] = useState<{ task: Task; pos: { x: number; y: number } } | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const locale = getLocale();

  const statusName = useMemo(
    () => new Map(statuses.map((s) => [s.id, s.name])),
    [statuses],
  );

  const windowStart = startOfMonth(view);
  const windowEnd = addMonths(windowStart, MONTHS_VISIBLE);
  const totalMs = windowEnd.getTime() - windowStart.getTime();

  const months = Array.from({ length: MONTHS_VISIBLE }, (_, i) => addMonths(windowStart, i));

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  const tasks = (data ?? []).slice().sort((a, b) => a.plannedStart.localeCompare(b.plannedStart));

  return (
    <div className="col">
      <div className="toolbar">
        <button data-variant="secondary" onClick={() => setView((v) => addMonths(v, -1))}>
          {t("common.prev")}
        </button>
        <strong>
          {windowStart.toLocaleDateString(locale, { month: "long", year: "numeric" })} –{" "}
          {addMonths(windowStart, MONTHS_VISIBLE - 1).toLocaleDateString(locale, {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <button data-variant="secondary" onClick={() => setView((v) => addMonths(v, 1))}>
          {t("common.next")}
        </button>
        <span className="spacer" />
        <button data-variant="ghost" onClick={() => setView(startOfMonth(new Date()))}>
          {t("common.today")}
        </button>
      </div>

      {tasks.length === 0 ? (
        <Empty message={t("roadmap.empty")} />
      ) : (
        <div className="timeline">
          <div className="timeline-axis">
            <span className="muted">{t("roadmap.task")}</span>
            <div className="timeline-months">
              {months.map((m) => (
                <span className="timeline-month" key={m.toISOString()}>
                  {m.toLocaleDateString(locale, { month: "short", year: "2-digit" })}
                </span>
              ))}
            </div>
          </div>

          {tasks.map((task) => {
            const start = new Date(task.plannedStart).getTime();
            const end = new Date(task.plannedEnd).getTime();
            const s = Math.max(start, windowStart.getTime());
            const e = Math.min(end, windowEnd.getTime());
            const visible = e > windowStart.getTime() && s < windowEnd.getTime();
            const left = ((s - windowStart.getTime()) / totalMs) * 100;
            const width = Math.max(((e - s) / totalMs) * 100, 1.5);
            return (
              <div className="timeline-row" key={task.id}>
                <div className="col" style={{ gap: 0 }}>
                  <span>{task.title}</span>
                  <small className="muted">{task.assignee}</small>
                </div>
                <div className="timeline-track">
                  {visible ? (
                    <div
                      className="timeline-bar"
                      onClick={(e) => setPopoverTask({ task, pos: { x: e.clientX, y: e.clientY } })}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: statusColor(statusName.get(task.statusId) ?? ""),
                        cursor: "pointer"
                      }}
                      title={`${task.title}: ${formatDate(task.plannedStart)} – ${formatDate(task.plannedEnd)}`}
                    >
                      {task.title}
                    </div>
                  ) : (
                    <span className="muted" style={{ paddingLeft: 8, fontSize: 12 }}>
                      {t("roadmap.outside")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {popoverTask && (
        <TaskPopover
          task={popoverTask.task}
          pos={popoverTask.pos}
          onClose={() => setPopoverTask(null)}
          onEdit={() => {
            setPopoverTask(null);
            setEditing(popoverTask.task);
          }}
        />
      )}

      <TaskFormDialog
        open={editing !== null}
        projectId={project.id}
        statuses={statuses}
        members={members}
        task={editing}
        onClose={() => setEditing(null)}
        onSaved={reload}
      />
    </div>
  );
}
