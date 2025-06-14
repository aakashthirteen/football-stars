import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Line, G, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const PITCH_WIDTH = screenWidth - 40;
const PITCH_HEIGHT = PITCH_WIDTH * 1.5; // Football pitch ratio

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
  color?: string;
}

interface PitchFormationSplitProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  onPlayerPress?: (player: Player, teamType: 'home' | 'away') => void;
  showPlayerNames?: boolean;
  style?: any;
}

// Formation templates for better symmetry
const FORMATION_TEMPLATES = {
  '4-3-3': {
    defense: [20, 35, 65, 80], // LB, LCB, RCB, RB
    midfield: [25, 50, 75],     // LM, CM, RM
    forward: [25, 50, 75]        // LW, CF, RW
  },
  '4-4-2': {
    defense: [20, 35, 65, 80],
    midfield: [15, 35, 65, 85],
    forward: [35, 65]
  },
  '3-5-2': {
    defense: [25, 50, 75],
    midfield: [10, 30, 50, 70, 90],
    forward: [35, 65]
  },
  '4-2-3-1': {
    defense: [20, 35, 65, 80],
    midfield: [35, 65], // CDMs
    attacking: [20, 50, 80], // Wingers + CAM
    forward: [50]
  },
  '5-3-2': {
    defense: [15, 30, 50, 70, 85],
    midfield: [25, 50, 75],
    forward: [35, 65]
  }
};

// Base zones for different position types (percentage of pitch)
const HOME_ZONES = {
  goalkeeper: { y: 95 },
  defense: { y: 82 },
  midfield: { y: 65 },
  attacking: { y: 55 }, // For CAM in 4-2-3-1
  forward: { y: 50 }
};

const AWAY_ZONES = {
  goalkeeper: { y: 5 },
  defense: { y: 18 },
  midfield: { y: 35 },
  attacking: { y: 45 }, // For CAM in 4-2-3-1
  forward: { y: 50 }
};

// Get position color based on role
const getPositionColor = (position: string): string => {
  if (position === 'GK') return '#9C27B0';
  if (['DEF', 'LB', 'RB', 'LCB', 'RCB', 'CB'].includes(position)) return '#2196F3';
  if (['MID', 'LM', 'RM', 'CM', 'LCM', 'RCM', 'CDM', 'CAM'].includes(position)) return '#4CAF50';
  if (['FWD', 'LW', 'RW', 'LF', 'RF', 'CF', 'ST'].includes(position)) return '#FF9800';
  return '#666';
};

// Categorize players by their roles
const categorizePlayer = (position: string): string => {
  if (position === 'GK') return 'goalkeeper';
  if (['LB', 'RB', 'LCB', 'RCB', 'CB', 'DEF'].includes(position)) return 'defense';
  if (['CDM', 'LCM', 'RCM'].includes(position)) return 'midfield';
  if (['CAM', 'LAM', 'RAM'].includes(position)) return 'attacking';
  if (['LM', 'RM', 'CM', 'MID'].includes(position)) return 'midfield';
  if (['LW', 'RW', 'LF', 'RF', 'CF', 'ST', 'FWD'].includes(position)) return 'forward';
  return 'midfield';
};

