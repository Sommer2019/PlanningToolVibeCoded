import { useEffect, useRef } from "react";
import type { Task } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { userColor } from "../util/userColor";
import { statusColor } from "../util/statusColor";
import { useProjectCtx } from "../pages/ProjectLayout";
import { useAuth } from "../auth/AuthContext";

interface Props {
  task: Task;
  pos: { x: number; y: number };
  onClose: () => void;
  onEdit?: () => void;
}

export function TaskPopover({ task, pos, onClose, onEdit }: Props) {
  const { t } = useI18n();
  const { statuses } = useProjectCtx();
  const { me } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const statusName = statuses.find((s) => s.id === task.statusId)?.name || "";
  const canEditTask = !task.locked || Boolean(me?.admin) || task.createdBy === me?.subject;

  return (
    <div
      ref={ref}
      className="card"
      style={{
        position: "fixed",
        top: Math.min(pos.y, window.innerHeight - 300),
        left: Math.min(pos.x, window.innerWidth - 300),
        width: 300,
        zIndex: 1000,
        boxShadow: "var(--shadow-md)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ margin: 0, fontSize: "var(--font-size-lg)" }}>{task.title}</h3>
        <button data-variant="ghost" onClick={onClose} style={{ padding: "4px 8px" }}>
          ✕
        </button>
      </div>

      <div className="row" style={{ alignItems: "center", gap: "var(--space-2)" }}>
        <span className="dot" style={{ background: statusColor(statusName) }} />
        <span>{statusName}</span>
      </div>

      <div className="row" style={{ alignItems: "center", gap: "var(--space-2)" }}>
        <span
          className="badge"
          style={{ backgroundColor: userColor(task.assignee), color: "var(--color-text)" }}
        >
          {task.assignee || t("task.form.noAssignee")}
        </span>
      </div>

      <div className="text-main muted" style={{ fontSize: "var(--font-size-sm)" }}>
        {new Date(task.plannedStart).toLocaleDateString()} – {new Date(task.plannedEnd).toLocaleDateString()}
      </div>

      {task.description && (
        <div style={{ marginTop: "var(--space-2)", whiteSpace: "pre-wrap", fontSize: "var(--font-size-sm)" }}>
          {task.description}
        </div>
      )}

      {onEdit && canEditTask && (
        <div style={{ marginTop: "var(--space-3)", textAlign: "right" }}>
          <button onClick={onEdit}>{t("task.form.titleEdit")}</button>
        </div>
      )}
    </div>
  );
}
