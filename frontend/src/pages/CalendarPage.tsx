import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";
import type { CalendarEntry, Task } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { useProjectCtx } from "./ProjectLayout";
import { useAsync } from "../hooks/useAsync";
import { Spinner, ErrorBanner } from "../components/Feedback";
import { Modal } from "../components/Modal";
import { TaskPopover } from "../components/TaskPopover";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { addDays, fromLocalInput, getLocale, sameDay, startOfDay, toLocalInput } from "../util/format";

interface DayEvent {
  label: string;
  kind: "task" | "entry";
  task?: Task;
  isStart?: boolean;
  isEnd?: boolean;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Localized short weekday names, Sunday-first (1 Jan 2023 was a Sunday).
function weekdayNames(locale: string): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2023, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" }),
  );
}

export function CalendarPage() {
  const { project, statuses, members } = useProjectCtx();
  const { t } = useI18n();
  const locale = getLocale();
  const WEEKDAYS = weekdayNames(locale);
  const { data, loading, error, reload } = useAsync(async () => {
    const [tasks, entries] = await Promise.all([
      api.listProjectTasks(project.id),
      api.listCalendarEntries(project.id),
    ]);
    return { tasks, entries };
  }, [project.id]);

  const [view, setView] = useState(() => startOfMonth(new Date()));
  const [adding, setAdding] = useState(false);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [feedErr, setFeedErr] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [popoverTask, setPopoverTask] = useState<{ task: Task; pos: { x: number; y: number } } | null>(null);

  const grid = useMemo(() => {
    const first = startOfMonth(view);
    const gridStart = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [view]);

  function eventsFor(day: Date): DayEvent[] {
    if (!data) return [];
    const d0 = startOfDay(day);
    const events: DayEvent[] = [];
    for (const t of data.tasks as Task[]) {
      const start = startOfDay(new Date(t.plannedStart));
      const end = startOfDay(new Date(t.plannedEnd));
      if (d0 >= start && d0 <= end) {
        events.push({ label: t.title, kind: "task", task: t, isStart: sameDay(d0, start), isEnd: sameDay(d0, end) });
      }
    }
    for (const e of data.entries as CalendarEntry[]) {
      const start = startOfDay(new Date(e.start));
      const end = startOfDay(new Date(e.end));
      if (d0 >= start && d0 <= end) {
        events.push({ label: e.title, kind: "entry", isStart: sameDay(d0, start), isEnd: sameDay(d0, end) });
      }
    }
    return events;
  }

  async function getFeed(projectScoped: boolean) {
    setFeedErr(null);
    try {
      const token = await api.createFeedToken(projectScoped ? project.id : null);
      setFeedUrl(api.feedUrl(token.feedPath));
    } catch (e) {
      setFeedErr(e instanceof Error ? e.message : String(e));
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  const today = new Date();

  return (
    <div className="col">
      <div className="toolbar">
        <button data-variant="secondary" onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}>
          {t("common.prev")}
        </button>
        <strong>{view.toLocaleDateString(locale, { month: "long", year: "numeric" })}</strong>
        <button data-variant="secondary" onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}>
          {t("common.next")}
        </button>
        <button data-variant="ghost" onClick={() => setView(startOfMonth(new Date()))}>
          {t("common.today")}
        </button>
        <span className="spacer" />
        <button onClick={() => setAdding(true)}>{t("calendar.entry.new")}</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div className="calendar-weekday" key={w}>
            {w}
          </div>
        ))}
        {grid.map((day) => {
          const events = eventsFor(day);
          const otherMonth = day.getMonth() !== view.getMonth();
          return (
            <div
              key={day.toISOString()}
              className={`calendar-cell${otherMonth ? " other-month" : ""}${
                sameDay(day, today) ? " today" : ""
              }`}
            >
              <span className="calendar-daynum">{day.getDate()}</span>
              {events.slice(0, 3).map((ev, i) => (
                <span 
                  className="calendar-event" 
                  data-kind={ev.kind} 
                  key={i} 
                  title={ev.label}
                  onClick={(e) => {
                    if (ev.kind === "task" && ev.task) {
                      e.stopPropagation();
                      setPopoverTask({ task: ev.task, pos: { x: e.clientX, y: e.clientY } });
                    }
                  }}
                  style={{ 
                    cursor: ev.kind === "task" ? "pointer" : "default",
                    marginLeft: ev.isStart ? undefined : '-9px',
                    marginRight: ev.isEnd ? undefined : '-9px',
                    paddingLeft: ev.isStart ? undefined : '9px',
                    paddingRight: ev.isEnd ? undefined : '9px',
                    borderTopLeftRadius: ev.isStart ? undefined : 0,
                    borderBottomLeftRadius: ev.isStart ? undefined : 0,
                    borderTopRightRadius: ev.isEnd ? undefined : 0,
                    borderBottomRightRadius: ev.isEnd ? undefined : 0,
                    marginBottom: '1px'
                  }}
                >
                  {ev.label}
                </span>
              ))}
              {events.length > 3 && <small>{t("calendar.more", { n: events.length - 3 })}</small>}
            </div>
          );
        })}
      </div>

      <article className="col">
        <h3 style={{ margin: 0 }}>{t("calendar.subscribe.title")}</h3>
        <small className="muted">{t("calendar.subscribe.hint")}</small>
        <div className="row wrap">
          <button data-variant="secondary" onClick={() => getFeed(true)}>
            {t("calendar.subscribe.project")}
          </button>
          <button data-variant="secondary" onClick={() => getFeed(false)}>
            {t("calendar.subscribe.personal")}
          </button>
        </div>
        {feedErr && <ErrorBanner message={feedErr} />}
        {feedUrl && (
          <div className="row wrap">
            <input readOnly value={feedUrl} onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, minWidth: 280 }} />
            <button
              data-variant="ghost"
              onClick={() => navigator.clipboard?.writeText(feedUrl)}
            >
              {t("common.copy")}
            </button>
          </div>
        )}
      </article>

      <EntryDialog
        open={adding}
        projectId={project.id}
        onClose={() => setAdding(false)}
        onSaved={reload}
      />

      {popoverTask && (
        <TaskPopover
          task={popoverTask.task}
          pos={popoverTask.pos}
          onClose={() => setPopoverTask(null)}
          onEdit={() => {
            setPopoverTask(null);
            setEditingTask(popoverTask.task);
          }}
          onStatusChange={reload}
        />
      )}

      <TaskFormDialog
        open={editingTask !== null}
        projectId={project.id}
        statuses={statuses}
        members={members}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSaved={reload}
      />
    </div>
  );
}

