import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Task } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { useProjectCtx } from "./ProjectLayout";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { statusColor } from "../util/statusColor";
import { formatDate } from "../util/format";
import { userColor } from "../util/userColor";

// Special filter values; any other value is a concrete assignee userRef.
const MINE = "__mine__";
const ALL = "__all__";

export function BoardPage() {
  const { project, statuses, members, isOwnerOrAdmin } = useProjectCtx();
  const { me } = useAuth();
  const { t } = useI18n();
  const [filter, setFilter] = useState<string>(ALL);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  // Any project member may see all tasks of the project (then filter client-side).
  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTasks(await api.listProjectTasks(project.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const memberRefs = members.filter((m) => m.status === "MEMBER").map((m) => m.userRef);

  const shown = useMemo(() => {
    if (filter === ALL) return tasks;
    if (filter === MINE) return tasks.filter((t) => t.assignee === me?.subject);
    return tasks.filter((t) => t.assignee === filter);
  }, [tasks, filter, me]);

  function canEdit(t: Task): boolean {
    return !t.locked || Boolean(me?.admin) || t.createdBy === me?.subject;
  }

  async function moveTo(taskId: string, statusId: string, statusName: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.statusId === statusId) return;
    
    let newAssignee = task.assignee;
    if (statusName.toLowerCase().includes("progress") && me?.subject) {
      newAssignee = me.subject;
    }

    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, statusId, assignee: newAssignee } : t)));
    try {
      if (newAssignee !== task.assignee) {
        await api.updateTask(taskId, {
          title: task.title,
          description: task.description,
          assignee: newAssignee,
          statusId,
          plannedStart: task.plannedStart,
          plannedEnd: task.plannedEnd,
          actualStart: task.actualStart,
          actualEnd: task.actualEnd,
        });
      } else {
        await api.updateTaskStatus(taskId, statusId);
      }
    } catch (e) {
      setTasks(prev);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function toggleLock(t: Task) {
    try {
      await api.setTaskLocked(t.id, !t.locked);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(task: Task) {
    if (!confirm(t("board.confirmDelete", { title: task.title }))) return;
    try {
      await api.deleteTask(task.id);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="col">
      <div className="toolbar">
        <div className="row wrap" style={{ gap: "var(--space-2)", alignItems: "center" }}>
          <span className="muted" style={{ marginRight: "var(--space-2)" }}>{t("board.filter.label")}</span>
          <button
            data-variant={filter === ALL ? "primary" : "ghost"}
            onClick={() => setFilter(ALL)}
            style={{ borderRadius: "var(--radius-lg)", padding: "4px 12px", border: "1px solid var(--border-color)" }}
          >
            {t("board.filter.all")}
          </button>
          <button
            data-variant={filter === MINE ? "primary" : "ghost"}
            onClick={() => setFilter(MINE)}
            style={{ borderRadius: "var(--radius-lg)", padding: "4px 12px", border: "1px solid var(--border-color)" }}
          >
            {t("board.filter.mine")}
          </button>
          {memberRefs.map((m) => {
            const isSelected = filter === m;
            return (
              <button
                key={m}
                onClick={() => setFilter(m)}
                style={{
                  borderRadius: "var(--radius-lg)",
                  padding: "4px 12px",
                  border: isSelected ? `2px solid var(--color-primary)` : "1px solid var(--border-color)",
                  backgroundColor: userColor(m),
                  color: "var(--color-text)",
                  cursor: "pointer"
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
        <span className="spacer" />
        <button onClick={() => setCreating(true)}>{t("board.newTask")}</button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <Empty message={t("board.empty")} />
      ) : (
        <div className="board">
          {statuses.map((s) => {
            const colTasks = shown.filter((t) => t.statusId === s.id);
            return (
              <section
                key={s.id}
                className={`board-column${dragOver === s.id ? " drag-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(s.id);
                }}
                onDragLeave={() => setDragOver((d) => (d === s.id ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) void moveTo(id, s.id, s.name);
                }}
              >
                <header>
                  <span className="dot" style={{ background: statusColor(s.name) }} />
                  {s.name}
                  <span className="spacer" />
                  <span className="badge">{colTasks.length}</span>
                </header>
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`card${dragId === task.id ? " dragging" : ""}`}
                    draggable={canEdit(task)}
                    style={{ backgroundColor: userColor(task.assignee) }}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", task.id);
                      setDragId(task.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                  >
                    <h3>
                      {task.locked && <span title={t("board.locked")}>🔒 </span>}
                      {task.title}
                    </h3>
                    <small className="muted">
                      {task.assignee} · {formatDate(task.plannedStart)} – {formatDate(task.plannedEnd)}
                    </small>
                    <div className="row" style={{ marginTop: "var(--space-2)" }}>
                      <button
                        data-variant="ghost"
                        disabled={!canEdit(task)}
                        onClick={() => setEditing(task)}
                      >
                        {t("common.edit")}
                      </button>
                      {isOwnerOrAdmin && (
                        <button data-variant="ghost" onClick={() => toggleLock(task)}>
                          {task.locked ? t("board.unlock") : t("board.lock")}
                        </button>
                      )}
                      {(me?.admin || task.createdBy === me?.subject) && (
                        <button data-variant="ghost" onClick={() => remove(task)}>
                          {t("common.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}

      <TaskFormDialog
        open={creating || editing !== null}
        projectId={project.id}
        statuses={statuses}
        members={members}
        task={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={load}
      />
    </div>
  );
}
