import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  userId: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  dateOfBirth?: Date;
  height?: number;
  weight?: number;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  createdBy: string;
  createdAt: Date;
}

export interface TeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  role: 'CAPTAIN' | 'VICE_CAPTAIN' | 'PLAYER';
  jerseyNumber?: number;
  joinedAt: Date;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  tournamentId?: string;
  venue?: string;
  matchDate: Date;
  duration: number;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'HALFTIME';
  homeScore: number;
  awayScore: number;
  liveStartTime?: Date;
  currentMinute?: number;
  currentSecond?: number;
  totalSecondsAtHalftime?: number;
  currentHalf?: 1 | 2;
  firstHalfMinutes?: number;
  secondHalfMinutes?: number;
  firstHalfStartTime?: Date;
  secondHalfStartTime?: Date;
  addedTimeFirstHalf?: number;
  addedTimeSecondHalf?: number;
  createdBy: string;
  createdAt: Date;
}

export interface MatchWithDetails extends Match {
  homeTeam?: {
    id: string;
    name: string;
    logoUrl?: string;
    logo_url?: string;
    players: Array<{
      id: string;
      name: string;
      position: string;
      jerseyNumber?: number;
    }>;
  };
  awayTeam?: {
    id: string;
    name: string;
    logoUrl?: string;
    logo_url?: string;
    players: Array<{
      id: string;
      name: string;
      position: string;
      jerseyNumber?: number;
    }>;
  };
  events?: MatchEvent[];
  // Include snake_case versions for database compatibility
  live_start_time?: Date;
  current_minute?: number;
  current_half?: number;
  first_half_minutes?: number;
  second_half_minutes?: number;
  first_half_start_time?: Date;
  second_half_start_time?: Date;
  added_time_first_half?: number;
  added_time_second_half?: number;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  eventType: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  minute: number;
  description?: string;
  createdAt: Date;
}

export interface PlayerStats {
  id: string;
  playerId: string;
  season: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  updatedAt: Date;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  tournamentType: 'LEAGUE' | 'KNOCKOUT' | 'GROUP_STAGE';
  startDate: Date;
  endDate: Date;
  maxTeams: number;
  entryFee?: number;
  prizePool?: number;
  createdBy: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface CreateMatchRequest {
  homeTeamId: string;
  awayTeamId: string;
  venue?: string;
  matchDate: string;
  duration?: number;
}

export interface MatchEventRequest {
  playerId: string;
  teamId: string;
  eventType: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  minute: number;
  description?: string;
}