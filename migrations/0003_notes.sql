-- Add freeform notes to missions
ALTER TABLE items ADD COLUMN IF NOT EXISTS notes TEXT;
