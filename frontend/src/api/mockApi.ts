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
import { ApiError } from "./httpClient";
import { getActiveUser } from "./session";

// ---- fixed identities (mirror backend MockUsers) ----
const USERS: MockUser[] = [
  { subject: "TestAdmin", displayName: "Test Admin", admin: true },
  { subject: "TestUser1", displayName: "Test User 1", admin: false },
  { subject: "TestUser2", displayName: "Test User 2", admin: false },
  { subject: "TestUser3", displayName: "Test User 3", admin: false },
];

const uid = () => crypto.randomUUID();
const isAdmin = (u: string) => u === "TestAdmin";

function iso(daysFromNow: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ---- seed store ----
const TODO = "00000000-0000-0000-0000-000000000001";
const PROG = "00000000-0000-0000-0000-000000000002";
const DONE = "00000000-0000-0000-0000-000000000003";

const statuses: Status[] = [
  { id: TODO, projectId: null, name: "Todo", order: 0, isDefault: true },
  { id: PROG, projectId: null, name: "In Progress", order: 1, isDefault: true },
  { id: DONE, projectId: null, name: "Done", order: 2, isDefault: true },
];

const pA = "11111111-1111-1111-1111-111111111111";
const pB = "22222222-2222-2222-2222-222222222222";
const reviewStatus: Status = { id: uid(), projectId: pA, name: "Review", order: 3, isDefault: false };
statuses.push(reviewStatus);

const projects: Project[] = [
  { id: pA, name: "Website Relaunch", description: "Marketing site overhaul", createdBy: "TestUser1", createdAt: iso(-30) },
  { id: pB, name: "Mobile App", description: "iOS & Android client", createdBy: "TestAdmin", createdAt: iso(-20) },
];

const memberships: Membership[] = [
  { id: uid(), projectId: pA, userRef: "TestUser1", status: "MEMBER", role: "owner" },
  { id: uid(), projectId: pA, userRef: "TestUser2", status: "MEMBER", role: null },
  { id: uid(), projectId: pA, userRef: "TestUser3", status: "REQUESTED", role: null },
  { id: uid(), projectId: pB, userRef: "TestAdmin", status: "MEMBER", role: "owner" },
  { id: uid(), projectId: pB, userRef: "TestUser1", status: "MEMBER", role: null },
  { id: uid(), projectId: pB, userRef: "TestUser3", status: "MEMBER", role: null },
];

const tasks: Task[] = [
  mkTask(pA, "Design homepage", "TestUser1", PROG, -2, 5, false),
  mkTask(pA, "Set up CMS", "TestUser2", TODO, 1, 8, false),
  mkTask(pA, "Content migration", "TestUser2", TODO, 6, 14, false),
  mkTask(pA, "SEO audit", "TestUser1", reviewStatus.id, 3, 7, true),
  mkTask(pA, "Launch checklist", "TestUser1", DONE, -10, -1, false),
  mkTask(pB, "API integration", "TestUser1", PROG, 0, 9, false),
  mkTask(pB, "Push notifications", "TestUser3", TODO, 4, 12, false),
  mkTask(pB, "Beta release", "TestAdmin", TODO, 10, 20, false),
];

function mkTask(
  projectId: string,
  title: string,
  assignee: string,
  statusId: string,
  startDay: number,
  endDay: number,
  locked: boolean,
): Task {
  return {
    id: uid(),
    projectId,
    title,
    description: `${title} — work item.`,
    assignee,
    statusId,
    plannedStart: iso(startDay),
    plannedEnd: iso(endDay, 17),
    actualStart: null,
    actualEnd: null,
    locked,
    createdBy: assignee,
    createdAt: iso(startDay - 1),
  };
}

const calendarEntries: CalendarEntry[] = [
  { id: uid(), title: "Sprint planning", description: "Bi-weekly", start: iso(1, 10), end: iso(1, 11), projectId: pA, userRef: null },
  { id: uid(), title: "Team lunch", description: null, start: iso(2, 12), end: iso(2, 13), projectId: null, userRef: "TestUser1" },
  { id: uid(), title: "Release review", description: null, start: iso(8, 14), end: iso(8, 15), projectId: pB, userRef: null },
];

const feedTokens: FeedToken[] = [];

// ---- helpers ----
function project(id: string): Project {
  const p = projects.find((x) => x.id === id);
  if (!p) throw new ApiError(404, "Project not found");
  return p;
}

function memberOf(projectId: string, user: string): boolean {
  return (
    isAdmin(user) ||
    memberships.some((m) => m.projectId === projectId && m.userRef === user && m.status === "MEMBER")
  );
}

function requireMember(projectId: string): Project {
  const p = project(projectId);
  if (!memberOf(projectId, getActiveUser())) throw new ApiError(403, "Not a member of this project");
  return p;
}

function requireOwnerOrAdmin(projectId: string): Project {
  const p = project(projectId);
  const u = getActiveUser();
  if (!isAdmin(u) && p.createdBy !== u) throw new ApiError(403, "Requires admin or project owner");
  return p;
}

function task(id: string): Task {
  const t = tasks.find((x) => x.id === id);
  if (!t) throw new ApiError(404, "Task not found");
  return t;
}

function canEditTask(t: Task): boolean {
  const u = getActiveUser();
  if (!memberOf(t.projectId, u)) return false;
  if (t.locked && !isAdmin(u) && t.createdBy !== u) return false;
  return true;
}

const delay = <T>(value: T): Promise<T> => new Promise((r) => setTimeout(() => r(value), 120));

export const mockApi: Api = {
  getMe: () => {
    const u = getActiveUser();
    const found = USERS.find((x) => x.subject === u) ?? USERS[0];
    const me: Me = {
      subject: found.subject,
      displayName: found.displayName,
      email: `${found.subject.toLowerCase()}@example.com`,
      roles: found.admin ? ["planning-admin"] : ["planning-user"],
      admin: found.admin,
    };
    return delay(me);
  },
  getMockUsers: () => delay([...USERS]),

  listProjects: () => {
    const u = getActiveUser();
    if (isAdmin(u)) return delay([...projects]);
    const mine = new Set(
      memberships.filter((m) => m.userRef === u && m.status === "MEMBER").map((m) => m.projectId),
    );
    return delay(projects.filter((p) => mine.has(p.id)));
  },
  getProject: (id) => delay(requireMember(id)),
  createProject: (input: CreateProjectInput) => {
    const u = getActiveUser();
    const p: Project = {
      id: uid(),
      name: input.name,
      description: input.description ?? null,
      createdBy: u,
      createdAt: new Date().toISOString(),
    };
    projects.push(p);
    memberships.push({ id: uid(), projectId: p.id, userRef: u, status: "MEMBER", role: "owner" });
    return delay(p);
  },
  updateProject: (id, input) => {
    const p = requireOwnerOrAdmin(id);
    p.name = input.name;
    p.description = input.description ?? null;
    return delay(p);
  },
  deleteProject: (id) => {
    requireOwnerOrAdmin(id);
    remove(projects, (p) => p.id === id);
    remove(memberships, (m) => m.projectId === id);
    remove(tasks, (t) => t.projectId === id);
    remove(calendarEntries, (e) => e.projectId === id);
    return delay(undefined);
  },

  listMembers: (projectId) => {
    requireMember(projectId);
    return delay(memberships.filter((m) => m.projectId === projectId));
  },
  addMember: (projectId, userRef, role) => {
    requireOwnerOrAdmin(projectId);
    const existing = memberships.find((m) => m.projectId === projectId && m.userRef === userRef);
    if (existing) {
      if (existing.status === "MEMBER") throw new ApiError(409, "User is already a member");
      existing.status = "MEMBER";
      existing.role = role ?? existing.role;
      return delay(existing);
    }
    const m: Membership = { id: uid(), projectId, userRef, status: "MEMBER", role: role ?? null };
    memberships.push(m);
    return delay(m);
  },
  requestJoin: (projectId) => {
    project(projectId);
    const u = getActiveUser();
    if (memberships.some((m) => m.projectId === projectId && m.userRef === u)) {
      throw new ApiError(409, "Already a member or request pending");
    }
    const m: Membership = { id: uid(), projectId, userRef: u, status: "REQUESTED", role: null };
    memberships.push(m);
    return delay(m);
  },
  listJoinRequests: (projectId) => {
    requireOwnerOrAdmin(projectId);
    return delay(memberships.filter((m) => m.projectId === projectId && m.status === "REQUESTED"));
  },
  approveMember: (projectId, membershipId) => {
    requireOwnerOrAdmin(projectId);
    const m = memberships.find((x) => x.id === membershipId && x.projectId === projectId);
    if (!m) throw new ApiError(404, "Membership not found");
    m.status = "MEMBER";
    return delay(m);
  },
  removeMember: (projectId, membershipId) => {
    requireOwnerOrAdmin(projectId);
    remove(memberships, (m) => m.id === membershipId && m.projectId === projectId);
    return delay(undefined);
  },

  listStatuses: (projectId) => {
    const list = statuses.filter((s) => s.projectId === null || (projectId && s.projectId === projectId));
    return delay([...list].sort((a, b) => a.order - b.order));
  },
  createStatus: (name, projectId, order) => {
    if (projectId == null) {
      if (!isAdmin(getActiveUser())) throw new ApiError(403, "Requires admin");
    } else {
      requireOwnerOrAdmin(projectId);
    }
    const scope = statuses.filter((s) => s.projectId === (projectId ?? null) || s.projectId === null);
    const s: Status = {
      id: uid(),
      projectId: projectId ?? null,
      name,
      order: order ?? Math.max(-1, ...scope.map((x) => x.order)) + 1,
      isDefault: false,
    };
    statuses.push(s);
    return delay(s);
  },
  updateStatus: (id, name, order) => {
    const s = statuses.find((x) => x.id === id);
    if (!s) throw new ApiError(404, "Status not found");
    if (s.projectId == null) {
      if (!isAdmin(getActiveUser())) throw new ApiError(403, "Requires admin");
    } else requireOwnerOrAdmin(s.projectId);
    s.name = name;
    if (order != null) s.order = order;
    return delay(s);
  },
  deleteStatus: (id) => {
    const s = statuses.find((x) => x.id === id);
    if (!s) throw new ApiError(404, "Status not found");
    if (s.isDefault) throw new ApiError(409, "Cannot delete a default status");
    if (tasks.some((t) => t.statusId === id)) throw new ApiError(409, "Status is in use");
    if (s.projectId == null) {
      if (!isAdmin(getActiveUser())) throw new ApiError(403, "Requires admin");
    } else requireOwnerOrAdmin(s.projectId);
    remove(statuses, (x) => x.id === id);
    return delay(undefined);
  },

  listProjectTasks: (projectId) => {
    requireMember(projectId);
    return delay(tasks.filter((t) => t.projectId === projectId));
  },
  getBoard: (projectId, scope: BoardScope) => {
    const p = requireMember(projectId);
    const u = getActiveUser();
    if (scope === "all") {
      if (!isAdmin(u) && p.createdBy !== u) throw new ApiError(403, "Only admin/owner");
      return delay(tasks.filter((t) => t.projectId === projectId));
    }
    return delay(tasks.filter((t) => t.projectId === projectId && t.assignee === u));
  },
  createTask: (projectId, input: TaskInput) => {
    requireMember(projectId);
    validateDates(input);
    const t: Task = {
      id: uid(),
      projectId,
      title: input.title,
      description: input.description ?? null,
      assignee: input.assignee ?? null,
      statusId: input.statusId,
      plannedStart: input.plannedStart,
      plannedEnd: input.plannedEnd,
      actualStart: input.actualStart ?? null,
      actualEnd: input.actualEnd ?? null,
      locked: false,
      createdBy: getActiveUser(),
      createdAt: new Date().toISOString(),
    };
    tasks.push(t);
    return delay(t);
  },
  updateTask: (id, input) => {
    const t = task(id);
    if (!canEditTask(t)) throw new ApiError(403, t.locked ? "Task is locked" : "Not allowed");
    validateDates(input);
    Object.assign(t, {
      title: input.title,
      description: input.description ?? null,
      assignee: input.assignee ?? null,
      statusId: input.statusId,
      plannedStart: input.plannedStart,
      plannedEnd: input.plannedEnd,
      actualStart: input.actualStart ?? null,
      actualEnd: input.actualEnd ?? null,
    });
    return delay(t);
  },
  updateTaskStatus: (id, statusId) => {
    const t = task(id);
    if (!canEditTask(t)) throw new ApiError(403, t.locked ? "Task is locked" : "Not allowed");
    t.statusId = statusId;
    return delay(t);
  },
  setTaskLocked: (id, locked) => {
    const t = task(id);
    requireOwnerOrAdmin(t.projectId);
    t.locked = locked;
    return delay(t);
  },
  deleteTask: (id) => {
    const t = task(id);
    const u = getActiveUser();
    if (!isAdmin(u) && t.createdBy !== u) throw new ApiError(403, "Only admin or creator");
    if (t.locked && !isAdmin(u)) throw new ApiError(403, "Task is locked");
    remove(tasks, (x) => x.id === id);
    return delay(undefined);
  },

  listCalendarEntries: (projectId) => {
    if (projectId) {
      requireMember(projectId);
      return delay(calendarEntries.filter((e) => e.projectId === projectId));
    }
    const u = getActiveUser();
    return delay(calendarEntries.filter((e) => e.userRef === u));
  },
  createCalendarEntry: (input: CalendarEntryInput) => {
    if (new Date(input.end) < new Date(input.start)) throw new ApiError(400, "end before start");
    const u = getActiveUser();
    const e: CalendarEntry = {
      id: uid(),
      title: input.title,
      description: input.description ?? null,
      start: input.start,
      end: input.end,
      projectId: input.projectId ?? null,
      userRef: input.projectId ? null : u,
    };
    if (input.projectId) requireMember(input.projectId);
    calendarEntries.push(e);
    return delay(e);
  },
  updateCalendarEntry: (id, input) => {
    const e = calendarEntries.find((x) => x.id === id);
    if (!e) throw new ApiError(404, "Entry not found");
    e.title = input.title;
    e.description = input.description ?? null;
    e.start = input.start;
    e.end = input.end;
    return delay(e);
  },
  deleteCalendarEntry: (id) => {
    remove(calendarEntries, (e) => e.id === id);
    return delay(undefined);
  },

  listFeedTokens: () => {
    const u = getActiveUser();
    return delay(feedTokens.filter((f) => f.userRef === u));
  },
  createFeedToken: (projectId) => {
    const u = getActiveUser();
    const existing = feedTokens.find(
      (f) => f.userRef === u && f.projectId === (projectId ?? null),
    );
    if (existing) return delay(existing);
    const token = uid().replace(/-/g, "");
    const f: FeedToken = {
      id: uid(),
      token,
      projectId: projectId ?? null,
      userRef: u,
      feedPath: `/api/planning/calendar/${token}.ics`,
    };
    feedTokens.push(f);
    return delay(f);
  },
  deleteFeedToken: (id) => {
    remove(feedTokens, (f) => f.id === id);
    return delay(undefined);
  },

  feedUrl: (feedPath) => `https://demo.sommer2019.de${feedPath}`,
};

function validateDates(input: TaskInput) {
  if (new Date(input.plannedEnd) < new Date(input.plannedStart)) {
    throw new ApiError(400, "plannedEnd must not be before plannedStart");
  }
}

function remove<T>(arr: T[], pred: (x: T) => boolean): void {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) arr.splice(i, 1);
}
