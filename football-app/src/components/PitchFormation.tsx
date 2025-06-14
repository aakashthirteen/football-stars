import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Circle, Line, G } from 'react-native-svg';

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
}

interface PitchFormationProps {
  homeTeam: Team;
  awayTeam: Team;
  onPlayerPress?: (player: Player) => void;
  showPlayerNames?: boolean;
  style?: any;
}

// Position categories and their base zones
const POSITION_ZONES = {
  GK: { positions: ['GK'], zone: 'goalkeeper' },
  DEF: { positions: ['LB', 'LCB', 'CB', 'RCB', 'RB', 'DEF'], zone: 'defense' },
  MID: { positions: ['LM', 'LCM', 'CM', 'RCM', 'RM', 'CDM', 'CAM', 'MID'], zone: 'midfield' },
  FWD: { positions: ['LW', 'LF', 'CF', 'RF', 'RW', 'ST', 'FWD'], zone: 'forward' }
};

// Base zones for different position types (percentage of pitch)
const HOME_ZONES = {
  goalkeeper: { xRange: [40, 60], yRange: [92, 98] },
  defense: { xRange: [10, 90], yRange: [75, 85] },
  midfield: { xRange: [10, 90], yRange: [50, 65] },
  forward: { xRange: [15, 85], yRange: [30, 40] }
};

const AWAY_ZONES = {
  goalkeeper: { xRange: [40, 60], yRange: [2, 8] },
  defense: { xRange: [10, 90], yRange: [15, 25] },
  midfield: { xRange: [10, 90], yRange: [35, 50] },
  forward: { xRange: [15, 85], yRange: [60, 70] }
};

// Get position color
const getPositionColor = (position: string): string => {
  if (position === 'GK') return '#9C27B0';
  if (['DEF', 'LB', 'RB', 'LCB', 'RCB', 'CB'].includes(position)) return '#2196F3';
  if (['MID', 'LM', 'RM', 'CM', 'LCM', 'RCM', 'CDM', 'CAM'].includes(position)) return '#4CAF50';
  if (['FWD', 'LW', 'RW', 'LF', 'RF', 'CF', 'ST'].includes(position)) return '#FF9800';
  return '#666';
};

// Find which zone a position belongs to
const getPositionZone = (position: string): string => {
  for (const [key, value] of Object.entries(POSITION_ZONES)) {
    if (value.positions.includes(position)) {
      return value.zone;
    }
  }
  // Default to midfield if position not found
  return 'midfield';
};

// Dynamically calculate positions for players
const calculatePlayerPositions = (players: Player[], isHomeTeam: boolean) => {
  const zones = isHomeTeam ? HOME_ZONES : AWAY_ZONES;
  const positionedPlayers: Array<Player & { x: number; y: number }> = [];
  
  // Group players by zone
  const playersByZone: { [key: string]: Player[] } = {
    goalkeeper: [],
    defense: [],
    midfield: [],
    forward: []
  };
  
  players.forEach(player => {
    const zone = getPositionZone(player.position);
    playersByZone[zone].push(player);
  });
  
  // Calculate positions for each zone
  Object.entries(playersByZone).forEach(([zoneName, zonePlayers]) => {
    if (zonePlayers.length === 0) return;
    
    const zone = zones[zoneName as keyof typeof zones];
    const playerCount = zonePlayers.length;
    
    // Calculate spacing
    const xRange = zone.xRange[1] - zone.xRange[0];
    const yRange = zone.yRange[1] - zone.yRange[0];
    
    if (playerCount === 1) {
      // Single player - center them
      positionedPlayers.push({
        ...zonePlayers[0],
        x: (zone.xRange[0] + zone.xRange[1]) / 2,
        y: (zone.yRange[0] + zone.yRange[1]) / 2
      });
    } else if (playerCount <= 5) {
      // Multiple players - spread them horizontally
      const xStep = xRange / (playerCount + 1);
      const yCenter = (zone.yRange[0] + zone.yRange[1]) / 2;
      
      zonePlayers.forEach((player, index) => {
        // Add slight y variation for visual appeal
        const yVariation = (index % 2 === 0 ? -2 : 2) * (zoneName === 'goalkeeper' ? 0 : 1);
        positionedPlayers.push({
          ...player,
          x: zone.xRange[0] + xStep * (index + 1),
          y: yCenter + yVariation
        });
      });
    } else {
      // Many players - create two rows
      const playersPerRow = Math.ceil(playerCount / 2);
      const xStep = xRange / (playersPerRow + 1);
      const yStep = yRange / 3;
      
      zonePlayers.forEach((player, index) => {
        const row = Math.floor(index / playersPerRow);
        const col = index % playersPerRow;
        
        positionedPlayers.push({
          ...player,
          x: zone.xRange[0] + xStep * (col + 1),
          y: zone.yRange[0] + yStep * (row + 1)
        });
      });
    }
  });
  
  return positionedPlayers;
};

