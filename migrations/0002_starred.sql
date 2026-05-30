-- Add starred flag for high-priority missions
ALTER TABLE items ADD COLUMN IF NOT EXISTS starred BOOLEAN NOT NULL DEFAULT FALSE;
