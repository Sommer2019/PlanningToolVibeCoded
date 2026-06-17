import type {
  Api,
  BoardScope,
  CalendarEntry,
  CalendarEntryInput,
  CreateProjectInput,
  FeedToken,
  LeaderboardEntry,
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

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8004").replace(/\/$/, "");

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
  getMe: () => request<Me>("GET", "/cpp-api/planning/me"),
  getMockUsers: () => request<MockUser[]>("GET", "/cpp-api/planning/auth/mock-users"),

  listProjects: () => request<Project[]>("GET", "/cpp-api/planning/projects"),
  getProject: (id) => request<Project>("GET", `/cpp-api/planning/projects/${id}`),
  createProject: (input: CreateProjectInput) => request<Project>("POST", "/cpp-api/planning/projects", input),
  updateProject: (id, input) => request<Project>("PUT", `/cpp-api/planning/projects/${id}`, input),
  deleteProject: (id) => request<void>("DELETE", `/cpp-api/planning/projects/${id}`),

  listMembers: (projectId) => request<Membership[]>("GET", `/cpp-api/planning/projects/${projectId}/members`),
  addMember: (projectId, userRef, role) =>
    request<Membership>("POST", `/cpp-api/planning/projects/${projectId}/members`, { userRef, role }),
  requestJoin: (projectId) => request<Membership>("POST", `/cpp-api/planning/projects/${projectId}/join-request`),
  listJoinRequests: (projectId) =>
    request<Membership[]>("GET", `/cpp-api/planning/projects/${projectId}/join-requests`),
  approveMember: (projectId, membershipId) =>
    request<Membership>("POST", `/cpp-api/planning/projects/${projectId}/members/${membershipId}/approve`),
  removeMember: (projectId, membershipId) =>
    request<void>("DELETE", `/cpp-api/planning/projects/${projectId}/members/${membershipId}`),

  listStatuses: (projectId) =>
    request<Status[]>("GET", `/cpp-api/planning/statuses${projectId ? `?projectId=${projectId}` : ""}`),
  createStatus: (name, projectId, order) =>
    request<Status>("POST", "/cpp-api/planning/statuses", { name, projectId: projectId ?? null, order }),
  updateStatus: (id, name, order) =>
    request<Status>("PUT", `/cpp-api/planning/statuses/${id}`, { name, order }),
  deleteStatus: (id) => request<void>("DELETE", `/cpp-api/planning/statuses/${id}`),

  listProjectTasks: (projectId) => request<Task[]>("GET", `/cpp-api/planning/projects/${projectId}/tasks`),
  getBoard: (projectId, scope: BoardScope) =>
    request<Task[]>("GET", `/cpp-api/planning/projects/${projectId}/board?scope=${scope}`),
  createTask: (projectId, input: TaskInput) =>
    request<Task>("POST", `/cpp-api/planning/projects/${projectId}/tasks`, input),
  updateTask: (id, input) => request<Task>("PUT", `/cpp-api/planning/tasks/${id}`, input),
  updateTaskStatus: (id, statusId) =>
    request<Task>("PATCH", `/cpp-api/planning/tasks/${id}/status`, { statusId }),
  setTaskLocked: (id, locked) =>
    request<Task>("POST", `/cpp-api/planning/tasks/${id}/${locked ? "lock" : "unlock"}`),
  deleteTask: (id) => request<void>("DELETE", `/cpp-api/planning/tasks/${id}`),

  listCalendarEntries: (projectId) =>
    request<CalendarEntry[]>(
      "GET",
      `/cpp-api/planning/calendar-entries${projectId ? `?projectId=${projectId}` : ""}`,
    ),
  createCalendarEntry: (input: CalendarEntryInput) =>
    request<CalendarEntry>("POST", "/cpp-api/planning/calendar-entries", input),
  updateCalendarEntry: (id, input) =>
    request<CalendarEntry>("PUT", `/cpp-api/planning/calendar-entries/${id}`, input),
  deleteCalendarEntry: (id) => request<void>("DELETE", `/cpp-api/planning/calendar-entries/${id}`),

  listFeedTokens: () => request<FeedToken[]>("GET", "/cpp-api/planning/calendar/feed-tokens"),
  createFeedToken: (projectId) =>
    request<FeedToken>("POST", "/cpp-api/planning/calendar/feed-tokens", { projectId: projectId ?? null }),
  deleteFeedToken: (id) => request<void>("DELETE", `/cpp-api/planning/calendar/feed-tokens/${id}`),

  getLeaderboard: (projectId) => request<LeaderboardEntry[]>("GET", `/cpp-api/planning/projects/${projectId}/leaderboard`),

  // Absolute subscribe URL. BASE_URL may be origin-relative ("") behind the
  // gateway, so fall back to the page origin to keep the link copy-pasteable.
  feedUrl: (feedPath) => `${BASE_URL || window.location.origin}${feedPath}`,
};
