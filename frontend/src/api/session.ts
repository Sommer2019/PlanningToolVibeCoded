// Tracks the active dev/mock identity used for the X-Mock-User header (when the
// backend runs in mock mode) and for the in-memory mock API. The host app would
// instead provide a real JWT; see DECISIONS D3.

const STORAGE_KEY = "planning_active_user";

let activeUser: string = localStorage.getItem(STORAGE_KEY) ?? "TestAdmin";

export function getActiveUser(): string {
  return activeUser;
}

export function setActiveUser(user: string): void {
  activeUser = user;
  localStorage.setItem(STORAGE_KEY, user);
}

export function getBearerToken(): string | null {
  return localStorage.getItem("planning_token");
}

export function setBearerToken(token: string | null): void {
  if (token) {
    localStorage.setItem("planning_token", token);
  } else {
    localStorage.removeItem("planning_token");
  }
}
