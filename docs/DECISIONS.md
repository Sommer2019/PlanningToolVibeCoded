# Architecture Decisions & Open Points

This document records the pragmatic decisions taken while building the
Planning & Tracking module, plus the still-open points. It is the single
source of truth for "why is it like this".

## Context

This module is **one of several** in a larger system. It deliberately does
**not** manage users or roles. Identity and roles come from an external
**Authentik** server via OIDC/JWT. This module only *reads* the token.

---

## Decisions

### D1 — Tech stack & versions
- **Backend:** Kotlin 2.4.x + Spring Boot 4.1.x (Spring Framework 7 / Security 7),
  built with Maven, Java 25.
- **DB:** PostgreSQL 16.
- **Frontend:** Vite + React + TypeScript, buildable as a static SPA.
- **API docs:** springdoc-openapi 3.x (OpenAPI 3 + Swagger UI at `/swagger-ui.html`).
- **Migrations:** Flyway (SQL migrations, default statuses seeded).
- **iCal:** ical4j for the read-only calendar feed.
- **Tests:** Testcontainers 2.x (note: 2.0 renamed the modules to
  `testcontainers-junit-jupiter` / `testcontainers-postgresql`; versions are
  managed by the Spring Boot 4 BOM).

Rationale: all mainstream, well-supported choices that match the spec.

### D2 — Role / claim mapping (was open point #10.1)
The Authentik claim used for roles was **not yet known** at build time, so it is
made **fully configurable**:

```
app.auth.roles-claim   = groups        # JWT claim that holds the role/group list
app.auth.admin-role    = planning-admin # value inside that claim that grants ADMIN
```

- The roles claim is expected to be a JSON array of strings (Authentik `groups`
  is exactly that). A single string value is also accepted.
- Any user whose roles-claim contains `app.auth.admin-role` becomes `ROLE_ADMIN`.
- Everyone authenticated is at least `ROLE_USER`.
- Change these two properties (env: `APP_AUTH_ROLES_CLAIM`, `APP_AUTH_ADMIN_ROLE`)
  once the real Authentik config is known — no code change needed.

### D3 — Mock / test auth mode (spec §2)
- Enabled with Spring profile `mock` **or** env `APP_AUTH_MOCK=true`.
- When active, **JWT verification is bypassed**. A request gets its identity from
  the `X-Mock-User` header (or `?mockUser=` query param). Default = `TestAdmin`.
- Fixed identities: `TestAdmin` (ADMIN), `TestUser1`, `TestUser2`, `TestUser3` (USER).
- **Never** enabled by default; production runs without the `mock` profile.
  A loud WARN is logged on startup when mock mode is on.

### D4 — "Per-user" Kanban board filter (was open point #10.2)
A user's board defaults to tasks where **`assignee == current user`** ("Mine").
The board also has an assignee filter — **Mine / each project member / All** — so
any member can view another member's or all tasks (the permission model already
grants members access to all tasks of their projects). Filtering is client-side
over the project task list.

### D5 — Memberships & join requests (was open point #10.3 → "both")
Both flows are implemented:
- **Direct add:** a project admin/owner adds a user (`status = MEMBER`).
- **Join request:** a user requests to join (`status = REQUESTED`); an
  admin/owner approves (→ `MEMBER`) or rejects (removes the row).
Kept intentionally simple: one `ProjectMembership` row, status enum
`MEMBER | REQUESTED`, optional project-scoped role.

### D6 — Configurable statuses (spec §3)
Statuses are **data, not a hard enum**. Seeded global defaults: `Todo`,
`In Progress`, `Done` (`projectId = null`, `isDefault = true`). Admins (and
project owners) can create project-scoped statuses. Tasks reference a status id.
A `Done`-style completion is not special-cased in the backend; ordering is via
the `order` column.

### D7 — Locking (spec §4.2)
`Task.locked = true` means non-editable **except** by an ADMIN or the task's
creator. Enforced server-side; surfaced in the UI as a lock indicator.

### D8 — Calendar feed (was open point #10.4 → iCal first)
Baseline is a **read-only iCalendar subscribe link**:
`GET /api/calendar/{token}.ics` (no auth header needed — the token *is* the
credential). Tasks with planned start/end become `VEVENT`s, as do standalone
`CalendarEntry`s. Tokens are per-user and/or per-project (`CalendarFeedToken`).
A full read-write CalDAV server (RFC 4791) is explicitly a **later stage**.

### D9 — Pages demo is fully mocked (was open point #10.5 → "fully mocked")
The GitHub Pages demo builds the frontend with `VITE_MOCK_AUTH=true`. In that
mode the frontend uses an **in-memory mock API** with seed data and a dev
user-switch dropdown (TestAdmin/TestUser1-3). No backend is required for the demo.
When `VITE_MOCK_AUTH` is unset/false, the frontend talks to a real backend at
`VITE_API_BASE_URL`.

