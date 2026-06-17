-- Make task description optional
ALTER TABLE task ALTER COLUMN description DROP NOT NULL;
