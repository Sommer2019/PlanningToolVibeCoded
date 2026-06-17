import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { useI18n } from "../i18n/I18nContext";
import { useAsync } from "../hooks/useAsync";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { Modal } from "../components/Modal";
import { formatDate } from "../util/format";
import { useAuth } from "../auth/AuthContext";

export function ProjectsPage() {
  const { t } = useI18n();
  const { me } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.listProjects(), []);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [joinId, setJoinId] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createProject({ name, description: description || null });
      setCreating(false);
      setName("");
      setDescription("");
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  }

  async function requestJoin(e: FormEvent) {
    e.preventDefault();
    setJoinMsg(null);
    try {
      await api.requestJoin(joinId.trim());
      setJoinMsg(t("projects.join.sent"));
      setJoinId("");
      reload();
    } catch (err) {
      setJoinMsg(err instanceof ApiError ? err.message : t("projects.join.failed"));
    }
  }

  async function handleDeleteProject(id: string) {
    if (!window.confirm("Bist du sicher? Alle Tasks und das Projekt werden unwiderruflich gelöscht.")) return;
    try {
      await api.deleteProject(id);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="col">
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>{t("projects.title")}</h2>
        <span className="spacer" />
        <button onClick={() => setCreating(true)}>{t("projects.new")}</button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}
      {data && data.length === 0 && <Empty message={t("projects.empty")} />}

      {data && data.length > 0 && (
        <div className="grid-cards">
          {data.map((p) => (
            <article key={p.id} className="col">
              <div className="row wrap">
                <h3 style={{ margin: 0 }}>
                  <Link to={`/projects/${p.id}/board`}>{p.name}</Link>
                </h3>
                <span className="spacer" />
                {(me?.admin || p.createdBy === me?.subject) && (
                  <button data-variant="ghost" onClick={() => handleDeleteProject(p.id)} title="Projekt löschen">
                    🗑️
                  </button>
                )}
              </div>
              <p className="muted" style={{ margin: 0, minHeight: 20 }}>
                {p.description ?? t("projects.noDescription")}
              </p>
              <small>
                {t("projects.owner")}: {p.createdBy}
                {p.createdAt ? ` · ${t("projects.since")} ${formatDate(p.createdAt)}` : ""}
              </small>
            </article>
          ))}
        </div>
      )}

      <article className="col" style={{ maxWidth: 460 }}>
        <h3 style={{ margin: 0 }}>{t("projects.join.title")}</h3>
        <small className="muted">{t("projects.join.hint")}</small>
        <form onSubmit={requestJoin} className="row wrap">
          <input
            style={{ flex: 1, minWidth: 220 }}
            placeholder={t("projects.join.placeholder")}
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button type="submit" data-variant="secondary" disabled={!joinId.trim()}>
            {t("projects.join.button")}
          </button>
        </form>
        {joinMsg && <small>{joinMsg}</small>}
      </article>

      <Modal open={creating} title={t("projects.form.titleNew")} onClose={() => setCreating(false)}>
        <form onSubmit={submitCreate} className="col">
          {formError && <ErrorBanner message={formError} />}
          <fieldset>
            <label htmlFor="p-name">{t("projects.form.name")}</label>
            <input
              id="p-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </fieldset>
          <fieldset>
            <label htmlFor="p-desc">{t("projects.form.description")}</label>
            <textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </fieldset>
          <div className="actions">
            <button type="button" data-variant="secondary" onClick={() => setCreating(false)}>
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={!name.trim()}>
              {t("common.create")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