export default function PitchFormation({ 
  homeTeam, 
  awayTeam, 
  onPlayerPress, 
  showPlayerNames = true,
  style 
}: PitchFormationProps) {
  
  const renderPitch = () => (
    <Svg width={PITCH_WIDTH} height={PITCH_HEIGHT} style={styles.pitch}>
      {/* Pitch background */}
      <Rect 
        x="0" 
        y="0" 
        width={PITCH_WIDTH} 
        height={PITCH_HEIGHT} 
        fill="#2E7D32" 
        stroke="#fff" 
        strokeWidth="2"
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
      
      {/* Center line */}
      <Line 
        x1="0" 
        y1={PITCH_HEIGHT / 2} 
        x2={PITCH_WIDTH} 
        y2={PITCH_HEIGHT / 2} 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Goal areas */}
      {/* Home goal area */}
      <Rect 
        x={PITCH_WIDTH * 0.3} 
        y={PITCH_HEIGHT - 40} 
        width={PITCH_WIDTH * 0.4} 
        height="30" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="2"
      />
      
      {/* Away goal area */}
      <Rect 
        x={PITCH_WIDTH * 0.3} 
        y="10" 
        width={PITCH_WIDTH * 0.4} 
        height="30" 
        fill="none" 
        stroke="#fff" 
        strokeWidth="2"
      />
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
            left: playerX - 20,
            top: playerY - 20,
            backgroundColor: getPositionColor(player.position),
          }
        ]}
        onPress={() => onPlayerPress?.(player)}
      >
        <Text style={styles.jerseyNumber}>
          {player.jerseyNumber || player.name?.split(' ')[0]?.charAt(0) || '?'}
        </Text>
        {showPlayerNames && (
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name?.split(' ')[0] || 'Player'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const homeTeamPlayers = calculatePlayerPositions(homeTeam.players || [], true);
  const awayTeamPlayers = calculatePlayerPositions(awayTeam.players || [], false);

  return (
    <View style={[styles.container, style]}>
      {/* Team names */}
      <View style={styles.teamNamesContainer}>
        <Text style={styles.awayTeamName}>{awayTeam.name}</Text>
        <Text style={styles.vsText}>VS</Text>
        <Text style={styles.homeTeamName}>{homeTeam.name}</Text>
      </View>
      
      {/* Pitch with players */}
      <View style={styles.pitchContainer}>
        {renderPitch()}
        
        {/* Render players */}
        {homeTeamPlayers.map(player => renderPlayer(player, true))}
        {awayTeamPlayers.map(player => renderPlayer(player, false))}
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
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  teamNamesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  awayTeamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    flex: 1,
    textAlign: 'center',
  },
  homeTeamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
  },
  pitchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  pitch: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  playerCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  jerseyNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerName: {
    position: 'absolute',
    top: 45,
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 30,
    textAlign: 'center',
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
    color: '#666',
    fontWeight: '600',
  },
});