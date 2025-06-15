import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  Ellipse, 
  Path,
  Text as SvgText,
  G,
  Defs,
  Pattern 
} from 'react-native-svg';
import { MatchesStackParamList } from '../../navigation/MatchesStack';

type TeamFormationScreenNavigationProp = StackNavigationProp<
  MatchesStackParamList,
  'TeamFormation'
>;
type TeamFormationScreenRouteProp = RouteProp<
  MatchesStackParamList,
  'TeamFormation'
>;

interface Props {
  navigation: TeamFormationScreenNavigationProp;
  route: TeamFormationScreenRouteProp;
}

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
  x?: number; // Position on pitch (0-100)
  y?: number; // Position on pitch (0-100)
}

interface Formation {
  id: string;
  name: string;
  gameFormat: '5v5' | '7v7' | '11v11';
  playerCount: number;
  positions: Array<{ x: number; y: number; position: string }>;
}

interface GameFormat {
  id: string;
  name: string;
  playerCount: number;
  pitchType: 'small' | 'medium' | 'full';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const PITCH_WIDTH = screenWidth - 40;
const PITCH_HEIGHT = (PITCH_WIDTH * 1.4); // Rotated pitch ratio (portrait)

const GAME_FORMATS: GameFormat[] = [
  { id: '5v5', name: '5 vs 5', playerCount: 5, pitchType: 'small' },
  { id: '7v7', name: '7 vs 7', playerCount: 7, pitchType: 'medium' },
  { id: '11v11', name: '11 vs 11', playerCount: 11, pitchType: 'full' },
];

const FORMATIONS: Record<string, Formation[]> = {
  '5v5': [
    {
      id: '1-2-1',
      name: '1-2-1',
      gameFormat: '5v5',
      playerCount: 5,
      positions: [
        { x: 50, y: 10, position: 'GK' },
        { x: 30, y: 35, position: 'DEF' },
        { x: 70, y: 35, position: 'DEF' },
        { x: 50, y: 60, position: 'MID' },
        { x: 50, y: 85, position: 'FWD' },
      ],
    },
    {
      id: '1-1-2',
      name: '1-1-2',
      gameFormat: '5v5',
      playerCount: 5,
      positions: [
        { x: 50, y: 10, position: 'GK' },
        { x: 50, y: 35, position: 'DEF' },
        { x: 30, y: 60, position: 'MID' },
        { x: 70, y: 60, position: 'MID' },
        { x: 50, y: 85, position: 'FWD' },
      ],
    },
    {
      id: '1-3-0',
      name: '1-3-0',
      gameFormat: '5v5',
      playerCount: 5,
      positions: [
        { x: 50, y: 10, position: 'GK' },
        { x: 25, y: 45, position: 'DEF' },
        { x: 50, y: 45, position: 'DEF' },
        { x: 75, y: 45, position: 'DEF' },
        { x: 50, y: 75, position: 'MID' },
      ],
    },
  ],
  '7v7': [
    {
      id: '1-3-2',
      name: '1-3-2',
      gameFormat: '7v7',
      playerCount: 7,
      positions: [
        { x: 50, y: 10, position: 'GK' },
        { x: 25, y: 30, position: 'DEF' },
        { x: 50, y: 30, position: 'DEF' },
        { x: 75, y: 30, position: 'DEF' },
        { x: 35, y: 55, position: 'MID' },
        { x: 65, y: 55, position: 'MID' },
        { x: 50, y: 80, position: 'FWD' },
      ],
    },
    {
      id: '1-2-3',
      name: '1-2-3',
      gameFormat: '7v7',
      playerCount: 7,
      positions: [
        { x: 50, y: 10, position: 'GK' },
        { x: 35, y: 30, position: 'DEF' },
        { x: 65, y: 30, position: 'DEF' },
        { x: 25, y: 55, position: 'MID' },
        { x: 50, y: 55, position: 'MID' },
        { x: 75, y: 55, position: 'MID' },
        { x: 50, y: 80, position: 'FWD' },
      ],
    },
    {
      id: '1-4-1',
      name: '1-4-1',
      gameFormat: '7v7',
      playerCount: 7,
      positions: [
        { x: 50, y: 10, position: 'GK' },
        { x: 20, y: 35, position: 'DEF' },
        { x: 40, y: 35, position: 'DEF' },
        { x: 60, y: 35, position: 'DEF' },
        { x: 80, y: 35, position: 'DEF' },
        { x: 50, y: 60, position: 'MID' },
        { x: 50, y: 85, position: 'FWD' },
      ],
    },
  ],
  '11v11': [
    {
      id: '4-4-2',
      name: '4-4-2',
      gameFormat: '11v11',
      playerCount: 11,
      positions: [
        { x: 50, y: 8, position: 'GK' },
        { x: 20, y: 25, position: 'DEF' },
        { x: 40, y: 25, position: 'DEF' },
        { x: 60, y: 25, position: 'DEF' },
        { x: 80, y: 25, position: 'DEF' },
        { x: 20, y: 50, position: 'MID' },
        { x: 40, y: 50, position: 'MID' },
        { x: 60, y: 50, position: 'MID' },
        { x: 80, y: 50, position: 'MID' },
        { x: 35, y: 75, position: 'FWD' },
        { x: 65, y: 75, position: 'FWD' },
      ],
    },
    {
      id: '4-3-3',
      name: '4-3-3',
      gameFormat: '11v11',
      playerCount: 11,
      positions: [
        { x: 50, y: 8, position: 'GK' },
        { x: 20, y: 25, position: 'DEF' },
        { x: 40, y: 25, position: 'DEF' },
        { x: 60, y: 25, position: 'DEF' },
        { x: 80, y: 25, position: 'DEF' },
        { x: 30, y: 50, position: 'MID' },
        { x: 50, y: 50, position: 'MID' },
        { x: 70, y: 50, position: 'MID' },
        { x: 25, y: 75, position: 'FWD' },
        { x: 50, y: 75, position: 'FWD' },
        { x: 75, y: 75, position: 'FWD' },
      ],
    },
    {
      id: '3-5-2',
      name: '3-5-2',
      gameFormat: '11v11',
      playerCount: 11,
      positions: [
        { x: 50, y: 8, position: 'GK' },
        { x: 30, y: 25, position: 'DEF' },
        { x: 50, y: 25, position: 'DEF' },
        { x: 70, y: 25, position: 'DEF' },
        { x: 15, y: 50, position: 'MID' },
        { x: 35, y: 50, position: 'MID' },
        { x: 50, y: 50, position: 'MID' },
        { x: 65, y: 50, position: 'MID' },
        { x: 85, y: 50, position: 'MID' },
        { x: 35, y: 75, position: 'FWD' },
        { x: 65, y: 75, position: 'FWD' },
      ],
    },
  ],
};

export default function TeamFormationScreen({ navigation, route }: Props) {
  const { teamId, teamName, matchId } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGameFormat, setSelectedGameFormat] = useState<GameFormat>(GAME_FORMATS[0]);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(FORMATIONS['5v5'][0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeamPlayers();
  }, [teamId]);

