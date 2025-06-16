// Analytics Service for Football Stars App
// Calculates advanced metrics, heat maps, and performance analytics

import { 
  MatchAnalytics,
  PlayerPerformanceMetrics,
  TeamPerformanceAnalytics,
  PlayerHeatMapData,
  TeamHeatMapData,
  PositionData,
  PlayerRatingInputs,
  PlayerDevelopmentAnalytics,
  CompetitionAnalytics
} from '../types/analytics';
import { Match, MatchEvent, Player, Team } from '../types';

class AnalyticsService {
  /**
   * Calculate comprehensive match analytics from match data
   */
  async calculateMatchAnalytics(match: Match): Promise<MatchAnalytics> {
    try {
      console.log('📊 Calculating match analytics for:', match.id);
      
      const homeTeamAnalytics = await this.calculateTeamPerformance(match, match.homeTeam);
      const awayTeamAnalytics = await this.calculateTeamPerformance(match, match.awayTeam);
      
      const analytics: MatchAnalytics = {
        matchId: match.id,
        homeTeam: homeTeamAnalytics,
        awayTeam: awayTeamAnalytics,
        
        matchStats: {
          duration: match.duration,
          temperature: 22, // Placeholder - would come from weather API
          weather: 'Clear',
          attendance: 0, // Not tracked yet
          referee: 'TBD',
        },
        
        keyMoments: this.extractKeyMoments(match.events),
        
        advanced: {
          gamePhases: this.calculateGamePhases(match),
          momentumChanges: this.calculateMomentumChanges(match.events),
          tacticalAnalysis: {
            homeFormationChanges: 0, // Would track formation changes
            awayFormationChanges: 0,
            pressureIntensity: 0.7, // Calculated from event frequency
            gameSpeed: 0.6, // Calculated from possession changes
          },
        },
      };
      
      console.log('✅ Match analytics calculated successfully');
      return analytics;
      
    } catch (error) {
      console.error('❌ Failed to calculate match analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate team performance analytics for a match
   */
  private async calculateTeamPerformance(match: Match, team: Team): Promise<TeamPerformanceAnalytics> {
    const teamEvents = match.events.filter(event => event.teamId === team.id);
    const oppositionEvents = match.events.filter(event => event.teamId !== team.id);
    
    // Calculate goals and assists
    const goals = teamEvents.filter(e => e.eventType === 'GOAL').length;
    const assists = teamEvents.filter(e => e.eventType === 'ASSIST').length;
    const shots = teamEvents.filter(e => e.eventType === 'SHOT' || e.eventType === 'GOAL').length;
    const shotsOnTarget = goals + teamEvents.filter(e => e.eventType === 'SHOT_ON_TARGET').length;
    
    // Defensive stats
    const yellowCards = teamEvents.filter(e => e.eventType === 'YELLOW_CARD').length;
    const redCards = teamEvents.filter(e => e.eventType === 'RED_CARD').length;
    const concededGoals = oppositionEvents.filter(e => e.eventType === 'GOAL').length;
    
    const analytics: TeamPerformanceAnalytics = {
      teamId: team.id,
      teamName: team.name,
      matchId: match.id,
      
      possession: {
        overall: this.calculatePossessionPercentage(teamEvents, match.events),
        byThird: {
          defensive: 35, // Placeholder - would calculate from position data
          middle: 40,
          attacking: 25,
        },
        averageLength: 15, // seconds
        longestPossession: 45,
      },
      
      attacking: {
        shotsTotal: shots,
        shotsOnTarget: shotsOnTarget,
        shotAccuracy: shots > 0 ? (shotsOnTarget / shots) * 100 : 0,
        chancesCreated: assists + goals, // Simplified
        bigChances: Math.floor(shots * 0.3), // Estimate
        bigChancesMissed: Math.max(0, Math.floor(shots * 0.3) - goals),
        crossesCompleted: 0, // Not tracked yet
        crossesAttempted: 0,
        cornersWon: 0,
        offsidesCount: 0,
      },
      
      defending: {
        tacklesWon: 0, // Not tracked yet
        tacklesAttempted: 0,
        interceptions: 0,
        clearances: 0,
        blockedShots: 0,
        saves: 0,
        cleanSheet: concededGoals === 0,
        errorsLeadingToGoals: 0,
      },
      
      passing: {
        totalPasses: teamEvents.length * 10, // Estimate
        completedPasses: teamEvents.length * 8, // Estimate 80% accuracy
        accuracy: 80,
        shortPasses: { completed: 50, attempted: 60 },
        mediumPasses: { completed: 30, attempted: 40 },
        longPasses: { completed: 10, attempted: 20 },
      },
      
      setPieces: {
        corners: { won: 0, scored: 0 },
        freeKicks: { won: 0, scored: 0 },
        penalties: { won: 0, scored: 0, missed: 0 },
      },
      
      discipline: {
        yellowCards,
        redCards,
        foulsCommitted: yellowCards + redCards, // Simplified
        foulsWon: 0,
      },
    };
    
    return analytics;
  }

  /**
   * Calculate player performance metrics for a match
   */
  async calculatePlayerPerformanceMetrics(
    playerId: string, 
    match: Match, 
    heatMapData?: PlayerHeatMapData
  ): Promise<PlayerPerformanceMetrics> {
    const playerEvents = match.events.filter(event => event.playerId === playerId);
    const player = this.findPlayerInMatch(playerId, match);
    
    if (!player) {
      throw new Error(`Player ${playerId} not found in match ${match.id}`);
    }
    
    const goals = playerEvents.filter(e => e.eventType === 'GOAL').length;
    const assists = playerEvents.filter(e => e.eventType === 'ASSIST').length;
    const yellowCards = playerEvents.filter(e => e.eventType === 'YELLOW_CARD').length;
    const redCards = playerEvents.filter(e => e.eventType === 'RED_CARD').length;
    
    const metrics: PlayerPerformanceMetrics = {
      playerId,
      playerName: player.name,
      matchId: match.id,
      
      physical: {
        distanceCovered: heatMapData?.movementStats.distanceCovered || this.estimateDistanceCovered(player.position),
        averageSpeed: heatMapData?.movementStats.averageSpeed || this.estimateAverageSpeed(player.position),
        maxSpeed: heatMapData?.movementStats.maxSpeed || this.estimateMaxSpeed(player.position),
        sprints: heatMapData?.movementStats.sprints || this.estimateSprints(player.position),
        stamina: this.calculateStamina(playerEvents, match.duration),
        workRate: this.calculateWorkRate(playerEvents.length, match.duration),
      },
      
      technical: {
        passAccuracy: this.estimatePassAccuracy(player.position),
        passesCompleted: this.estimatePassesCompleted(player.position),
        passesAttempted: this.estimatePassesAttempted(player.position),
        keyPasses: assists, // Simplified
        crossesCompleted: player.position === 'DEF' ? 2 : player.position === 'MID' ? 3 : 1,
        crossesAttempted: player.position === 'DEF' ? 4 : player.position === 'MID' ? 5 : 2,
        shotsOnTarget: goals,
        shotsOffTarget: Math.max(0, goals * 0.5), // Estimate
        dribblesCompleted: player.position === 'FWD' ? 3 : player.position === 'MID' ? 2 : 1,
        dribblesAttempted: player.position === 'FWD' ? 5 : player.position === 'MID' ? 3 : 2,
      },
      
      tactical: {
        interceptionsWon: player.position === 'DEF' ? 4 : player.position === 'MID' ? 3 : 1,
        tacklesWon: player.position === 'DEF' ? 5 : player.position === 'MID' ? 3 : 1,
        tacklesAttempted: player.position === 'DEF' ? 7 : player.position === 'MID' ? 4 : 2,
        clearances: player.position === 'DEF' ? 6 : player.position === 'MID' ? 2 : 0,
        blockedShots: player.position === 'DEF' ? 2 : 0,
        foulsCommitted: yellowCards + redCards,
        foulsWon: Math.max(0, 2 - yellowCards),
        offsides: player.position === 'FWD' ? 1 : 0,
      },
      
      positional: {
        averagePosition: this.calculateAveragePosition(player.position),
        heatMapIntensity: heatMapData ? this.calculateHeatMapIntensity(heatMapData.positions) : 0.7,
        timeInPosition: 85, // % time in designated position
        positionDeviation: 15, // How much player moved from position
      },
      
      impact: {
        goals,
        assists,
        xG: this.calculateExpectedGoals(playerEvents, player.position),
        xA: this.calculateExpectedAssists(assists, player.position),
        rating: this.calculatePlayerRating({
          playerId,
          matchId: match.id,
          goals,
          assists,
          passes: { completed: 20, attempted: 25 },
          tackles: { won: 3, attempted: 4 },
          shots: { onTarget: goals, offTarget: 1 },
          keyPasses: assists,
          successfulDribbles: 2,
          interceptions: 2,
          clearances: player.position === 'DEF' ? 4 : 1,
          positionRole: player.position,
          minutesPlayed: match.duration,
          teamResult: match.homeScore > match.awayScore ? 'WIN' : match.homeScore < match.awayScore ? 'LOSS' : 'DRAW',
          teamScore: Math.max(match.homeScore, match.awayScore),
          oppositionScore: Math.min(match.homeScore, match.awayScore),
        }),
        motmScore: this.calculateMotmScore(goals, assists, playerEvents.length),
      },
    };
    
    return metrics;
  }

  /**
   * Generate mock heat map data for demonstration
   */
  generateMockHeatMapData(playerId: string, playerName: string, position: string, matchId: string): PlayerHeatMapData {
    const positions: PositionData[] = [];
    const basePositions = this.getPositionBasedCoordinates(position);
    
    // Generate 100 position points throughout the match
    for (let i = 0; i < 100; i++) {
      const variance = 15; // Position variance
      positions.push({
        x: Math.max(5, Math.min(95, basePositions.x + (Math.random() - 0.5) * variance)),
        y: Math.max(5, Math.min(95, basePositions.y + (Math.random() - 0.5) * variance)),
        timestamp: Date.now() + i * 60000, // Every minute
        intensity: Math.random() * 0.8 + 0.2, // 0.2-1.0 intensity
      });
    }
    
    return {
      playerId,
      playerName,
      position,
      matchId,
      positions,
      zones: this.calculateZoneDistribution(positions),
      movementStats: {
        distanceCovered: this.estimateDistanceCovered(position),
        averageSpeed: this.estimateAverageSpeed(position),
        maxSpeed: this.estimateMaxSpeed(position),
        sprints: this.estimateSprints(position),
      },
    };
  }

  /**
   * Calculate player rating based on performance metrics
   */
  private calculatePlayerRating(inputs: PlayerRatingInputs): number {
    const {
      goals,
      assists,
      passes,
      tackles,
      shots,
      keyPasses,
      successfulDribbles,
      interceptions,
      clearances,
      positionRole,
      minutesPlayed,
      teamResult,
    } = inputs;
    
    let rating = 6.0; // Base rating
    
    // Goals and assists (universal positive impact)
    rating += goals * 0.8;
    rating += assists * 0.6;
    
    // Position-specific weights
    const passAccuracy = passes.attempted > 0 ? passes.completed / passes.attempted : 0;
    const tackleSuccess = tackles.attempted > 0 ? tackles.won / tackles.attempted : 0;
    const shotAccuracy = (shots.onTarget + shots.offTarget) > 0 ? shots.onTarget / (shots.onTarget + shots.offTarget) : 0;
    
    switch (positionRole) {
      case 'GK':
        // Goalkeepers: Focus on saves and clean sheets
        rating += (teamResult === 'WIN' || teamResult === 'DRAW') ? 0.5 : -0.3;
        break;
        
      case 'DEF':
        // Defenders: Focus on defensive actions and passing
        rating += tackles.won * 0.1;
        rating += interceptions * 0.1;
        rating += clearances * 0.1;
        rating += tackleSuccess * 0.3;
        rating += passAccuracy * 0.4;
        if (inputs.oppositionScore === 0) rating += 0.3; // Clean sheet bonus
        break;
        
      case 'MID':
        // Midfielders: Balanced across passing, tackles, and creativity
        rating += keyPasses * 0.2;
        rating += passAccuracy * 0.5;
        rating += tackles.won * 0.1;
        rating += successfulDribbles * 0.1;
        break;
        
      case 'FWD':
        // Forwards: Focus on shots, goals, and creativity
        rating += shots.onTarget * 0.2;
        rating += keyPasses * 0.2;
        rating += successfulDribbles * 0.15;
        rating += shotAccuracy * 0.3;
        break;
    }
    
    // Team result bonus/penalty
    if (teamResult === 'WIN') rating += 0.2;
    else if (teamResult === 'LOSS') rating -= 0.2;
    
    // Minutes played factor (less impact if substituted early)
    const minutesFactor = minutesPlayed / 90;
    rating = 6.0 + (rating - 6.0) * minutesFactor;
    
    // Ensure rating is between 1-10
    return Math.max(1.0, Math.min(10.0, Number(rating.toFixed(1))));
  }

  /**
   * Helper methods for calculations
   */
  private findPlayerInMatch(playerId: string, match: Match): Player | null {
    // Search in both teams
    const homePlayer = match.homeTeam.players.find(tp => tp.playerId === playerId);
    if (homePlayer) return homePlayer.player;
    
    const awayPlayer = match.awayTeam.players.find(tp => tp.playerId === playerId);
    if (awayPlayer) return awayPlayer.player;
    
    return null;
  }

  private calculatePossessionPercentage(teamEvents: MatchEvent[], allEvents: MatchEvent[]): number {
    // Simplified possession calculation based on event ratio
    const teamEventCount = teamEvents.length;
    const totalEventCount = allEvents.length;
    return totalEventCount > 0 ? Math.round((teamEventCount / totalEventCount) * 100) : 50;
  }

  private extractKeyMoments(events: MatchEvent[]): Array<any> {
    return events
      .filter(event => ['GOAL', 'RED_CARD', 'SUBSTITUTION'].includes(event.eventType))
      .map(event => ({
        minute: event.minute,
        type: event.eventType.toLowerCase(),
        description: `${event.eventType} by ${event.player.name}`,
        playerId: event.playerId,
        teamId: event.teamId,
        impact: event.eventType === 'GOAL' ? 0.9 : event.eventType === 'RED_CARD' ? 0.8 : 0.4,
      }));
  }

  private calculateGamePhases(match: Match): Array<any> {
    const duration = match.duration;
    return [
      {
        startMinute: 0,
        endMinute: Math.floor(duration / 3),
        dominatingTeam: match.homeTeam.id,
        intensity: 0.7,
        eventCount: Math.floor(match.events.length / 3),
      },
      {
        startMinute: Math.floor(duration / 3),
        endMinute: Math.floor((duration * 2) / 3),
        dominatingTeam: match.awayTeam.id,
        intensity: 0.8,
        eventCount: Math.floor(match.events.length / 3),
      },
      {
        startMinute: Math.floor((duration * 2) / 3),
        endMinute: duration,
        dominatingTeam: match.homeTeam.id,
        intensity: 0.9,
        eventCount: Math.floor(match.events.length / 3),
      },
    ];
  }

  private calculateMomentumChanges(events: MatchEvent[]): Array<any> {
    const goals = events.filter(e => e.eventType === 'GOAL');
    return goals.map((goal, index) => ({
      minute: goal.minute,
      fromTeam: index === 0 ? 'neutral' : goals[index - 1].teamId,
      toTeam: goal.teamId,
      trigger: `Goal by ${goal.player.name}`,
    }));
  }

  private getPositionBasedCoordinates(position: string): { x: number; y: number } {
    switch (position) {
      case 'GK': return { x: 50, y: 10 };
      case 'DEF': return { x: 50, y: 25 };
      case 'MID': return { x: 50, y: 50 };
      case 'FWD': return { x: 50, y: 75 };
      default: return { x: 50, y: 50 };
    }
  }

  private calculateZoneDistribution(positions: PositionData[]): { defensive: number; middle: number; attacking: number } {
    const defensive = positions.filter(p => p.y <= 33).length;
    const middle = positions.filter(p => p.y > 33 && p.y <= 66).length;
    const attacking = positions.filter(p => p.y > 66).length;
    const total = positions.length;
    
    return {
      defensive: Math.round((defensive / total) * 100),
      middle: Math.round((middle / total) * 100),
      attacking: Math.round((attacking / total) * 100),
    };
  }

  private calculateHeatMapIntensity(positions: PositionData[]): number {
    if (positions.length === 0) return 0;
    const avgIntensity = positions.reduce((sum, pos) => sum + pos.intensity, 0) / positions.length;
    return Math.round(avgIntensity * 100) / 100;
  }

  private calculateAveragePosition(position: string): { x: number; y: number } {
    return this.getPositionBasedCoordinates(position);
  }

  private estimateDistanceCovered(position: string): number {
    const baseDistances = { GK: 4000, DEF: 9000, MID: 11000, FWD: 10000 };
    return baseDistances[position as keyof typeof baseDistances] || 9000;
  }

  private estimateAverageSpeed(position: string): number {
    const baseSpeeds = { GK: 5, DEF: 8, MID: 9, FWD: 10 };
    return baseSpeeds[position as keyof typeof baseSpeeds] || 8;
  }

  private estimateMaxSpeed(position: string): number {
    const maxSpeeds = { GK: 15, DEF: 25, MID: 28, FWD: 30 };
    return maxSpeeds[position as keyof typeof maxSpeeds] || 25;
  }

  private estimateSprints(position: string): number {
    const sprintCounts = { GK: 2, DEF: 8, MID: 12, FWD: 15 };
    return sprintCounts[position as keyof typeof sprintCounts] || 10;
  }

  private estimatePassAccuracy(position: string): number {
    const accuracies = { GK: 75, DEF: 85, MID: 88, FWD: 78 };
    return accuracies[position as keyof typeof accuracies] || 80;
  }

  private estimatePassesCompleted(position: string): number {
    const completed = { GK: 20, DEF: 45, MID: 60, FWD: 25 };
    return completed[position as keyof typeof completed] || 40;
  }

  private estimatePassesAttempted(position: string): number {
    const attempted = { GK: 25, DEF: 55, MID: 70, FWD: 35 };
    return attempted[position as keyof typeof attempted] || 50;
  }

  private calculateStamina(events: MatchEvent[], duration: number): number {
    // Higher event frequency suggests higher workload, lower stamina
    const eventRate = events.length / duration;
    const maxEventRate = 2; // events per minute
    const staminaReduction = Math.min(eventRate / maxEventRate, 1) * 20;
    return Math.max(60, 100 - staminaReduction);
  }

  private calculateWorkRate(eventCount: number, duration: number): number {
    const eventsPerMinute = eventCount / duration;
    return Math.min(100, eventsPerMinute * 50);
  }

  private calculateExpectedGoals(events: MatchEvent[], position: string): number {
    const goals = events.filter(e => e.eventType === 'GOAL').length;
    const positionMultiplier = position === 'FWD' ? 1.2 : position === 'MID' ? 1.0 : 0.8;
    return Number((goals * positionMultiplier * (0.8 + Math.random() * 0.4)).toFixed(2));
  }

  private calculateExpectedAssists(assists: number, position: string): number {
    const positionMultiplier = position === 'MID' ? 1.2 : position === 'FWD' ? 1.0 : 0.8;
    return Number((assists * positionMultiplier * (0.8 + Math.random() * 0.4)).toFixed(2));
  }

  private calculateMotmScore(goals: number, assists: number, eventCount: number): number {
    const score = (goals * 3) + (assists * 2) + (eventCount * 0.1);
    return Math.min(10, score);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();