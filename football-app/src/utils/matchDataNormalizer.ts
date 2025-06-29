import { Match, MatchEvent } from '../types';

/**
 * Normalizes match data from the server to ensure all timer fields are accessible
 * Handles both snake_case and camelCase field variations
 */
export function normalizeMatchData(rawMatch: any): Match {
  if (!rawMatch) return rawMatch;
  
  // Helper function to normalize event data
  const normalizeEvent = (event: any): MatchEvent => {
    return {
      ...event,
      // Ensure both naming conventions are available
      eventType: event.event_type || event.eventType,
      event_type: event.event_type || event.eventType,
      teamId: event.team_id || event.teamId,
      team_id: event.team_id || event.teamId,
      playerId: event.player_id || event.playerId,
      player_id: event.player_id || event.playerId,
      playerName: event.player_name || event.playerName,
      player_name: event.player_name || event.playerName,
      matchId: event.match_id || event.matchId,
      match_id: event.match_id || event.matchId,
      createdAt: event.created_at || event.createdAt,
      created_at: event.created_at || event.createdAt,
    };
  };

  // Debug log to see what we're receiving
  console.log('🔧 Normalizing match data:', {
    has_events: !!rawMatch.events,
    events_count: rawMatch.events?.length || 0,
    added_time_first: rawMatch.added_time_first_half,
    added_time_second: rawMatch.added_time_second_half,
    second_half_start_time: rawMatch.second_half_start_time
  });

  // Normalize events array
  const normalizedEvents = Array.isArray(rawMatch.events) 
    ? rawMatch.events.map(normalizeEvent) 
    : [];

  console.log('🎯 Normalized events:', normalizedEvents);

  // Normalize the complete match data
  const normalizedMatch = {
    ...rawMatch,
    
    // Timer fields (already working)
    timerStartedAt: rawMatch.timer_started_at || rawMatch.timerStartedAt,
    timer_started_at: rawMatch.timer_started_at || rawMatch.timerStartedAt,
    
    secondHalfStartedAt: rawMatch.second_half_start_time || 
                        rawMatch.second_half_started_at || 
                        rawMatch.secondHalfStartTime ||
                        rawMatch.secondHalfStartedAt,
    secondHalfStartTime: rawMatch.second_half_start_time || rawMatch.secondHalfStartTime,
    second_half_start_time: rawMatch.second_half_start_time || rawMatch.secondHalfStartTime,
    second_half_started_at: rawMatch.second_half_started_at || rawMatch.secondHalfStartedAt,
    
    // Extra time fields - ensure all naming conventions work
    addedTimeFirstHalf: rawMatch.added_time_first_half || rawMatch.addedTimeFirstHalf || 0,
    addedTimeFirst: rawMatch.added_time_first_half || rawMatch.addedTimeFirstHalf || 0,
    added_time_first_half: rawMatch.added_time_first_half || rawMatch.addedTimeFirstHalf || 0,
    
    addedTimeSecondHalf: rawMatch.added_time_second_half || rawMatch.addedTimeSecondHalf || 0,
    addedTimeSecond: rawMatch.added_time_second_half || rawMatch.addedTimeSecondHalf || 0,
    added_time_second_half: rawMatch.added_time_second_half || rawMatch.addedTimeSecondHalf || 0,
    
    // Current half
    currentHalf: rawMatch.current_half || rawMatch.currentHalf || 1,
    current_half: rawMatch.current_half || rawMatch.currentHalf || 1,
    
    // Current minute
    currentMinute: rawMatch.current_minute || rawMatch.currentMinute || 0,
    current_minute: rawMatch.current_minute || rawMatch.currentMinute || 0,
    
    // Events - ensure the array is properly normalized with all possible field names
    events: normalizedEvents,
    eventsData: normalizedEvents,
    events_data: normalizedEvents,
    
    // Team IDs
    homeTeamId: rawMatch.home_team_id || rawMatch.homeTeamId,
    home_team_id: rawMatch.home_team_id || rawMatch.homeTeamId,
    awayTeamId: rawMatch.away_team_id || rawMatch.awayTeamId,
    away_team_id: rawMatch.away_team_id || rawMatch.awayTeamId,
  };

  console.log('✅ Complete normalized match:', {
    eventsCount: normalizedMatch.events?.length,
    addedTimeFirst: normalizedMatch.addedTimeFirst,
    addedTimeSecond: normalizedMatch.addedTimeSecond,
    currentHalf: normalizedMatch.currentHalf
  });

  return normalizedMatch;
}