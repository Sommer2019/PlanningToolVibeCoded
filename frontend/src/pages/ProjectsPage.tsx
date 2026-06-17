import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api";
import { useAsync } from "../hooks/useAsync";
import { Spinner, ErrorBanner, Empty } from "../components/Feedback";
import { Modal } from "../components/Modal";
import { formatDate } from "../util/format";

export function ProjectsPage() {
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
      setJoinMsg("Join request sent — an admin/owner needs to approve it.");
      setJoinId("");
      reload();
    } catch (err) {
      setJoinMsg(err instanceof ApiError ? err.message : "Could not request to join.");
    }
  }

  return (
    <div className="col">
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>Projects</h2>
        <span className="spacer" />
        <button onClick={() => setCreating(true)}>+ New project</button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}
      {data && data.length === 0 && <Empty message="No projects yet. Create one to get started." />}

      {data && data.length > 0 && (
        <div className="grid-cards">
          {data.map((p) => (
            <article key={p.id} className="col">
              <h3 style={{ margin: 0 }}>
                <Link to={`/projects/${p.id}/board`}>{p.name}</Link>
              </h3>
              <p className="muted" style={{ margin: 0, minHeight: 20 }}>
                {p.description ?? "No description"}
              </p>
              <small>
                Owner: {p.createdBy}
                {p.createdAt ? ` · since ${formatDate(p.createdAt)}` : ""}
              </small>
            </article>
          ))}
        </div>
      )}

      <article className="col" style={{ maxWidth: 460 }}>
        <h3 style={{ margin: 0 }}>Join a project</h3>
        <small className="muted">
          Paste a project ID to request membership (owner/admin approves).
        </small>
        <form onSubmit={requestJoin} className="row wrap">
          <input
            style={{ flex: 1, minWidth: 220 }}
            placeholder="project id"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button type="submit" data-variant="secondary" disabled={!joinId.trim()}>
            Request to join
          </button>
        </form>
        {joinMsg && <small>{joinMsg}</small>}
      </article>

      <Modal open={creating} title="New project" onClose={() => setCreating(false)}>
        <form onSubmit={submitCreate} className="col">
          {formError && <ErrorBanner message={formError} />}
          <fieldset>
            <label htmlFor="p-name">Name *</label>
            <input
              id="p-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </fieldset>
          <fieldset>
            <label htmlFor="p-desc">Description</label>
            <textarea
              id="p-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </fieldset>
          <div className="actions">
            <button type="button" data-variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
