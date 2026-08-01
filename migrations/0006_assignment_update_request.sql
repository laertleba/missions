-- Tracks the last time the assigner pinged the assignee for a status
-- update on a still-pending assignment.
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS update_requested_at TIMESTAMPTZ;
