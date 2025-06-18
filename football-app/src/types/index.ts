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
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  createdBy: string;
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