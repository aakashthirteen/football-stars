-- SSE Timer Fields Migration for Railway Database
-- Run this on Railway database to add timer tracking fields

-- Add timer tracking columns
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS halftime_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS second_half_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS timer_paused_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_paused_duration INTEGER DEFAULT 0;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_matches_timer_status 
ON matches(status, timer_started_at);

-- Update existing LIVE matches to have timer_started_at
UPDATE matches 
SET timer_started_at = match_date 
WHERE status = 'LIVE' 
AND timer_started_at IS NULL;

-- Update matches status constraint to include HALFTIME
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE matches 
ADD CONSTRAINT matches_status_check 
CHECK (status IN ('SCHEDULED', 'LIVE', 'HALFTIME', 'COMPLETED'));

-- Verify migration
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name IN (
  'timer_started_at', 
  'halftime_started_at', 
  'second_half_started_at', 
  'timer_paused_at', 
  'total_paused_duration'
);