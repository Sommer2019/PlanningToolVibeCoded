import type {
  Api,
  BoardScope,
  CalendarEntry,
  CalendarEntryInput,
  CreateProjectInput,
  FeedToken,
  Me,
  Membership,
  MockUser,
  Project,
  Status,
  Task,
  TaskInput,
} from "./types";
import { getActiveUser, getBearerToken } from "./session";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    // Dev convenience: select the mock identity when the backend is in mock mode.
    // Ignored by the backend in production.
    "X-Mock-User": getActiveUser(),
  };
  const token = getBearerToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const httpApi: Api = {
  getMe: () => request<Me>("GET", "/api/me"),
  getMockUsers: () => request<MockUser[]>("GET", "/api/auth/mock-users"),

  listProjects: () => request<Project[]>("GET", "/api/projects"),
  getProject: (id) => request<Project>("GET", `/api/projects/${id}`),
  createProject: (input: CreateProjectInput) => request<Project>("POST", "/api/projects", input),
  updateProject: (id, input) => request<Project>("PUT", `/api/projects/${id}`, input),
  deleteProject: (id) => request<void>("DELETE", `/api/projects/${id}`),

  listMembers: (projectId) => request<Membership[]>("GET", `/api/projects/${projectId}/members`),
  addMember: (projectId, userRef, role) =>
    request<Membership>("POST", `/api/projects/${projectId}/members`, { userRef, role }),
  requestJoin: (projectId) => request<Membership>("POST", `/api/projects/${projectId}/join-request`),
  listJoinRequests: (projectId) =>
    request<Membership[]>("GET", `/api/projects/${projectId}/join-requests`),
  approveMember: (projectId, membershipId) =>
    request<Membership>("POST", `/api/projects/${projectId}/members/${membershipId}/approve`),
  removeMember: (projectId, membershipId) =>
    request<void>("DELETE", `/api/projects/${projectId}/members/${membershipId}`),

  listStatuses: (projectId) =>
    request<Status[]>("GET", `/api/statuses${projectId ? `?projectId=${projectId}` : ""}`),
  createStatus: (name, projectId, order) =>
    request<Status>("POST", "/api/statuses", { name, projectId: projectId ?? null, order }),
  updateStatus: (id, name, order) =>
    request<Status>("PUT", `/api/statuses/${id}`, { name, order }),
  deleteStatus: (id) => request<void>("DELETE", `/api/statuses/${id}`),

  listProjectTasks: (projectId) => request<Task[]>("GET", `/api/projects/${projectId}/tasks`),
  getBoard: (projectId, scope: BoardScope) =>
    request<Task[]>("GET", `/api/projects/${projectId}/board?scope=${scope}`),
  createTask: (projectId, input: TaskInput) =>
    request<Task>("POST", `/api/projects/${projectId}/tasks`, input),
  updateTask: (id, input) => request<Task>("PUT", `/api/tasks/${id}`, input),
  updateTaskStatus: (id, statusId) =>
    request<Task>("PATCH", `/api/tasks/${id}/status`, { statusId }),
  setTaskLocked: (id, locked) =>
    request<Task>("POST", `/api/tasks/${id}/${locked ? "lock" : "unlock"}`),
  deleteTask: (id) => request<void>("DELETE", `/api/tasks/${id}`),

  listCalendarEntries: (projectId) =>
    request<CalendarEntry[]>(
      "GET",
      `/api/calendar-entries${projectId ? `?projectId=${projectId}` : ""}`,
    ),
  createCalendarEntry: (input: CalendarEntryInput) =>
    request<CalendarEntry>("POST", "/api/calendar-entries", input),
  updateCalendarEntry: (id, input) =>
    request<CalendarEntry>("PUT", `/api/calendar-entries/${id}`, input),
  deleteCalendarEntry: (id) => request<void>("DELETE", `/api/calendar-entries/${id}`),

  listFeedTokens: () => request<FeedToken[]>("GET", "/api/calendar/feed-tokens"),
  createFeedToken: (projectId) =>
    request<FeedToken>("POST", "/api/calendar/feed-tokens", { projectId: projectId ?? null }),
  deleteFeedToken: (id) => request<void>("DELETE", `/api/calendar/feed-tokens/${id}`),

  feedUrl: (feedPath) => `${BASE_URL}${feedPath}`,
};
