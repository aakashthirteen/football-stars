// Advanced Analytics Types for Football Stars App
// This file defines comprehensive data structures for match analytics, heat maps, and performance metrics

// Basic position tracking for heat maps
export interface PositionData {
  x: number; // Percentage of pitch width (0-100)
  y: number; // Percentage of pitch height (0-100)
  timestamp: number; // Unix timestamp
  intensity: number; // Activity intensity (0-1)
}

// Player movement and positioning analytics
export interface PlayerHeatMapData {
  playerId: string;
  playerName: string;
  position: string;
  matchId: string;
  positions: PositionData[];
  zones: {
    defensive: number; // % time in defensive third
    middle: number;    // % time in middle third
    attacking: number; // % time in attacking third
  };
  movementStats: {
    distanceCovered: number; // meters
    averageSpeed: number;    // km/h
    maxSpeed: number;        // km/h
    sprints: number;         // count of high-speed runs
  };
}

// Team-level heat map data
export interface TeamHeatMapData {
  teamId: string;
  teamName: string;
  matchId: string;
  players: PlayerHeatMapData[];
  teamCentroid: PositionData[]; // Team's center of mass over time
  formationData: {
    avgFormation: string; // Most common formation
    formationChanges: Array<{
      minute: number;
      formation: string;
      reason?: string;
    }>;
  };
  territorialControl: {
    ownHalf: number;      // % possession in own half
    oppositionHalf: number; // % possession in opposition half
    finalThird: number;   // % time in opposition final third
  };
}

// Advanced performance metrics
export interface PlayerPerformanceMetrics {
  playerId: string;
  playerName: string;
  matchId: string;
  
  // Physical metrics
  physical: {
    distanceCovered: number;
    averageSpeed: number;
    maxSpeed: number;
    sprints: number;
    stamina: number; // 0-100 calculated endurance
    workRate: number; // 0-100 activity level
  };
  
  // Technical metrics
  technical: {
    passAccuracy: number;   // % successful passes
    passesCompleted: number;
    passesAttempted: number;
    keyPasses: number;      // Passes leading to shots
    crossesCompleted: number;
    crossesAttempted: number;
    shotsOnTarget: number;
    shotsOffTarget: number;
    dribblesCompleted: number;
    dribblesAttempted: number;
  };
  
  // Tactical metrics
  tactical: {
    interceptionsWon: number;
    tacklesWon: number;
    tacklesAttempted: number;
    clearances: number;
    blockedShots: number;
    foulsCommitted: number;
    foulsWon: number;
    offsides: number;
  };
  
  // Positional metrics
  positional: {
    averagePosition: { x: number; y: number };
    heatMapIntensity: number; // 0-1
    timeInPosition: number;   // % time in designated position
    positionDeviation: number; // How much player moved from position
  };
  
  // Match impact
  impact: {
    goals: number;
    assists: number;
    xG: number;  // Expected goals
    xA: number;  // Expected assists
    rating: number; // Overall match rating 0-10
    motmScore: number; // Man of the match score
  };
}

// Team performance analytics
export interface TeamPerformanceAnalytics {
  teamId: string;
  teamName: string;
  matchId: string;
  
  // Possession stats
  possession: {
    overall: number; // % possession
    byThird: {
      defensive: number;
      middle: number;
      attacking: number;
    };
    averageLength: number; // Average possession duration (seconds)
    longestPossession: number; // Longest possession (seconds)
  };
  
  // Attacking metrics
  attacking: {
    shotsTotal: number;
    shotsOnTarget: number;
    shotAccuracy: number;
    chancesCreated: number;
    bigChances: number;
    bigChancesMissed: number;
    crossesCompleted: number;
    crossesAttempted: number;
    cornersWon: number;
    offsidesCount: number;
  };
  
  // Defensive metrics
  defending: {
    tacklesWon: number;
    tacklesAttempted: number;
    interceptions: number;
    clearances: number;
    blockedShots: number;
    saves: number; // Goalkeeper saves
    cleanSheet: boolean;
    errorsLeadingToGoals: number;
  };
  
  // Passing metrics
  passing: {
    totalPasses: number;
    completedPasses: number;
    accuracy: number;
    shortPasses: { completed: number; attempted: number };
    mediumPasses: { completed: number; attempted: number };
    longPasses: { completed: number; attempted: number };
  };
  
