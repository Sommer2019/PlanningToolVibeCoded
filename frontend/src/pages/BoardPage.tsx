import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Task } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n/I18nContext";
import { useProjectCtx } from "./ProjectLayout";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { TaskPopover } from "../components/TaskPopover";
import { statusColor } from "../util/statusColor";
import { formatDate } from "../util/format";
import { userColor } from "../util/userColor";

// Special filter values; any other value is a concrete assignee userRef.
const MINE = "__mine__";
const ALL = "__all__";

export function BoardPage() {
  const { project, statuses, members, isOwnerOrAdmin, reload: reloadProject } = useProjectCtx();
  const { me } = useAuth();
  const { t } = useI18n();
  const [filter, setFilter] = useState<string[]>([ALL]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [popoverTask, setPopoverTask] = useState<{ task: Task; pos: { x: number; y: number } } | null>(null);
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
  const otherMembers = memberRefs.filter((m) => m !== me?.subject);

  const shown = useMemo(() => {
    if (filter.includes(ALL)) return tasks;
    return tasks.filter((t) => {
      if (filter.includes(MINE) && t.assignee === me?.subject) return true;
      if (t.assignee && filter.includes(t.assignee)) return true;
      return false;
    });
  }, [tasks, filter, me]);

  const handleFilterClick = (val: string, multi: boolean) => {
    if (val === ALL) {
      setFilter([ALL]);
      return;
    }
    let next = [...filter];
    if (next.includes(ALL)) {
      if (multi) {
        next = [MINE, ...otherMembers].filter((x) => x !== val);
      } else {
        next = [val];
      }
    } else {
      if (multi) {
        if (next.includes(val)) {
          next = next.filter((x) => x !== val);
        } else {
          next.push(val);
        }
      } else {
        next = [val];
      }
    }
    const allPossible = [MINE, ...otherMembers];
    const isAll = allPossible.length > 0 && allPossible.every((x) => next.includes(x));
    if (next.length === 0 || isAll) {
      setFilter([ALL]);
    } else {
      setFilter(next);
    }
  };

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
            data-variant={filter.includes(ALL) ? "primary" : "ghost"}
            onClick={(e) => handleFilterClick(ALL, e.ctrlKey || e.metaKey)}
            style={{ borderRadius: "var(--radius-lg)", padding: "4px 12px", border: "1px solid var(--border-color)" }}
          >
            {t("board.filter.all")}
          </button>
          <button
            data-variant={filter.includes(MINE) ? "primary" : "ghost"}
            onClick={(e) => handleFilterClick(MINE, e.ctrlKey || e.metaKey)}
            style={{ borderRadius: "var(--radius-lg)", padding: "4px 12px", border: "1px solid var(--border-color)" }}
          >
            {t("board.filter.mine")}
          </button>
          {otherMembers.map((m) => {
            const isSelected = filter.includes(m);
            return (
              <button
                key={m}
                onClick={(e) => handleFilterClick(m, e.ctrlKey || e.metaKey)}
                style={{
                  borderRadius: "var(--radius-lg)",
                  padding: "4px 12px",
                  border: isSelected ? `2px solid var(--color-primary)` : "1px solid var(--border-color)",
                  backgroundColor: userColor(m),
                  color: "var(--color-text)",
                  cursor: "pointer",
                  opacity: isSelected || filter.includes(ALL) ? 1 : 0.6
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
                    onClick={(e) => setPopoverTask({ task, pos: { x: e.clientX, y: e.clientY } })}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(task);
                          setPopoverTask(null);
                        }}
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
          {me?.admin && (
            <section 
              className="board-column" 
              style={{ 
                background: "transparent", 
                border: "2px dashed var(--color-border)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                cursor: "pointer",
                color: "var(--color-text-muted)"
              }} 
              onClick={async () => {
                const name = prompt(t("board.newStatusPrompt") || "Neuer Status:");
                if (name) {
                  try {
                    await api.createStatus(name, project.id, statuses.length);
                    reloadProject();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  }
                }
              }}
            >
              + {t("board.addStatus") || "Status hinzufügen"}
            </section>
          )}
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
      {popoverTask && (
        <TaskPopover
          task={popoverTask.task}
          pos={popoverTask.pos}
          onClose={() => setPopoverTask(null)}
          onEdit={() => {
            setPopoverTask(null);
            setEditing(popoverTask.task);
          }}
          onStatusChange={load}
        />
      )}
    </div>
  );
}
