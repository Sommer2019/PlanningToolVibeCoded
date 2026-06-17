-- Planning & Tracking module — initial schema.
-- IDs are UUIDs (assigned by the application / Hibernate). Timestamps are timestamptz (UTC).

CREATE TABLE project (
    id          uuid        PRIMARY KEY,
    name        text        NOT NULL,
    description text,
    created_by  text        NOT NULL,
    created_at  timestamptz NOT NULL
);

CREATE TABLE task_status (
    id          uuid        PRIMARY KEY,
    name        text        NOT NULL,
    project_id  uuid        REFERENCES project (id) ON DELETE CASCADE,
    sort_order  integer     NOT NULL DEFAULT 0,
    is_default  boolean     NOT NULL DEFAULT false
);
-- A global default status name is unique; project-scoped names unique per project.
CREATE UNIQUE INDEX uq_status_global_name
    ON task_status (name) WHERE project_id IS NULL;
CREATE UNIQUE INDEX uq_status_project_name
    ON task_status (project_id, name) WHERE project_id IS NOT NULL;

CREATE TABLE project_membership (
    id          uuid        PRIMARY KEY,
    project_id  uuid        NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    user_ref    text        NOT NULL,
    status      text        NOT NULL,
    role        text,
    created_at  timestamptz NOT NULL,
    CONSTRAINT uq_membership UNIQUE (project_id, user_ref)
);
CREATE INDEX idx_membership_user ON project_membership (user_ref);

CREATE TABLE task (
    id            uuid        PRIMARY KEY,
    project_id    uuid        NOT NULL REFERENCES project (id) ON DELETE CASCADE,
    title         text        NOT NULL,
    description   text        NOT NULL,
    assignee      text        NOT NULL,
    status_id     uuid        NOT NULL REFERENCES task_status (id),
    planned_start timestamptz NOT NULL,
    planned_end   timestamptz NOT NULL,
    actual_start  timestamptz,
    actual_end    timestamptz,
    locked        boolean     NOT NULL DEFAULT false,
    created_by    text        NOT NULL,
    created_at    timestamptz NOT NULL
);
CREATE INDEX idx_task_project  ON task (project_id);
CREATE INDEX idx_task_assignee ON task (assignee);
CREATE INDEX idx_task_status   ON task (status_id);

CREATE TABLE calendar_entry (
    id          uuid        PRIMARY KEY,
    title       text        NOT NULL,
    description text,
    start       timestamptz NOT NULL,
    end_time    timestamptz NOT NULL,
    project_id  uuid        REFERENCES project (id) ON DELETE CASCADE,
    user_ref    text,
    created_by  text        NOT NULL,
    created_at  timestamptz NOT NULL
);
CREATE INDEX idx_calentry_project ON calendar_entry (project_id);
CREATE INDEX idx_calentry_user    ON calendar_entry (user_ref);

CREATE TABLE calendar_feed_token (
    id          uuid        PRIMARY KEY,
    token       text        NOT NULL UNIQUE,
    user_ref    text,
    project_id  uuid        REFERENCES project (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL
);
