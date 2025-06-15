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

// Position mapping to pitch coordinates (percentage of pitch)
const POSITION_COORDINATES: { [key: string]: { x: number; y: number } } = {
  // Goalkeeper
  'GK': { x: 50, y: 95 },
  
  // Defenders (4-back formation)
  'LB': { x: 15, y: 75 },  // Left Back
  'LCB': { x: 35, y: 80 }, // Left Center Back
  'RCB': { x: 65, y: 80 }, // Right Center Back
  'RB': { x: 85, y: 75 },  // Right Back
  'DEF': { x: 50, y: 80 }, // Generic Defender
  
  // Midfielders
  'LM': { x: 15, y: 50 },  // Left Midfielder
  'LCM': { x: 35, y: 55 }, // Left Center Mid
  'CM': { x: 50, y: 55 },  // Center Midfielder
  'RCM': { x: 65, y: 55 }, // Right Center Mid
  'RM': { x: 85, y: 50 },  // Right Midfielder
  'CDM': { x: 50, y: 65 }, // Defensive Midfielder
  'CAM': { x: 50, y: 40 }, // Attacking Midfielder
  'MID': { x: 50, y: 55 }, // Generic Midfielder
  
  // Forwards
  'LW': { x: 20, y: 25 },  // Left Winger
  'LF': { x: 35, y: 20 },  // Left Forward
  'CF': { x: 50, y: 15 },  // Center Forward
  'RF': { x: 65, y: 20 },  // Right Forward
  'RW': { x: 80, y: 25 },  // Right Winger
  'ST': { x: 50, y: 10 },  // Striker
  'FWD': { x: 50, y: 20 }, // Generic Forward
};

// Get position color
const getPositionColor = (position: string): string => {
  if (position === 'GK') return '#9C27B0';
  if (['DEF', 'LB', 'RB', 'LCB', 'RCB'].includes(position)) return '#2196F3';
  if (['MID', 'LM', 'RM', 'CM', 'LCM', 'RCM', 'CDM', 'CAM'].includes(position)) return '#4CAF50';
  if (['FWD', 'LW', 'RW', 'LF', 'RF', 'CF', 'ST'].includes(position)) return '#FF9800';
  return '#666';
};

// Smart position assignment for generic positions
const assignPositions = (players: Player[]) => {
  const assigned = [...players];
  const positions = ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LM', 'CM', 'RM', 'LW', 'CF', 'RW'];
  
  assigned.forEach((player, index) => {
    if (!POSITION_COORDINATES[player.position] && index < positions.length) {
      player.position = positions[index];
    }
  });
  
  return assigned;
};

export default function PitchFormation({ 
  homeTeam, 
  awayTeam, 
  onPlayerPress, 
  showPlayerNames = true,
  style 
}: PitchFormationProps) {
  
  if (!homeTeam || !awayTeam) {
    return (
      <View style={[styles.container, style]}>
        <Text style={{ color: '#999', textAlign: 'center' }}>Loading teams...</Text>
      </View>
    );
  }
  
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

  const renderPlayer = (player: Player, isHomeTeam: boolean) => {
    const coords = POSITION_COORDINATES[player.position] || { x: 50, y: 50 };
    
    // Flip coordinates for away team (they play from top)
    const x = isHomeTeam ? coords.x : (100 - coords.x);
    const y = isHomeTeam ? coords.y : (100 - coords.y);
    
    const playerX = (x / 100) * PITCH_WIDTH;
    const playerY = (y / 100) * PITCH_HEIGHT;
    
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

  const homeTeamPlayers = homeTeam?.players ? assignPositions(homeTeam.players) : [];
  const awayTeamPlayers = awayTeam?.players ? assignPositions(awayTeam.players) : [];

  return (
    <View style={[styles.container, style]}>
      {/* Team names */}
      <View style={styles.teamNamesContainer}>
        <Text style={styles.awayTeamName}>{awayTeam?.name || 'Away Team'}</Text>
        <Text style={styles.vsText}>VS</Text>
        <Text style={styles.homeTeamName}>{homeTeam?.name || 'Home Team'}</Text>
      </View>
      
      {/* Pitch with players */}
      <View style={styles.pitchContainer}>
        {renderPitch()}
        
        {/* Render players */}
        {homeTeamPlayers && homeTeamPlayers.map(player => renderPlayer(player, true))}
        {awayTeamPlayers && awayTeamPlayers.map(player => renderPlayer(player, false))}
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