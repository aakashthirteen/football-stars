import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Rect, Circle, Line, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { Colors } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');
const PITCH_WIDTH = screenWidth - 40;
const PITCH_HEIGHT = PITCH_WIDTH * 1.4; // Slightly less tall for better view

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

// Smart Formation System
const FORMATION_TEMPLATES = {
  '4-4-2': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 20, y: 75 },
    { pos: 'CB', x: 35, y: 78 },
    { pos: 'CB', x: 65, y: 78 },
    { pos: 'RB', x: 80, y: 75 },
    { pos: 'LM', x: 20, y: 50 },
    { pos: 'CM', x: 35, y: 52 },
    { pos: 'CM', x: 65, y: 52 },
    { pos: 'RM', x: 80, y: 50 },
    { pos: 'ST', x: 35, y: 20 },
    { pos: 'ST', x: 65, y: 20 }
  ],
  '4-3-3': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 18, y: 75 },
    { pos: 'CB', x: 38, y: 78 },
    { pos: 'CB', x: 62, y: 78 },
    { pos: 'RB', x: 82, y: 75 },
    { pos: 'CM', x: 30, y: 55 },
    { pos: 'CM', x: 50, y: 58 },
    { pos: 'CM', x: 70, y: 55 },
    { pos: 'LW', x: 25, y: 25 },
    { pos: 'ST', x: 50, y: 18 },
    { pos: 'RW', x: 75, y: 25 }
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'CB', x: 30, y: 78 },
    { pos: 'CB', x: 50, y: 80 },
    { pos: 'CB', x: 70, y: 78 },
    { pos: 'LWB', x: 15, y: 55 },
    { pos: 'CM', x: 35, y: 58 },
    { pos: 'CM', x: 50, y: 60 },
    { pos: 'CM', x: 65, y: 58 },
    { pos: 'RWB', x: 85, y: 55 },
    { pos: 'ST', x: 38, y: 22 },
    { pos: 'ST', x: 62, y: 22 }
  ]
};

// Position categories for color coding
const POSITION_GROUPS = {
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LCB', 'RCB', 'DEF'],
  MID: ['CM', 'LM', 'RM', 'CDM', 'CAM', 'MID', 'LWB', 'RWB'],
  FWD: ['ST', 'CF', 'LW', 'RW', 'FWD']
};

// Get position group
const getPositionGroup = (position: string): string => {
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.includes(position)) return group;
  }
  return 'MID'; // Default
};

// Intelligent position assignment
const assignPlayerPositions = (players: Player[], isHomeTeam: boolean) => {
  // Count players by position group
  const groupCounts = {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0
  };
  
  players.forEach(player => {
    const group = getPositionGroup(player.position);
    groupCounts[group as keyof typeof groupCounts]++;
  });
  
  // Determine best formation
  let formation = '4-4-2';
  if (groupCounts.DEF >= 4 && groupCounts.MID >= 3 && groupCounts.FWD >= 3) {
    formation = '4-3-3';
  } else if (groupCounts.DEF === 3 && groupCounts.MID >= 5) {
    formation = '3-5-2';
  }
  
  const template = FORMATION_TEMPLATES[formation as keyof typeof FORMATION_TEMPLATES];
  const assignedPositions: Array<{ player: Player; x: number; y: number }> = [];
  const usedTemplateIndexes = new Set<number>();
  
  // First pass: Assign by exact position match
  players.forEach(player => {
    const group = getPositionGroup(player.position);
    
    // Find matching template position
    const templateIndex = template.findIndex((t, idx) => 
      !usedTemplateIndexes.has(idx) && 
      getPositionGroup(t.pos) === group
    );
    
    if (templateIndex !== -1) {
      const templatePos = template[templateIndex];
      assignedPositions.push({
        player,
        x: templatePos.x,
        y: isHomeTeam ? templatePos.y : (100 - templatePos.y)
      });
      usedTemplateIndexes.add(templateIndex);
    }
  });
  
  // Second pass: Assign remaining players
  players.forEach(player => {
    if (!assignedPositions.find(ap => ap.player.id === player.id)) {
      // Find any unused position
      const templateIndex = template.findIndex((_, idx) => !usedTemplateIndexes.has(idx));
      if (templateIndex !== -1) {
        const templatePos = template[templateIndex];
        assignedPositions.push({
          player,
          x: templatePos.x,
          y: isHomeTeam ? templatePos.y : (100 - templatePos.y)
        });
        usedTemplateIndexes.add(templateIndex);
      }
    }
  });
  
  return { positions: assignedPositions, formation };
};