**Hosting:** served at the project Pages path
`https://sommer2019.github.io/PlanningToolVibeCoded/`. The build sets Vite
`base=/PlanningToolVibeCoded/` (workflow env `BASE_PATH`) so asset URLs resolve
under that sub-path; `BrowserRouter` uses `import.meta.env.BASE_URL` as its
basename and a `404.html` (copy of `index.html`) handles deep links. The custom
domain `sommer2019.de` is **not** used (it could not be verified/attached), so no
`CNAME` is shipped.

### D13 — Dark mode (System / Light / Dark)
Theming is driven by a `data-theme` attribute on `<html>`, set by a header
**segmented control with three modes: System / Light / Dark** (persisted in
`localStorage`). `System` resolves against `prefers-color-scheme` and follows live
OS changes. Dark values are defined under `[data-theme="dark"]` in `theme.css` per
the shared spec (incl. dark `--green-color: #5DBB63`).

### D14 — Internationalization (System / DE / EN)
Lightweight in-house i18n (`src/i18n`): flat en/de dictionaries, `{param}`
interpolation. A header **segmented control offers System / DE / EN** (persisted);
`System` follows `navigator.language` (de* → German). Dates/weekday/month names use
`Intl` with the active locale.

### D16 — CPP team conventions (gateway interface)
Compliance with the binding team checklist (Team 4 — Projektplanung, `/planning`,
port `8004`):
- **§1 Health:** added `GET /health` → `{"status":"ok"}` (public), separate from
  the richer `/actuator/health`.
- **§2 Docs:** OpenAPI spec at `/openapi.json` (`springdoc.api-docs.path`).
- **§3 Format:** REST/JSON only (already the case).
- **§4 Auth:** Authentik JWT — issuer/JWKS/claims configurable (D2); exact token
  details pending the cross-team meeting (placeholder upstream).
- **§5/§6 Container & routing:** `docker/docker-compose.yml` is self-contained
  (Postgres + backend + SPA, all values baked in, real Authentik auth on) and is
  the single artifact handed to the orchestrator. Routing:
  - `PathPrefix(/planning)` → **planning-frontend** (nginx serving the built SPA);
    the prefix is stripped, and the SPA is built with base `/planning/`.
  - `PathPrefix(/cpp-api/planning)` → **planning-backend** (port 8004). The backend
    serves its REST API **natively under `/cpp-api/planning`** (controllers were moved
    from `/api/...` to `/cpp-api/planning/...`), so the gateway needs **no path
    rewrite** — just forward. `/health` and `/openapi.json` stay at the root for
    the internal monitoring/discovery URLs.
  TLS is terminated at the gateway; the backend is HTTP-only on 8004.
- **§7 Styling:** see below (D15) — same tokens / `[data-theme="dark"]` / shared
  utility classes as the canonical `styles/Stylesheet.css`.
- **§8 Registration:** `modules.json` entry shipped at repo root.
- **§9 Admin area:** not needed — admin actions (lock/unlock, status creation,
  membership approval) are inline in the module UI and gated by the JWT admin role,
  so no separate `/planning/admin` and no `adminUrl`.

### D15 — Shared theme tokens
`theme.css` carries the cross-module design-token contract (Noto Sans, palette,
spacing, `.btn`/`.input-field` utilities) and maps those tokens onto the semantic
names the tag-level CSS consumes, so the theme stays swappable across modules.

### D10 — CSS strategy (spec §5)
- Styling is primarily on **HTML tag level** (element selectors: `button`,
  `table`, `input`, `dialog`, `h1..h3`, …).
- Design tokens live as **CSS custom properties** in `src/styles/theme.css`.
- Base/reset/element styles in `src/styles/base.css`.
- No CSS-in-JS; component-scoped classes are kept to a minimum (only structural
  helpers like `.board-column` where a tag selector is insufficient).
- The theme is swappable across modules by replacing `theme.css`.

### D11 — Build tooling without local Maven
The dev machine may not have Maven on PATH. The repo ships the **Maven wrapper**
(`./mvnw`) and the Docker build uses the official `maven` image, so neither CI nor
the container depends on a host Maven install.

### D12 — IDs
Entity IDs are UUIDs (string in the API). Avoids cross-module collisions when the
modules are later merged behind one gateway.

---

## Open points / later stages

- **OP1 — Real Authentik claim values.** `app.auth.roles-claim` /
  `app.auth.admin-role` default to `groups` / `planning-admin`. Update once the
  real Authentik tenant is configured. (D2)
- **OP2 — Full CalDAV (read-write, RFC 4791).** Out of scope for the baseline;
  iCal subscribe link only. (D8)
- **OP3 — Notifications / reminders** (e-mail, push) — not in scope.
- **OP4 — Per-project roles** beyond ADMIN/USER — the schema has an optional
  membership `role` column but it is not yet used for fine-grained authz.
