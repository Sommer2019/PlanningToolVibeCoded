import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useProjectCtx } from "./ProjectLayout";
import { ErrorBanner, Empty } from "../components/Feedback";

export function MembersPage() {
  const { project, members, isOwnerOrAdmin, reload } = useProjectCtx();
  const { mockUsers } = useAuth();
  const [userRef, setUserRef] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  const active = members.filter((m) => m.status === "MEMBER");
  const requests = members.filter((m) => m.status === "REQUESTED");

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="col">
      {error && <ErrorBanner message={error} />}

      <article className="col">
        <h3 style={{ margin: 0 }}>Members ({active.length})</h3>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              {isOwnerOrAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {active.map((m) => (
              <tr key={m.id}>
                <td>{m.userRef}</td>
                <td>{m.role ?? "member"}</td>
                {isOwnerOrAdmin && (
                  <td>
                    <button
                      data-variant="ghost"
                      disabled={m.userRef === project.createdBy}
                      onClick={() => run(() => api.removeMember(project.id, m.id))}
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {isOwnerOrAdmin && (
        <article className="col">
          <h3 style={{ margin: 0 }}>Join requests ({requests.length})</h3>
          {requests.length === 0 ? (
            <Empty message="No pending requests." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((m) => (
                  <tr key={m.id}>
                    <td>{m.userRef}</td>
                    <td className="row">
                      <button onClick={() => run(() => api.approveMember(project.id, m.id))}>
                        Approve
                      </button>
                      <button
                        data-variant="danger"
                        onClick={() => run(() => api.removeMember(project.id, m.id))}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      )}

      {isOwnerOrAdmin && (
        <article className="col" style={{ maxWidth: 460 }}>
          <h3 style={{ margin: 0 }}>Add member directly</h3>
          <form
            className="col"
            onSubmit={(e) => {
              e.preventDefault();
              if (!userRef.trim()) return;
              run(() => api.addMember(project.id, userRef.trim(), role || undefined)).then(() => {
                setUserRef("");
                setRole("");
              });
            }}
          >
            <div className="row wrap">
              <input
                style={{ flex: 1, minWidth: 180 }}
                list="known-users"
                placeholder="user reference (sub)"
                value={userRef}
                onChange={(e) => setUserRef(e.target.value)}
              />
              <datalist id="known-users">
                {mockUsers.map((u) => (
                  <option key={u.subject} value={u.subject} />
                ))}
              </datalist>
              <input
                style={{ width: 140 }}
                placeholder="role (optional)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <button type="submit" disabled={!userRef.trim()}>
                Add
              </button>
            </div>
          </form>
        </article>
      )}
    </div>
  );
}
