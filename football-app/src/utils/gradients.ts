// Utility file for gradient colors to fix TypeScript issues

export type GradientColors = readonly string[];

// Stadium theme gradients  
export const STADIUM_GRADIENTS = {
  DARK_HEADER: ['#0A0E27', '#1A1F3A', '#2D3748'] as const,
  GREEN_PRIMARY: ['#4CAF50', '#2E7D32'] as const,
  GREEN_SUCCESS: ['rgba(76, 175, 80, 0.8)', 'rgba(46, 125, 50, 0.8)'] as const,
  GOLD_CAPTAIN: ['#FFD700', '#FFA500'] as const,
  RED_DANGER: ['#dc3545', '#c82333'] as const,
  BLUE_PRIMARY: ['#2196F3', '#1976D2'] as const,
  PURPLE_ACCENT: ['#9C27B0', '#7B1FA2'] as const,
  ORANGE_ACCENT: ['#FF9800', '#F57C00'] as const,
  
  // Position-based gradients
  GOALKEEPER: ['#9C27B0', '#673AB7'] as const,
  DEFENDER: ['#2196F3', '#1976D2'] as const,
  MIDFIELDER: ['#4CAF50', '#388E3C'] as const,
  FORWARD: ['#FF9800', '#F57C00'] as const,
  
  // Match status gradients
  LIVE_MATCH: ['#dc3545', '#c82333'] as const,
  SCHEDULED_MATCH: ['#6c757d', '#495057'] as const,
  COMPLETED_MATCH: ['#28a745', '#1e7e34'] as const,
  
  // Tournament type gradients
  LEAGUE: ['#17a2b8', '#138496'] as const,
  KNOCKOUT: ['#dc3545', '#c82333'] as const,
  GROUP_STAGE: ['#ffc107', '#e0a800'] as const,
  
  // Card backgrounds
  CARD_PRIMARY: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)'] as const,
  CARD_DARK: ['rgba(13, 17, 23, 0.95)', 'rgba(22, 27, 34, 0.9)'] as const,
  
  // Stadium field gradient
  FIELD: ['#2E7D32', '#1B5E20', '#0D4A11'] as const,
  FIELD_LINES: ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)'] as const,
} as const;

// Leaderboard position gradients
export const getPositionGradient = (position: number) => {
  switch (position) {
    case 1:
      return ['#FFD700', '#FFA500'] as const; // Gold
    case 2:
      return ['#C0C0C0', '#A8A8A8'] as const; // Silver
    case 3:
      return ['#CD7F32', '#8B4513'] as const; // Bronze
    default:
      return ['#6c757d', '#495057'] as const; // Default gray
  }
};

// Get gradient for team position in leaderboard
export const getTeamPositionGradient = (position: number) => {
  if (position <= 3) {
    return getPositionGradient(position);
  } else if (position <= 10) {
    return ['#28a745', '#1e7e34'] as const; // Green for top 10
  } else {
    return ['#6c757d', '#495057'] as const; // Gray for others
  }
};

// Get gradient for player position
export const getPlayerPositionGradient = (position: string) => {
  switch (position.toUpperCase()) {
    case 'GK':
    case 'GOALKEEPER':
      return STADIUM_GRADIENTS.GOALKEEPER;
    case 'DEF':
    case 'DEFENDER':
      return STADIUM_GRADIENTS.DEFENDER;
    case 'MID':
    case 'MIDFIELDER':
      return STADIUM_GRADIENTS.MIDFIELDER;
    case 'FWD':
    case 'FORWARD':
      return STADIUM_GRADIENTS.FORWARD;
    default:
      return STADIUM_GRADIENTS.GREEN_PRIMARY;
  }
};

// Get gradient for match status
export const getMatchStatusGradient = (status: string) => {
  switch (status.toUpperCase()) {
    case 'LIVE':
      return STADIUM_GRADIENTS.LIVE_MATCH;
    case 'SCHEDULED':
      return STADIUM_GRADIENTS.SCHEDULED_MATCH;
    case 'COMPLETED':
      return STADIUM_GRADIENTS.COMPLETED_MATCH;
    default:
      return STADIUM_GRADIENTS.SCHEDULED_MATCH;
  }
};

// Get gradient for tournament type
export const getTournamentTypeGradient = (type: string) => {
  switch (type.toUpperCase()) {
    case 'LEAGUE':
      return STADIUM_GRADIENTS.LEAGUE;
    case 'KNOCKOUT':
      return STADIUM_GRADIENTS.KNOCKOUT;
    case 'GROUP_STAGE':
      return STADIUM_GRADIENTS.GROUP_STAGE;
    default:
      return STADIUM_GRADIENTS.LEAGUE;
  }
};

// Export helper function to ensure proper typing
export const createGradient = (...colors: string[]) => {
  return colors as const;
};