function EntryDialog({
  open,
  projectId,
  onClose,
  onSaved,
}: {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(() => toLocalInput(new Date().toISOString()));
  const [end, setEnd] = useState(() => toLocalInput(new Date(Date.now() + 3600_000).toISOString()));
  const [scopeProject, setScopeProject] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError(t("calendar.entry.errTitle"));
      return;
    }
    if (new Date(end) < new Date(start)) {
      setError(t("calendar.entry.errDates"));
      return;
    }
    try {
      await api.createCalendarEntry({
        title: title.trim(),
        description: description || null,
        start: fromLocalInput(start),
        end: fromLocalInput(end),
        projectId: scopeProject ? projectId : null,
      });
      setTitle("");
      setDescription("");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={open} title={t("calendar.entry.titleNew")} onClose={onClose}>
      <form onSubmit={submit} className="col">
        {error && <ErrorBanner message={error} />}
        <fieldset>
          <label htmlFor="e-title">{t("calendar.entry.title")}</label>
          <input id="e-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </fieldset>
        <fieldset>
          <label htmlFor="e-desc">{t("calendar.entry.description")}</label>
          <textarea id="e-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </fieldset>
        <div className="row wrap">
          <fieldset style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="e-start">{t("calendar.entry.start")}</label>
            <input id="e-start" type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
          </fieldset>
          <fieldset style={{ flex: 1, minWidth: 180 }}>
            <label htmlFor="e-end">{t("calendar.entry.end")}</label>
            <input id="e-end" type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} />
          </fieldset>
        </div>
        <label className="row" style={{ margin: 0 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={scopeProject}
            onChange={(e) => setScopeProject(e.target.checked)}
          />
          <span>{t("calendar.entry.scope")}</span>
        </label>
        <div className="actions">
          <button type="button" data-variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="submit">{t("common.create")}</button>
        </div>
      </form>
    </Modal>
  );
}
