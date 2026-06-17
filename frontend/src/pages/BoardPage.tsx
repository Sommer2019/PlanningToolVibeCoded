import { useEffect, useState } from "react";
import { api } from "../api";
import type { BoardScope, Task } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { useProjectCtx } from "./ProjectLayout";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { statusColor } from "../util/statusColor";
import { formatDate } from "../util/format";

export function BoardPage() {
  const { project, statuses, members, isOwnerOrAdmin } = useProjectCtx();
  const { me } = useAuth();
  const { t } = useI18n();
  const [scope, setScope] = useState<BoardScope>("me");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTasks(await api.getBoard(project.id, scope));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, scope]);

  function canEdit(t: Task): boolean {
    return !t.locked || Boolean(me?.admin) || t.createdBy === me?.subject;
  }

  async function moveTo(taskId: string, statusId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.statusId === statusId) return;
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, statusId } : t)));
    try {
      await api.updateTaskStatus(taskId, statusId);
    } catch (e) {
      setTasks(prev); // revert
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
        <strong>{scope === "me" ? t("board.myTasks") : t("board.allTasks")}</strong>
        {isOwnerOrAdmin && (
          <select
            style={{ width: "auto" }}
            value={scope}
            onChange={(e) => setScope(e.target.value as BoardScope)}
          >
            <option value="me">{t("board.myTasks")}</option>
            <option value="all">{t("board.allTasksOption")}</option>
          </select>
        )}
        <span className="spacer" />
        <button onClick={() => setCreating(true)}>{t("board.newTask")}</button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <Empty message={t("board.empty")} />
      ) : (
        <div className="board">
          {statuses.map((s) => {
            const colTasks = tasks.filter((t) => t.statusId === s.id);
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
                  if (id) void moveTo(id, s.id);
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