  const loadTeamPlayers = async () => {
    try {
      // This would load real team players from API
      // For now, using mock data to demonstrate the UI
      const mockPlayers: Player[] = [
        { id: '1', name: 'John Doe', position: 'GK', jerseyNumber: 1 },
        { id: '2', name: 'Mike Smith', position: 'DEF', jerseyNumber: 2 },
        { id: '3', name: 'Alex Johnson', position: 'DEF', jerseyNumber: 3 },
        { id: '4', name: 'Chris Brown', position: 'DEF', jerseyNumber: 4 },
        { id: '5', name: 'David Wilson', position: 'DEF', jerseyNumber: 5 },
        { id: '6', name: 'Tom Anderson', position: 'MID', jerseyNumber: 6 },
        { id: '7', name: 'Ryan Taylor', position: 'MID', jerseyNumber: 7 },
        { id: '8', name: 'James Miller', position: 'MID', jerseyNumber: 8 },
        { id: '9', name: 'Kevin Davis', position: 'MID', jerseyNumber: 9 },
        { id: '10', name: 'Paul Garcia', position: 'FWD', jerseyNumber: 10 },
        { id: '11', name: 'Mark Rodriguez', position: 'FWD', jerseyNumber: 11 },
      ];

      // Assign positions based on selected formation
      const playersWithPositions = assignPlayersToFormation(mockPlayers, selectedFormation);
      setPlayers(playersWithPositions);
    } catch (error) {
      console.error('Error loading team players:', error);
      Alert.alert('Error', 'Failed to load team players');
    } finally {
      setIsLoading(false);
    }
  };

