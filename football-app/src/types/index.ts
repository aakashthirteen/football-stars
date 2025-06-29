// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// Player types
export interface Player {
  id: string;
  userId: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  phoneNumber?: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  createdBy: string;
  players: TeamPlayer[];
  createdAt: string;
}

export interface TeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  player: Player;
  role: 'CAPTAIN' | 'VICE_CAPTAIN' | 'PLAYER';
  jerseyNumber?: number;
  joinedAt: string;
}

// Match types
export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
  venue?: string;
  matchDate: string;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'HALFTIME';
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  createdBy: string;
  
  // ADD ALL THESE TIMER FIELDS:
  // Snake case versions (from server)
  timer_started_at?: string;
  second_half_start_time?: string;
  second_half_started_at?: string;
  halftime_started_at?: string;
  timer_paused_at?: string;
  total_paused_duration?: number;
  current_half?: 1 | 2;
  current_minute?: number;
  current_second?: number;
  added_time_first_half?: number;
  added_time_second_half?: number;
  first_half_minutes?: number;
  second_half_minutes?: number;
  total_seconds_at_halftime?: number;
  
  // Camel case versions (for consistency)
  timerStartedAt?: string;
  secondHalfStartTime?: string;
  secondHalfStartedAt?: string;
  currentHalf?: 1 | 2;
  currentMinute?: number;
  addedTimeFirstHalf?: number;
  addedTimeSecondHalf?: number;
  
  // Alternative field names for extra time
  addedTimeFirst?: number;
  addedTimeSecond?: number;
  
  // Alternative events field names
  eventsData?: MatchEvent[];
  events_data?: MatchEvent[];
  
  // Alternative team ID names
  home_team_id?: string;
  away_team_id?: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string;
  player: Player;
  teamId: string;
  eventType: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  minute: number;
  description?: string;
  
  // Support dual format for server compatibility
  match_id?: string;
  player_id?: string;
  team_id?: string;
  event_type?: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  player_name?: string;
  playerName?: string;
  created_at?: string;
  createdAt?: string;
}

// Stats types
export interface PlayerStats {
  playerId: string;
  playerName: string;
  position: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

export interface TeamPlayerStats {
  playerId: string;
  playerName: string;
  position: string;
  role: string;
  jerseyNumber: number | null;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface LeaderboardStats {
  type: 'goals' | 'assists' | 'matches' | 'minutes';
  limit: number;
  leaderboard: PlayerStats[];
}

// Navigation types
export type RootStackParamList = {
  AuthStack: undefined;
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Teams: undefined;
  Matches: undefined;
  Tournaments: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};