// Sort players by position for consistent ordering
const sortPlayersByPosition = (players: Player[], category: string): Player[] => {
  const positionOrder: { [key: string]: string[] } = {
    defense: ['LB', 'LCB', 'CB', 'RCB', 'RB', 'DEF'],
    midfield: ['LM', 'LCM', 'CDM', 'CM', 'RCM', 'RM', 'MID'],
    attacking: ['LAM', 'CAM', 'RAM'],
    forward: ['LW', 'LF', 'CF', 'RF', 'RW', 'ST', 'FWD']
  };
  
  const order = positionOrder[category] || [];
  return players.sort((a, b) => {
    const aIndex = order.indexOf(a.position);
    const bIndex = order.indexOf(b.position);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

// Calculate symmetric positions for players
const calculateSymmetricPositions = (players: Player[], isHomeTeam: boolean) => {
  const zones = isHomeTeam ? HOME_ZONES : AWAY_ZONES;
  const positionedPlayers: Array<Player & { x: number; y: number }> = [];
  
  // Categorize players
  const playersByCategory: { [key: string]: Player[] } = {
    goalkeeper: [],
    defense: [],
    midfield: [],
    attacking: [],
    forward: []
  };
  
  players.forEach(player => {
    const category = categorizePlayer(player.position);
    playersByCategory[category].push(player);
  });
  
  // Sort players within each category
  Object.keys(playersByCategory).forEach(category => {
    playersByCategory[category] = sortPlayersByPosition(playersByCategory[category], category);
  });
  
  // Detect formation
  const defCount = playersByCategory.defense.length;
  const midCount = playersByCategory.midfield.length;
  const fwdCount = playersByCategory.forward.length;
  const atkCount = playersByCategory.attacking.length;
  
  let formationKey = `${defCount}-${midCount + atkCount}-${fwdCount}`;
  if (!FORMATION_TEMPLATES[formationKey]) {
    // Fallback to closest formation
    if (defCount === 4 && (midCount + atkCount) === 3 && fwdCount === 3) formationKey = '4-3-3';
    else if (defCount === 4 && (midCount + atkCount) === 4 && fwdCount === 2) formationKey = '4-4-2';
    else formationKey = '4-3-3'; // Default
  }
  
  // Position players symmetrically
  Object.entries(playersByCategory).forEach(([category, categoryPlayers]) => {
    if (categoryPlayers.length === 0) return;
    
    const y = zones[category as keyof typeof zones]?.y || 50;
    
    if (category === 'goalkeeper') {
      // Center the goalkeeper
      categoryPlayers.forEach(player => {
        positionedPlayers.push({ ...player, x: 50, y });
      });
    } else {
      // Use symmetric positioning
      const positions = getSymmetricXPositions(categoryPlayers.length);
      categoryPlayers.forEach((player, index) => {
        positionedPlayers.push({
          ...player,
          x: positions[index],
          y: y + (index % 2 === 0 ? -1 : 1) // Slight Y variation
        });
      });
    }
  });
  
  return positionedPlayers;
};

// Get symmetric X positions for a given number of players
const getSymmetricXPositions = (count: number): number[] => {
  switch (count) {
    case 1: return [50];
    case 2: return [35, 65];
    case 3: return [25, 50, 75];
    case 4: return [20, 35, 65, 80];
    case 5: return [15, 30, 50, 70, 85];
    case 6: return [15, 25, 40, 60, 75, 85];
    case 7: return [10, 20, 35, 50, 65, 80, 90];
    case 8: return [10, 20, 30, 40, 60, 70, 80, 90];
    default: {
      // For more than 8, create even spacing
      const positions: number[] = [];
      const spacing = 80 / (count + 1);
      for (let i = 1; i <= count; i++) {
        positions.push(10 + spacing * i);
      }
      return positions;
    }
  }
};

// Detect formation based on player positions
const detectFormation = (players: Player[]): string => {
  const playersByCategory: { [key: string]: number } = {
    goalkeeper: 0,
    defense: 0,
    midfield: 0,
    attacking: 0,
    forward: 0
  };
  
  players.forEach(player => {
    const category = categorizePlayer(player.position);
    playersByCategory[category]++;
  });
  
  const def = playersByCategory.defense;
  const mid = playersByCategory.midfield + playersByCategory.attacking;
  const fwd = playersByCategory.forward;
  
  return `${def}-${mid}-${fwd}`;
};

export default function PitchFormationSplit({ 
  homeTeam, 
  awayTeam, 
  homeScore = 0,
  awayScore = 0,
  onPlayerPress, 
  showPlayerNames = true,
  style 
}: PitchFormationSplitProps) {
  
  const renderSplitPitch = () => (
    <Svg width={PITCH_WIDTH} height={PITCH_HEIGHT} style={styles.pitch}>
      <Defs>
        <SvgLinearGradient id="homeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#1E5128" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#2E7D32" stopOpacity="1" />
        </SvgLinearGradient>
        <SvgLinearGradient id="awayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#2E7D32" stopOpacity="1" />
          <Stop offset="100%" stopColor="#1E5128" stopOpacity="0.9" />
        </SvgLinearGradient>
      </Defs>
      
      {/* Home team half (bottom) */}
      <Rect 
        x="0" 
        y={PITCH_HEIGHT / 2} 
        width={PITCH_WIDTH} 
        height={PITCH_HEIGHT / 2} 
        fill="url(#homeGradient)" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Away team half (top) */}
      <Rect 
        x="0" 
        y="0" 
        width={PITCH_WIDTH} 
        height={PITCH_HEIGHT / 2} 
        fill="url(#awayGradient)" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Center line */}
      <Line 
        x1="0" 
        y1={PITCH_HEIGHT / 2} 
        x2={PITCH_WIDTH} 
        y2={PITCH_HEIGHT / 2} 
        stroke="#fff" 
        strokeWidth="3"
        strokeDasharray="10,5"
      />
      
      {/* Center circle */}
      <Circle 
        cx={PITCH_WIDTH / 2} 
        cy={PITCH_HEIGHT / 2} 
        r="40" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Center spot */}
      <Circle 
        cx={PITCH_WIDTH / 2} 
        cy={PITCH_HEIGHT / 2} 
        r="3" 
        fill="#fff"
      />
      
      {/* Home penalty area */}
      <Rect 
        x={PITCH_WIDTH * 0.2} 
        y={PITCH_HEIGHT - 60} 
        width={PITCH_WIDTH * 0.6} 
        height="50" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Home goal area */}
      <Rect 
        x={PITCH_WIDTH * 0.35} 
        y={PITCH_HEIGHT - 30} 
        width={PITCH_WIDTH * 0.3} 
        height="20" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Away penalty area */}
      <Rect 
        x={PITCH_WIDTH * 0.2} 
        y="10" 
        width={PITCH_WIDTH * 0.6} 
        height="50" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Away goal area */}
      <Rect 
        x={PITCH_WIDTH * 0.35} 
        y="10" 
        width={PITCH_WIDTH * 0.3} 
        height="20" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Penalty spots */}
      <Circle cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT - 45} r="2" fill="#fff" />
      <Circle cx={PITCH_WIDTH / 2} cy="45" r="2" fill="#fff" />
    </Svg>
  );

  const renderPlayer = (player: Player & { x: number; y: number }, isHomeTeam: boolean) => {
    const playerX = (player.x / 100) * PITCH_WIDTH;
    const playerY = (player.y / 100) * PITCH_HEIGHT;
    
    return (
      <TouchableOpacity
        key={player.id}
        style={[
          styles.playerCircle,
          {
            left: playerX - 25,
            top: playerY - 25,
            backgroundColor: getPositionColor(player.position),
            borderColor: isHomeTeam ? (homeTeam.color || '#fff') : (awayTeam.color || '#fff'),
          }
        ]}
        onPress={() => onPlayerPress?.(player, isHomeTeam ? 'home' : 'away')}
        activeOpacity={0.8}
      >
        <Text style={styles.jerseyNumber}>
          {player.jerseyNumber || player.name?.charAt(0) || '?'}
        </Text>
        {showPlayerNames && (
          <View style={styles.playerNameContainer}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name?.split(' ')[0] || 'Player'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const homeTeamPlayers = calculateSymmetricPositions(homeTeam.players || [], true);
  const awayTeamPlayers = calculateSymmetricPositions(awayTeam.players || [], false);
  
  const homeFormation = detectFormation(homeTeam.players || []);
  const awayFormation = detectFormation(awayTeam.players || []);

  return (
    <View style={[styles.container, style]}>
      {/* Score Display */}
      <View style={styles.scoreBoard}>
        <View style={styles.teamScore}>
          <Text style={styles.teamScoreName}>{awayTeam.name}</Text>
          <Text style={styles.scoreNumber}>{awayScore}</Text>
        </View>
        
        <View style={styles.scoreCenter}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.matchStatus}>FULL TIME</Text>
        </View>
        
        <View style={styles.teamScore}>
          <Text style={styles.teamScoreName}>{homeTeam.name}</Text>
          <Text style={styles.scoreNumber}>{homeScore}</Text>
        </View>
      </View>
      
      {/* Pitch with players */}
      <View style={styles.pitchContainer}>
        {renderSplitPitch()}
        
        {/* Render players */}
        {homeTeamPlayers.map(player => renderPlayer(player, true))}
        {awayTeamPlayers.map(player => renderPlayer(player, false))}
        
        {/* Team indicators */}
        <View style={styles.teamIndicatorTop}>
          <Text style={styles.teamIndicatorText}>{awayTeam.name}</Text>
        </View>
        
        <View style={styles.teamIndicatorBottom}>
          <Text style={styles.teamIndicatorText}>{homeTeam.name}</Text>
        </View>
      </View>
      
      {/* Formation info */}
      <View style={styles.formationInfo}>
        <View style={styles.formationItem}>
          <Text style={styles.formationLabel}>Formation</Text>
          <Text style={styles.formationValue}>{awayFormation}</Text>
        </View>
        <View style={styles.formationDivider} />
        <View style={styles.formationItem}>
          <Text style={styles.formationLabel}>Formation</Text>
          <Text style={styles.formationValue}>{homeFormation}</Text>
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
          <Text style={styles.legendText}>GK</Text>
          
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>DEF</Text>
          
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>MID</Text>
          
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>FWD</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0A0E27',
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  teamScore: {
    flex: 1,
    alignItems: 'center',
  },
  teamScoreName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreCenter: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  matchStatus: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  pitchContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  pitch: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  playerCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  jerseyNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerNameContainer: {
    position: 'absolute',
    top: 54,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 60,
  },
  playerName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  teamIndicatorTop: {
    position: 'absolute',
    top: 10,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  teamIndicatorBottom: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  teamIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  formationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  formationItem: {
    flex: 1,
    alignItems: 'center',
  },
  formationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  formationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  formationDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  legend: {
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
});