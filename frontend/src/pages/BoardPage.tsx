import { useEffect, useState } from "react";
import { api } from "../api";
import type { BoardScope, Task } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useProjectCtx } from "./ProjectLayout";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { statusColor } from "../util/statusColor";
import { formatDate } from "../util/format";

export function BoardPage() {
  const { project, statuses, members, isOwnerOrAdmin } = useProjectCtx();
  const { me } = useAuth();
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

  async function remove(t: Task) {
    if (!confirm(`Delete task "${t.title}"?`)) return;
    try {
      await api.deleteTask(t.id);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="col">
      <div className="toolbar">
        <strong>{scope === "me" ? "My tasks" : "All tasks"}</strong>
        {isOwnerOrAdmin && (
          <select
            style={{ width: "auto" }}
            value={scope}
            onChange={(e) => setScope(e.target.value as BoardScope)}
          >
            <option value="me">My tasks</option>
            <option value="all">All tasks (owner/admin)</option>
          </select>
        )}
        <span className="spacer" />
        <button onClick={() => setCreating(true)}>+ New task</button>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <Empty message="No tasks on this board yet." />
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
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`card${dragId === t.id ? " dragging" : ""}`}
                    draggable={canEdit(t)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", t.id);
                      setDragId(t.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                  >
                    <h3>
                      {t.locked && <span title="Locked">🔒 </span>}
                      {t.title}
                    </h3>
                    <small className="muted">
                      {t.assignee} · {formatDate(t.plannedStart)} – {formatDate(t.plannedEnd)}
                    </small>
                    <div className="row" style={{ marginTop: "var(--space-2)" }}>
                      <button
                        data-variant="ghost"
                        disabled={!canEdit(t)}
                        onClick={() => setEditing(t)}
                      >
                        Edit
                      </button>
                      {isOwnerOrAdmin && (
                        <button data-variant="ghost" onClick={() => toggleLock(t)}>
                          {t.locked ? "Unlock" : "Lock"}
                        </button>
                      )}
                      {(me?.admin || t.createdBy === me?.subject) && (
                        <button data-variant="ghost" onClick={() => remove(t)}>
                          Delete
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
