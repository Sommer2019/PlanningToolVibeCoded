-- Make assignee optional
ALTER TABLE task ALTER COLUMN assignee DROP NOT NULL;
