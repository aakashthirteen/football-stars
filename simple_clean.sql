-- Delete all matches before today
-- This will cascade delete related match_events and player_stats

DELETE FROM matches WHERE match_date < CURRENT_DATE;