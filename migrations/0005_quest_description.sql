-- Optional free-text description on a quest (or mission — column lives
-- on the shared items table, but the UI only surfaces it for quests).
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
