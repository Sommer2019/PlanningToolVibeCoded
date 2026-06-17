# Planning & Tracking Module

A self-contained **Planning & Tracking** module for a larger multi-module
system. It provides a **Kanban board**, **task list**, **roadmap/timeline**,
**responsibilities (assignees)** and a **calendar** with a subscribable
**iCal/CalDAV link**.

Authentication and roles come from an external **Authentik** server (OIDC/JWT).
This module does **not** manage users or roles itself — it validates the JWT and
reads identity + roles from token claims. For local development and the public
demo there is a **mock auth mode** with fixed test identities.

> Architecture decisions and open points are documented in
> [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Repository layout

```
/backend          Kotlin + Spring Boot (Maven), REST API + iCal feed
/frontend         Vite + React + TypeScript SPA
/docker           Dockerfile (backend) + docker-compose.yml
/.github/workflows  CI/CD (GHCR backend image, GitHub Pages frontend demo)
/docs             DECISIONS.md
```

## Features

- **Projects & memberships** — create projects, add members directly, or let
  users request to join (admin/owner approves).
- **Tasks** — required fields `title, assignee, description, plannedStart,
  plannedEnd, status`; optional `actualStart/actualEnd`; lockable (admin/creator
  override).
- **Configurable statuses** — `Todo / In Progress / Done` seeded; admins add more.
- **Per-user Kanban** — drag & drop to change status; shows *your* assigned tasks.
- **Roadmap / timeline** — Gantt-style view of all project tasks by planned dates.
- **Task list** — sortable/filterable table (assignee, status, time range).
- **Calendar + iCal feed** — tasks and standalone entries; subscribe via
  `/api/calendar/{token}.ics`.

## Tech stack

| Area     | Choice |
|----------|--------|
| Backend  | Kotlin 2.4, Spring Boot 4.1, Java 25, Maven |
| DB       | PostgreSQL 16, Flyway migrations |
| API docs | springdoc-openapi 3.x (Swagger UI) |
| Auth     | Spring Security OAuth2 Resource Server (JWT/JWKS) + mock profile |
| iCal     | ical4j |
| Frontend | Vite, React, TypeScript (theme tokens, OS dark mode, i18n en/de) |

---

## Quick start (local, with Docker)

Runs Postgres + backend together. Backend starts in **mock auth** so you can try
it without an Authentik server.

```bash
cd docker
docker compose up --build
```

- Backend API:  http://localhost:8004/api
- Swagger UI:   http://localhost:8004/swagger-ui.html
- OpenAPI spec: http://localhost:8004/openapi.json
- Health:       http://localhost:8004/health  → `{"status":"ok"}`

Pick the active mock identity by sending header `X-Mock-User: TestAdmin`
(also `TestUser1`, `TestUser2`, `TestUser3`).

### Frontend dev server

```bash
cd frontend
npm ci
npm run dev        # talks to a backend at VITE_API_BASE_URL (default http://localhost:8004)
```

Run the **fully mocked** demo (no backend needed):

```bash
cd frontend
VITE_MOCK_AUTH=true npm run dev
```

---

## Running the backend without Docker

Maven is provided via the wrapper, so a host Maven install is not required.

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=mock
```

You still need a Postgres reachable at the configured URL (see
`backend/src/main/resources/application.yml`). The easiest path is
`docker compose up postgres` first.

## Configuration (backend)

| Env var | Default | Meaning |
|---------|---------|---------|
| `APP_AUTH_MOCK` | `false` | Bypass JWT, use fixed mock identities. **Never in prod.** |
| `APP_AUTH_ISSUER_URI` | – | OIDC issuer URI (Authentik). Used for JWKS discovery. |
| `APP_AUTH_AUDIENCE` | – | Expected JWT `aud` (optional but recommended). |
| `APP_AUTH_ROLES_CLAIM` | `groups` | JWT claim holding the role/group list. |
| `APP_AUTH_ADMIN_ROLE` | `planning-admin` | Value in that claim granting ADMIN. |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/planning` | DB URL |
| `SPRING_DATASOURCE_USERNAME` | `planning` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `planning` | DB password |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `SERVER_PORT` | `8004` | HTTP port (Team 4 convention) |

## Configuration (frontend)

| Env var | Default | Meaning |
|---------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8004` | Backend base URL |
| `VITE_MOCK_AUTH` | `false` | Use in-memory mock API + dev user switcher |

---

## CI/CD

- **Backend** → builds + tests (Testcontainers), builds a Docker image, pushes to
  **GHCR**: `ghcr.io/sommer2019/planningtoolvibecoded-backend` (tags `latest` +
  git SHA).
- **Frontend** → builds with `VITE_MOCK_AUTH=true` and deploys the clickable demo
  to **GitHub Pages**: https://sommer2019.github.io/PlanningToolVibeCoded/

## Gateway integration (CPP team conventions)

This module is **Team 4 — Projektplanung**, route `/planning`, port `8004`.

- **Health:** `GET /health` → `200 {"status":"ok"}` (public).
- **API docs:** `GET /openapi.json` (OpenAPI 3) + Swagger UI at `/swagger-ui.html`.
- **Data format:** REST/JSON only.
- **Auth:** JWT from the central Authentik instance; issuer/JWKS/claim mapping are
  configurable (`APP_AUTH_*`, see above). Token specifics are pinned by Team 3/Gruppe 5.
- **Container:** [`docker/Dockerfile`](docker/Dockerfile) + the
  [`docker/docker-compose.yml`](docker/docker-compose.yml) service snippet carries
  the Traefik labels (`PathPrefix(/planning)`, port 8004, `StripPrefix /planning`).
- **Registration:** [`modules.json`](modules.json) holds this module's gateway entry.
- **Styling:** the frontend uses the shared design-token contract (CSS variables,
  `[data-theme="dark"]`, `.btn`/`.input-field`/`.feedback-*`/spacing utilities) in
  [`frontend/src/styles/theme.css`](frontend/src/styles/theme.css), which mirrors the
  shared `styles/Stylesheet.css` so it can be swapped for the canonical file when the
  modules are merged.

## License

Internal project — see repository owner.