export default function ModernPitchFormation({ 
  homeTeam, 
  awayTeam, 
  onPlayerPress, 
  showPlayerNames = true,
  style 
}: PitchFormationProps) {
  
  const { positions: homePositions, formation: homeFormation } = assignPlayerPositions(homeTeam.players || [], true);
  const { positions: awayPositions, formation: awayFormation } = assignPlayerPositions(awayTeam.players || [], false);
  
  const renderModernPitch = () => (
    <Svg width={PITCH_WIDTH} height={PITCH_HEIGHT} style={styles.pitch}>
      <Defs>
        <LinearGradient id="fieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#1B5E20" />
          <Stop offset="50%" stopColor="#2E7D32" />
          <Stop offset="100%" stopColor="#1B5E20" />
        </LinearGradient>
        <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <Stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
          <Stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </Defs>
      
      {/* Field background */}
      <Rect x="0" y="0" width={PITCH_WIDTH} height={PITCH_HEIGHT} fill="url(#fieldGradient)" />
      
      {/* Field pattern stripes */}
      {[...Array(10)].map((_, i) => (
        <Rect
          key={i}
          x="0"
          y={i * (PITCH_HEIGHT / 10)}
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT / 20}
          fill={i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"}
        />
      ))}
      
      {/* Field outline */}
      <Rect 
        x="2" y="2" 
        width={PITCH_WIDTH - 4} 
        height={PITCH_HEIGHT - 4} 
        fill="none" 
        stroke="url(#lineGradient)" 
        strokeWidth="3"
      />
      
      {/* Center line */}
      <Line 
        x1="2" y1={PITCH_HEIGHT / 2} 
        x2={PITCH_WIDTH - 2} y2={PITCH_HEIGHT / 2} 
        stroke="url(#lineGradient)" 
        strokeWidth="3"
      />
      
      {/* Center circle */}
      <Circle 
        cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT / 2} 
        r="45" 
        fill="none" 
        stroke="url(#lineGradient)" 
        strokeWidth="3"
      />
      <Circle 
        cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT / 2} 
        r="3" 
        fill="rgba(255,255,255,0.8)"
      />
      
      {/* Penalty areas */}
      <Rect 
        x={PITCH_WIDTH * 0.15} y={PITCH_HEIGHT - 70} 
        width={PITCH_WIDTH * 0.7} height="68" 
        fill="none" 
        stroke="url(#lineGradient)" 
        strokeWidth="3"
      />
      <Rect 
        x={PITCH_WIDTH * 0.15} y="2" 
        width={PITCH_WIDTH * 0.7} height="68" 
        fill="none" 
        stroke="url(#lineGradient)" 
        strokeWidth="3"
      />
      
      {/* Goal areas */}
      <Rect 
        x={PITCH_WIDTH * 0.35} y={PITCH_HEIGHT - 35} 
        width={PITCH_WIDTH * 0.3} height="33" 
        fill="none" 
        stroke="url(#lineGradient)" 
        strokeWidth="3"
      />
      <Rect 
        x={PITCH_WIDTH * 0.35} y="2" 
        width={PITCH_WIDTH * 0.3} height="33" 
        fill="none" 
        stroke="url(#lineGradient)" 
        strokeWidth="3"
      />
      
      {/* Penalty spots */}
      <Circle cx={PITCH_WIDTH / 2} cy={55} r="2" fill="rgba(255,255,255,0.8)" />
      <Circle cx={PITCH_WIDTH / 2} cy={PITCH_HEIGHT - 55} r="2" fill="rgba(255,255,255,0.8)" />
    </Svg>
  );

  const renderPlayer = ({ player, x, y }: { player: Player; x: number; y: number }, isHomeTeam: boolean) => {
    const playerX = (x / 100) * PITCH_WIDTH;
    const playerY = (y / 100) * PITCH_HEIGHT;
    
    const position = player.position.toUpperCase();
    const group = getPositionGroup(position);
    
    let bgColor = Colors.primary.main;
    if (group === 'GK') bgColor = Colors.secondary.main;
    else if (group === 'DEF') bgColor = Colors.teams.home;
    else if (group === 'FWD') bgColor = Colors.teams.away;
    
    if (!isHomeTeam) {
      bgColor = group === 'GK' ? Colors.secondary.dark : Colors.background.elevated;
    }
    
    return (
      <TouchableOpacity
        key={player.id}
        style={[
          styles.playerContainer,
          { left: playerX - 22, top: playerY - 22 }
        ]}
        onPress={() => onPlayerPress?.(player)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.playerCircle,
          { 
            backgroundColor: bgColor,
            borderColor: isHomeTeam ? Colors.primary.light : Colors.glass.borderLight
          }
        ]}>
          <Text style={styles.jerseyNumber}>
            {player.jerseyNumber || player.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        {showPlayerNames && (
          <View style={styles.nameContainer}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name?.split(' ')[0] || 'Player'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header with team names and formations */}
      <View style={styles.header}>
        <View style={styles.teamInfo}>
          <Text style={styles.awayTeamName}>{awayTeam.name}</Text>
          <Text style={styles.formationBadge}>{awayFormation}</Text>
        </View>
        
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        
        <View style={styles.teamInfo}>
          <Text style={styles.homeTeamName}>{homeTeam.name}</Text>
          <Text style={styles.formationBadge}>{homeFormation}</Text>
        </View>
      </View>
      
      {/* Pitch with players */}
      <View style={styles.pitchWrapper}>
        {renderModernPitch()}
        {homePositions.map(pos => renderPlayer(pos, true))}
        {awayPositions.map(pos => renderPlayer(pos, false))}
      </View>
      
      {/* Modern legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.secondary.main }]} />
          <Text style={styles.legendText}>GK</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.teams.home }]} />
          <Text style={styles.legendText}>DEF</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary.main }]} />
          <Text style={styles.legendText}>MID</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.teams.away }]} />
          <Text style={styles.legendText}>FWD</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.medium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
  },
  awayTeamName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  homeTeamName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary.main,
    marginBottom: 4,
  },
  formationBadge: {
    fontSize: 12,
    color: Colors.text.secondary,
    backgroundColor: Colors.background.elevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
  },
  pitchWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  pitch: {
    borderRadius: 16,
  },
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  playerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  jerseyNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  nameContainer: {
    position: 'absolute',
    top: 48,
    backgroundColor: Colors.background.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    minWidth: 60,
  },
  playerName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.border,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  legendText: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