  // Set pieces
  setPieces: {
    corners: { won: number; scored: number };
    freeKicks: { won: number; scored: number };
    penalties: { won: number; scored: number; missed: number };
  };
  
  // Disciplinary
  discipline: {
    yellowCards: number;
    redCards: number;
    foulsCommitted: number;
    foulsWon: number;
  };
}

// Match analytics combining both teams
export interface MatchAnalytics {
  matchId: string;
  homeTeam: TeamPerformanceAnalytics;
  awayTeam: TeamPerformanceAnalytics;
  
  // Match-level stats
  matchStats: {
    duration: number; // Total match time in minutes
    temperature: number; // Field conditions
    weather: string;   // Weather conditions
    attendance: number;
    referee: string;
  };
  
  // Key moments
  keyMoments: Array<{
    minute: number;
    type: 'goal' | 'card' | 'substitution' | 'big_chance' | 'penalty';
    description: string;
    playerId?: string;
    teamId: string;
    impact: number; // 0-1 significance
  }>;
  
  // Advanced analytics
  advanced: {
    gamePhases: Array<{
      startMinute: number;
      endMinute: number;
      dominatingTeam: string;
      intensity: number; // 0-1
      eventCount: number;
    }>;
    momentumChanges: Array<{
      minute: number;
      fromTeam: string;
      toTeam: string;
      trigger: string; // What caused the momentum shift
    }>;
    tacticalAnalysis: {
      homeFormationChanges: number;
      awayFormationChanges: number;
      pressureIntensity: number; // 0-1
      gameSpeed: number; // 0-1
    };
  };
}

// Player rating calculation inputs
export interface PlayerRatingInputs {
  playerId: string;
  matchId: string;
  
  // Base stats (actual events)
  goals: number;
  assists: number;
  passes: { completed: number; attempted: number };
  tackles: { won: number; attempted: number };
  shots: { onTarget: number; offTarget: number };
  
  // Advanced metrics
  keyPasses: number;
  successfulDribbles: number;
  interceptions: number;
  clearances: number;
  
  // Position-specific weights
  positionRole: 'GK' | 'DEF' | 'MID' | 'FWD';
  minutesPlayed: number;
  
  // Team context
  teamResult: 'WIN' | 'DRAW' | 'LOSS';
  teamScore: number;
  oppositionScore: number;
}

// Historical analytics for player development
export interface PlayerDevelopmentAnalytics {
  playerId: string;
  playerName: string;
  timeframe: {
    startDate: string;
    endDate: string;
    matchCount: number;
  };
  
  // Performance trends
  trends: {
    rating: Array<{ matchId: string; rating: number; date: string }>;
    goals: Array<{ matchId: string; goals: number; date: string }>;
    assists: Array<{ matchId: string; assists: number; date: string }>;
    physicalMetrics: Array<{
      matchId: string;
      distance: number;
      sprints: number;
      date: string;
    }>;
  };
  
  // Improvement areas
  development: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextGoals: string[];
  };
  
  // Comparison with similar players
  benchmarking: {
    percentile: {
      goals: number;
      assists: number;
      rating: number;
      physicalPerformance: number;
    };
    similarPlayers: Array<{
      playerId: string;
      playerName: string;
      similarity: number; // 0-1
    }>;
  };
}

// Competition/League analytics
export interface CompetitionAnalytics {
  competitionId: string;
  competitionName: string;
  season: string;
  
  // Team standings with advanced metrics
  standings: Array<{
    teamId: string;
    teamName: string;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    
    // Advanced metrics
    xG: number;        // Expected goals
    xGA: number;       // Expected goals against
    xGDiff: number;    // xG difference
    avgPossession: number;
    passAccuracy: number;
    avgRating: number;
  }>;
  
  // League-wide statistics
  leagueStats: {
    topScorers: Array<{ playerId: string; playerName: string; goals: number; teamName: string }>;
    topAssists: Array<{ playerId: string; playerName: string; assists: number; teamName: string }>;
    bestRated: Array<{ playerId: string; playerName: string; rating: number; teamName: string }>;
    mostImproved: Array<{ playerId: string; playerName: string; improvement: number; teamName: string }>;
  };
}

// Export all types for easy importing
export type {
  PositionData,
  PlayerHeatMapData,
  TeamHeatMapData,
  PlayerPerformanceMetrics,
  TeamPerformanceAnalytics,
  MatchAnalytics,
  PlayerRatingInputs,
  PlayerDevelopmentAnalytics,
  CompetitionAnalytics,
};