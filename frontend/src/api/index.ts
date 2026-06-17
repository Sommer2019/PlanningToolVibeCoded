import type { Api } from "./types";
import { httpApi } from "./httpClient";
import { mockApi } from "./mockApi";

/** True when the SPA runs against the in-memory mock API (Pages demo). */
export const MOCK_MODE = import.meta.env.VITE_MOCK_AUTH === "true";

export const api: Api = MOCK_MODE ? mockApi : httpApi;

export * from "./types";
export { ApiError } from "./httpClient";
export { getActiveUser, setActiveUser } from "./session";
