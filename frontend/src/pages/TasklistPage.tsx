import { useMemo, useState } from "react";
import { api } from "../api";
import type { Task } from "../api";
import { useProjectCtx } from "./ProjectLayout";
import { useI18n } from "../i18n/I18nContext";
import { useAsync } from "../hooks/useAsync";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { formatDate } from "../util/format";

type SortKey = "title" | "assignee" | "status" | "plannedStart" | "plannedEnd";

export function TasklistPage() {
  const { project, statuses, members } = useProjectCtx();
  const { t } = useI18n();
  const { data, loading, error, reload } = useAsync(
    () => api.listProjectTasks(project.id),
    [project.id],
  );
  const [assignee, setAssignee] = useState("");
  const [statusId, setStatusId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("plannedStart");
  const [asc, setAsc] = useState(true);
  const [editing, setEditing] = useState<Task | null>(null);

  const statusName = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);

  const rows = useMemo(() => {
    let list = (data ?? []).slice();
    if (assignee) list = list.filter((t) => t.assignee === assignee);
    if (statusId) list = list.filter((t) => t.statusId === statusId);
    if (from) list = list.filter((t) => t.plannedEnd >= new Date(from).toISOString());
    if (to) list = list.filter((t) => t.plannedStart <= new Date(to + "T23:59:59").toISOString());

    const dir = asc ? 1 : -1;
    list.sort((a, b) => {
      const av = sortKey === "status" ? statusName.get(a.statusId) ?? "" : a[sortKey];
      const bv = sortKey === "status" ? statusName.get(b.statusId) ?? "" : b[sortKey];
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [data, assignee, statusId, from, to, sortKey, asc, statusName]);

  function toggleSort(k: SortKey) {
    if (k === sortKey) setAsc((a) => !a);
    else {
      setSortKey(k);
      setAsc(true);
    }
  }

  const arrow = (k: SortKey) => (k === sortKey ? (asc ? " ▲" : " ▼") : "");
  const memberRefs = members.filter((m) => m.status === "MEMBER").map((m) => m.userRef);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="col">
      <div className="toolbar">
        <label className="row" style={{ margin: 0 }}>
          <span className="muted">{t("tasklist.assignee")}</span>
          <select style={{ width: "auto" }} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {memberRefs.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="row" style={{ margin: 0 }}>
          <span className="muted">{t("tasklist.status")}</span>
          <select style={{ width: "auto" }} value={statusId} onChange={(e) => setStatusId(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="row" style={{ margin: 0 }}>
          <span className="muted">{t("tasklist.from")}</span>
          <input style={{ width: "auto" }} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="row" style={{ margin: 0 }}>
          <span className="muted">{t("tasklist.to")}</span>
          <input style={{ width: "auto" }} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {rows.length === 0 ? (
        <Empty message={t("tasklist.empty")} />
      ) : (
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort("title")}>{t("tasklist.colTitle")}{arrow("title")}</th>
              <th onClick={() => toggleSort("assignee")}>{t("tasklist.assignee")}{arrow("assignee")}</th>
              <th onClick={() => toggleSort("status")}>{t("tasklist.status")}{arrow("status")}</th>
              <th onClick={() => toggleSort("plannedStart")}>{t("tasklist.colStart")}{arrow("plannedStart")}</th>
              <th onClick={() => toggleSort("plannedEnd")}>{t("tasklist.colEnd")}{arrow("plannedEnd")}</th>
              <th>{t("common.edit")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr key={task.id}>
                <td>
                  {task.locked && <span title={t("board.locked")}>🔒 </span>}
                  {task.title}
                </td>
                <td>{task.assignee}</td>
                <td>{statusName.get(task.statusId) ?? "—"}</td>
                <td>{formatDate(task.plannedStart)}</td>
                <td>{formatDate(task.plannedEnd)}</td>
                <td>
                  <button data-variant="ghost" onClick={() => setEditing(task)}>
                    {t("common.edit")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