  const assignPlayersToFormation = (teamPlayers: Player[], formation: Formation): Player[] => {
    const positionOrder = ['GK', 'DEF', 'MID', 'FWD'];
    const sortedPlayers = [...teamPlayers].sort((a, b) => {
      const aIndex = positionOrder.indexOf(a.position);
      const bIndex = positionOrder.indexOf(b.position);
      return aIndex - bIndex;
    });

    return formation.positions.map((pos, index) => {
      const player = sortedPlayers[index] || { 
        id: `placeholder-${index}`, 
        name: 'Empty', 
        position: pos.position 
      };
      return {
        ...player,
        x: pos.x,
        y: pos.y,
      };
    });
  };

  const handleGameFormatChange = (gameFormat: GameFormat) => {
    setSelectedGameFormat(gameFormat);
    const availableFormations = FORMATIONS[gameFormat.id as keyof typeof FORMATIONS];
    const newFormation = availableFormations[0];
    setSelectedFormation(newFormation);
    const updatedPlayers = assignPlayersToFormation(
      players.filter(p => !p.id.startsWith('placeholder-')),
      newFormation
    );
    setPlayers(updatedPlayers);
  };

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation);
    const updatedPlayers = assignPlayersToFormation(
      players.filter(p => !p.id.startsWith('placeholder-')),
      formation
    );
    setPlayers(updatedPlayers);
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return '#FF5722';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const renderFootballPitch = () => {
    const pitchType = selectedGameFormat.pitchType;
    
    // Adjust pitch features based on game format
    const features = {
      small: { // 5v5
        centerCircleRadius: PITCH_HEIGHT * 0.08,
        penaltyAreaWidth: PITCH_WIDTH * 0.25,
        penaltyAreaHeight: PITCH_HEIGHT * 0.15,
        goalAreaWidth: PITCH_WIDTH * 0.15,
        goalAreaHeight: PITCH_HEIGHT * 0.08,
        playerRadius: 14,
      },
      medium: { // 7v7
        centerCircleRadius: PITCH_HEIGHT * 0.10,
        penaltyAreaWidth: PITCH_WIDTH * 0.22,
        penaltyAreaHeight: PITCH_HEIGHT * 0.18,
        goalAreaWidth: PITCH_WIDTH * 0.12,
        goalAreaHeight: PITCH_HEIGHT * 0.10,
        playerRadius: 15,
      },
      full: { // 11v11
        centerCircleRadius: PITCH_HEIGHT * 0.12,
        penaltyAreaWidth: PITCH_WIDTH * 0.20,
        penaltyAreaHeight: PITCH_HEIGHT * 0.20,
        goalAreaWidth: PITCH_WIDTH * 0.10,
        goalAreaHeight: PITCH_HEIGHT * 0.12,
        playerRadius: 16,
      },
    };

    const feature = features[pitchType];
    
    return (
      <Svg width={PITCH_WIDTH} height={PITCH_HEIGHT} style={styles.pitch}>
        {/* Pitch background */}
        <Rect
          x="0"
          y="0"
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
          fill="#2E7D32"
          stroke="#FFFFFF"
          strokeWidth="2"
          rx="8"
        />
        
        {/* Center circle */}
        <Circle
          cx={PITCH_WIDTH / 2}
          cy={PITCH_HEIGHT / 2}
          r={feature.centerCircleRadius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        
        {/* Center dot */}
        <Circle
          cx={PITCH_WIDTH / 2}
          cy={PITCH_HEIGHT / 2}
          r="2"
          fill="#FFFFFF"
        />
        
        {/* Center line */}
        <Line
          x1="5"
          y1={PITCH_HEIGHT / 2}
          x2={PITCH_WIDTH - 5}
          y2={PITCH_HEIGHT / 2}
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        
        {/* Top penalty area */}
        <Rect
          x={(PITCH_WIDTH - feature.penaltyAreaWidth) / 2}
          y="0"
          width={feature.penaltyAreaWidth}
          height={feature.penaltyAreaHeight}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        
        {/* Bottom penalty area */}
        <Rect
          x={(PITCH_WIDTH - feature.penaltyAreaWidth) / 2}
          y={PITCH_HEIGHT - feature.penaltyAreaHeight}
          width={feature.penaltyAreaWidth}
          height={feature.penaltyAreaHeight}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        
        {/* Top goal area */}
        <Rect
          x={(PITCH_WIDTH - feature.goalAreaWidth) / 2}
          y="0"
          width={feature.goalAreaWidth}
          height={feature.goalAreaHeight}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        
        {/* Bottom goal area */}
        <Rect
          x={(PITCH_WIDTH - feature.goalAreaWidth) / 2}
          y={PITCH_HEIGHT - feature.goalAreaHeight}
          width={feature.goalAreaWidth}
          height={feature.goalAreaHeight}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />

        {/* Goals */}
        <Rect
          x={(PITCH_WIDTH - 40) / 2}
          y="-5"
          width="40"
          height="10"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        <Rect
          x={(PITCH_WIDTH - 40) / 2}
          y={PITCH_HEIGHT - 5}
          width="40"
          height="10"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
        />

        {/* Render players */}
        {players.map((player, index) => {
          if (!player.x || !player.y) return null;
          
          const x = (player.x / 100) * PITCH_WIDTH;
          const y = (player.y / 100) * PITCH_HEIGHT;
          
          return (
            <G key={player.id}>
              <Circle
                cx={x}
                cy={y}
                r={feature.playerRadius}
                fill={getPositionColor(player.position)}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <SvgText
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize="11"
                fill="#FFFFFF"
                fontWeight="bold"
              >
                {player.jerseyNumber || index + 1}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading formation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Formation</Text>
        <Text style={styles.teamName}>{teamName}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Format Selector */}
        <View style={styles.gameFormatSelector}>
          <Text style={styles.sectionTitle}>Game Format</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GAME_FORMATS.map((format) => (
              <TouchableOpacity
                key={format.id}
                style={[
                  styles.gameFormatCard,
                  selectedGameFormat.id === format.id && styles.selectedGameFormatCard
                ]}
                onPress={() => handleGameFormatChange(format)}
              >
                <Text style={[
                  styles.gameFormatTitle,
                  selectedGameFormat.id === format.id && styles.selectedGameFormatTitle
                ]}>
                  {format.name}
                </Text>
                <Text style={[
                  styles.gameFormatSubtitle,
                  selectedGameFormat.id === format.id && styles.selectedGameFormatSubtitle
                ]}>
                  {format.playerCount} players
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Formation Templates */}
        <View style={styles.formationSelector}>
          <Text style={styles.sectionTitle}>Formation Templates for {selectedGameFormat.name}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FORMATIONS[selectedGameFormat.id as keyof typeof FORMATIONS].map((formation) => (
              <TouchableOpacity
                key={formation.id}
                style={[
                  styles.formationCard,
                  selectedFormation.id === formation.id && styles.selectedFormationCard
                ]}
                onPress={() => handleFormationChange(formation)}
              >
                <Text style={[
                  styles.formationName,
                  selectedFormation.id === formation.id && styles.selectedFormationName
                ]}>
                  {formation.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Football Pitch */}
        <View style={styles.pitchContainer}>
          <Text style={styles.sectionTitle}>Formation: {selectedFormation.name}</Text>
          {renderFootballPitch()}
        </View>

        {/* Player List */}
        <View style={styles.playerList}>
          <Text style={styles.sectionTitle}>Starting XI</Text>
          {players.map((player, index) => (
            <View key={player.id} style={styles.playerItem}>
              <View style={[styles.positionBadge, { backgroundColor: getPositionColor(player.position) }]}>
                <Text style={styles.positionText}>{player.position}</Text>
              </View>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.jerseyNumber}>#{player.jerseyNumber || index + 1}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Formation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.proceedButton}>
            <Text style={styles.proceedButtonText}>Proceed to Match</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#00E676',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  teamName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  gameFormatSelector: {
    marginBottom: 25,
  },
  gameFormatCard: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginRight: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minWidth: 90,
    alignItems: 'center',
  },
  selectedGameFormatCard: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  gameFormatTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedGameFormatTitle: {
    color: '#121212',
  },
  gameFormatSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  selectedGameFormatSubtitle: {
    color: 'rgba(18, 18, 18, 0.8)',
  },
  formationSelector: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  formationCard: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedFormationCard: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  formationName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedFormationName: {
    color: '#121212',
  },
  pitchContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  pitch: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    marginTop: 10,
  },
  playerList: {
    marginBottom: 30,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  positionBadge: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  positionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  jerseyNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 'bold',
  },
  actionButtons: {
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#00E676',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 16,
    color: '#121212',
    fontWeight: 'bold',
  },
});