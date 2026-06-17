// Mirrors the backend DTOs.

export type MembershipStatus = "MEMBER" | "REQUESTED";

export interface Me {
  subject: string;
  displayName: string | null;
  email: string | null;
  roles: string[];
  admin: boolean;
}

export interface MockUser {
  subject: string;
  displayName: string | null;
  admin: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string | null;
}

export interface Membership {
  id: string;
  projectId: string;
  userRef: string;
  status: MembershipStatus;
  role: string | null;
}

export interface Status {
  id: string;
  projectId: string | null;
  name: string;
  order: number;
  isDefault: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  assignee: string | null;
  statusId: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  locked: boolean;
  createdBy: string;
  createdAt: string | null;
}

export interface CalendarEntry {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  projectId: string | null;
  userRef: string | null;
}

export interface FeedToken {
  id: string;
  token: string;
  projectId: string | null;
  userRef: string | null;
  feedPath: string;
}

// ---- request payloads ----

export interface CreateProjectInput {
  name: string;
  description?: string | null;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  assignee?: string | null;
  statusId: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
}

export interface CalendarEntryInput {
  title: string;
  description?: string | null;
  start: string;
  end: string;
  projectId?: string | null;
}

export type BoardScope = "me" | "all";

export interface Api {
  // identity
  getMe(): Promise<Me>;
  getMockUsers(): Promise<MockUser[]>;

  // projects
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project>;
  createProject(input: CreateProjectInput): Promise<Project>;
  updateProject(id: string, input: CreateProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // memberships
  listMembers(projectId: string): Promise<Membership[]>;
  addMember(projectId: string, userRef: string, role?: string): Promise<Membership>;
  requestJoin(projectId: string): Promise<Membership>;
  listJoinRequests(projectId: string): Promise<Membership[]>;
  approveMember(projectId: string, membershipId: string): Promise<Membership>;
  removeMember(projectId: string, membershipId: string): Promise<void>;

  // statuses
  listStatuses(projectId?: string): Promise<Status[]>;
  createStatus(name: string, projectId?: string | null, order?: number): Promise<Status>;
  updateStatus(id: string, name: string, order?: number): Promise<Status>;
  deleteStatus(id: string): Promise<void>;

  // tasks
  listProjectTasks(projectId: string): Promise<Task[]>;
  getBoard(projectId: string, scope: BoardScope): Promise<Task[]>;
  createTask(projectId: string, input: TaskInput): Promise<Task>;
  updateTask(id: string, input: TaskInput): Promise<Task>;
  updateTaskStatus(id: string, statusId: string): Promise<Task>;
  setTaskLocked(id: string, locked: boolean): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // calendar entries
  listCalendarEntries(projectId?: string): Promise<CalendarEntry[]>;
  createCalendarEntry(input: CalendarEntryInput): Promise<CalendarEntry>;
  updateCalendarEntry(id: string, input: Omit<CalendarEntryInput, "projectId">): Promise<CalendarEntry>;
  deleteCalendarEntry(id: string): Promise<void>;

  // calendar feed
  listFeedTokens(): Promise<FeedToken[]>;
  createFeedToken(projectId?: string | null): Promise<FeedToken>;
  deleteFeedToken(id: string): Promise<void>;

  /** Absolute URL for a feed path (for the subscribe link). */
  feedUrl(feedPath: string): string;
}
