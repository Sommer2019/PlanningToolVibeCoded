-- Seed the global default statuses (projectId = null, isDefault = true).
-- Fixed UUIDs so the seed is deterministic across environments.
INSERT INTO task_status (id, name, project_id, sort_order, is_default) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Todo',        NULL, 0, true),
    ('00000000-0000-0000-0000-000000000002', 'In Progress', NULL, 1, true),
    ('00000000-0000-0000-0000-000000000003', 'Done',        NULL, 2, true);
