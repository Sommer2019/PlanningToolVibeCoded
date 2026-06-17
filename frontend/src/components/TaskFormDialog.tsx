import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";
import type { Membership, Status, Task, TaskInput } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { Modal } from "./Modal";
import { ErrorBanner } from "./Feedback";
import { fromLocalInput, toLocalInput } from "../util/format";

interface Props {
  open: boolean;
  projectId: string;
  statuses: Status[];
  members: Membership[];
  task?: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

function defaultStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalInput(d.toISOString());
}
function defaultEnd(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return toLocalInput(d.toISOString());
}

export function TaskFormDialog({ open, projectId, statuses, members, task, onClose, onSaved }: Props) {
  const { t } = useI18n();
  const memberRefs = members.filter((m) => m.status === "MEMBER").map((m) => m.userRef);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [statusId, setStatusId] = useState("");
  const [plannedStart, setPlannedStart] = useState(defaultStart());
  const [plannedEnd, setPlannedEnd] = useState(defaultEnd());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset form whenever opened (or the edited task changes).
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setAssignee(task.assignee ?? "");
      setStatusId(task.statusId);
      setPlannedStart(toLocalInput(task.plannedStart));
      setPlannedEnd(toLocalInput(task.plannedEnd));
    } else {
      setTitle("");
      setDescription("");
      setAssignee("");
      setStatusId(statuses[0]?.id ?? "");
      setPlannedStart(defaultStart());
      setPlannedEnd(defaultEnd());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !statusId) {
      setError(t("task.form.errRequired"));
      return;
    }
    if (new Date(plannedEnd) < new Date(plannedStart)) {
      setError(t("task.form.errDates"));
      return;
    }
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim() || null,
      assignee: assignee || null,
      statusId,
      plannedStart: fromLocalInput(plannedStart),
      plannedEnd: fromLocalInput(plannedEnd),
    };
    setSaving(true);
    try {
      if (task) await api.updateTask(task.id, input);
      else await api.createTask(projectId, input);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={task ? t("task.form.titleEdit") : t("task.form.titleNew")} onClose={onClose}>
      <form onSubmit={submit} className="col">
        {error && <ErrorBanner message={error} />}
        <fieldset>
          <label htmlFor="t-title">{t("task.form.title")}</label>
          <input id="t-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </fieldset>
        <fieldset>
          <label htmlFor="t-desc">{t("task.form.description")}</label>
          <textarea
            id="t-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </fieldset>
        <div className="row wrap">
          <fieldset style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="t-assignee">{t("task.form.assignee")}</label>
            <select id="t-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">{t("task.form.noAssignee")}</option>
              {memberRefs.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </fieldset>
          <fieldset style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="t-status">{t("task.form.status")}</label>
            <select id="t-status" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </fieldset>
        </div>
        <div className="row wrap">
          <fieldset style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="t-start">{t("task.form.plannedStart")}</label>
            <input
              id="t-start"
              type="datetime-local"
              required
              value={plannedStart}
              onChange={(e) => setPlannedStart(e.target.value)}
            />
          </fieldset>
          <fieldset style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="t-end">{t("task.form.plannedEnd")}</label>
            <input
              id="t-end"
              type="datetime-local"
              required
              value={plannedEnd}
              onChange={(e) => setPlannedEnd(e.target.value)}
            />
          </fieldset>
        </div>
        <div className="actions">
          <button type="button" data-variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="submit" disabled={saving}>
            {task ? t("common.save") : t("common.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
