import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
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
import { apiService } from '../../services/api';

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
const PITCH_WIDTH = screenWidth - 20; // Increase width by using less margin
const PITCH_HEIGHT = (PITCH_WIDTH * 1.6); // Increase height ratio for more space

const GAME_FORMATS: GameFormat[] = [
  { id: '5v5', name: '5 vs 5', playerCount: 5, pitchType: 'small' },
  { id: '7v7', name: '7 vs 7', playerCount: 7, pitchType: 'medium' },
  { id: '11v11', name: '11 vs 11', playerCount: 11, pitchType: 'full' },
];

const FORMATIONS: Record<string, Formation[]> = {
  '5v5': [
    {
      id: '1-2-1-1',
      name: '1-2-1-1',
      gameFormat: '5v5',
      playerCount: 5,
      positions: [
        { x: 50, y: 10, position: 'GK' },        // GK stays in goal area
        { x: 30, y: 22, position: 'DEF' },       // Left defender
        { x: 70, y: 22, position: 'DEF' },       // Right defender
        { x: 50, y: 31, position: 'MID' },       // Central midfielder
        { x: 50, y: 40, position: 'FWD' },       // Forward (equal spacing)
      ],
    },
    {
      id: '1-1-2-1',
      name: '1-1-2-1',
      gameFormat: '5v5',
      playerCount: 5,
      positions: [
        { x: 50, y: 10, position: 'GK' },        // GK in goal
        { x: 50, y: 22, position: 'DEF' },       // Central defender
        { x: 30, y: 31, position: 'MID' },       // Left midfielder
        { x: 70, y: 31, position: 'MID' },       // Right midfielder
        { x: 50, y: 40, position: 'FWD' },       // Forward (equal spacing)
      ],
    },
    {
      id: '1-1-1-2',
      name: '1-1-1-2',
      gameFormat: '5v5',
      playerCount: 5,
      positions: [
        { x: 50, y: 10, position: 'GK' },        // GK in goal
        { x: 50, y: 22, position: 'DEF' },       // Central defender
        { x: 50, y: 31, position: 'MID' },       // Central midfielder
        { x: 30, y: 40, position: 'FWD' },       // Left forward (equal spacing)
        { x: 70, y: 40, position: 'FWD' },       // Right forward (equal spacing)
      ],
    },
  ],
  '7v7': [
    {
      id: '1-3-2-1',
      name: '1-3-2-1',
      gameFormat: '7v7',
      playerCount: 7,
      positions: [
        { x: 50, y: 10, position: 'GK' },        // GK in goal
        { x: 15, y: 22, position: 'DEF' },       // Left defender
        { x: 50, y: 22, position: 'DEF' },       // Central defender
        { x: 85, y: 22, position: 'DEF' },       // Right defender
        { x: 25, y: 31, position: 'MID' },       // Left midfielder
        { x: 75, y: 31, position: 'MID' },       // Right midfielder
        { x: 50, y: 40, position: 'FWD' },       // Forward (equal spacing)
      ],
    },
    {
      id: '1-2-3-1',
      name: '1-2-3-1',
      gameFormat: '7v7',
      playerCount: 7,
      positions: [
        { x: 50, y: 10, position: 'GK' },        // GK in goal
        { x: 35, y: 22, position: 'DEF' },       // Left defender
        { x: 65, y: 22, position: 'DEF' },       // Right defender
        { x: 15, y: 31, position: 'MID' },       // Left midfielder
        { x: 50, y: 31, position: 'MID' },       // Central midfielder
        { x: 85, y: 31, position: 'MID' },       // Right midfielder
        { x: 50, y: 40, position: 'FWD' },       // Forward (equal spacing)
      ],
    },
    {
      id: '1-4-1-1',
      name: '1-4-1-1',
      gameFormat: '7v7',
      playerCount: 7,
      positions: [
        { x: 50, y: 10, position: 'GK' },        // GK in goal
        { x: 10, y: 22, position: 'DEF' },       // Left defender
        { x: 35, y: 22, position: 'DEF' },       // Left center-back
        { x: 65, y: 22, position: 'DEF' },       // Right center-back
        { x: 90, y: 22, position: 'DEF' },       // Right defender
        { x: 50, y: 31, position: 'MID' },       // Defensive midfielder
        { x: 50, y: 40, position: 'FWD' },       // Forward (equal spacing)
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
        { x: 50, y: 8, position: 'GK' },         // GK in goal
        { x: 5, y: 18, position: 'DEF' },        // Left-back
        { x: 32, y: 18, position: 'DEF' },       // Left center-back
        { x: 68, y: 18, position: 'DEF' },       // Right center-back
        { x: 95, y: 18, position: 'DEF' },       // Right-back
        { x: 12, y: 29, position: 'MID' },       // Left midfielder
        { x: 32, y: 29, position: 'MID' },       // Left central midfielder
        { x: 68, y: 29, position: 'MID' },       // Right central midfielder
        { x: 88, y: 29, position: 'MID' },       // Right midfielder
        { x: 35, y: 40, position: 'FWD' },       // Left forward (equal spacing)
        { x: 65, y: 40, position: 'FWD' },       // Right forward (equal spacing)
      ],
    },
    {
      id: '4-3-3',
      name: '4-3-3',
      gameFormat: '11v11',
      playerCount: 11,
      positions: [
        { x: 50, y: 8, position: 'GK' },         // GK in goal
        { x: 5, y: 18, position: 'DEF' },        // Left-back
        { x: 32, y: 18, position: 'DEF' },       // Left center-back
        { x: 68, y: 18, position: 'DEF' },       // Right center-back
        { x: 95, y: 18, position: 'DEF' },       // Right-back
        { x: 15, y: 29, position: 'MID' },       // Left midfielder
        { x: 50, y: 29, position: 'MID' },       // Central midfielder
        { x: 85, y: 29, position: 'MID' },       // Right midfielder
        { x: 15, y: 40, position: 'FWD' },       // Left winger (equal spacing)
        { x: 50, y: 40, position: 'FWD' },       // Striker (equal spacing)
        { x: 85, y: 40, position: 'FWD' },       // Right winger (equal spacing)
      ],
    },
    {
      id: '3-5-2',
      name: '3-5-2',
      gameFormat: '11v11',
      playerCount: 11,
      positions: [
        { x: 50, y: 8, position: 'GK' },         // GK in goal
        { x: 20, y: 18, position: 'DEF' },       // Left center-back
        { x: 50, y: 18, position: 'DEF' },       // Central center-back
        { x: 80, y: 18, position: 'DEF' },       // Right center-back
        { x: 5, y: 29, position: 'MID' },        // Left wing-back
        { x: 25, y: 29, position: 'MID' },       // Left midfielder
        { x: 50, y: 29, position: 'MID' },       // Central midfielder
        { x: 75, y: 29, position: 'MID' },       // Right midfielder
        { x: 95, y: 29, position: 'MID' },       // Right wing-back
        { x: 35, y: 40, position: 'FWD' },       // Left forward (equal spacing)
        { x: 65, y: 40, position: 'FWD' },       // Right forward (equal spacing)
      ],
    },
  ],
};

export default function TeamFormationScreen({ navigation, route }: Props) {
  const { teamId, teamName, matchId, isPreMatch, isHomeTeam, gameFormat, onFormationSaved } = route.params;
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedGameFormat, setSelectedGameFormat] = useState<GameFormat>(GAME_FORMATS[0]);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(FORMATIONS['5v5'][0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragMode, setIsDragMode] = useState(false); // Start with drag mode disabled
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [isCustomFormation, setIsCustomFormation] = useState(false); // Track if formation has been customized
  const [pitchLayout, setPitchLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize with the passed game format if in pre-match mode
    if (isPreMatch && gameFormat) {
      const format = GAME_FORMATS.find(f => f.id === gameFormat) || GAME_FORMATS[0];
      setSelectedGameFormat(format);
      const availableFormations = FORMATIONS[gameFormat as keyof typeof FORMATIONS];
      setSelectedFormation(availableFormations[0]);
    }
  }, [isPreMatch, gameFormat]);

  useEffect(() => {
    loadTeamPlayers();
  }, [teamId]);

  const loadTeamPlayers = async () => {
    try {
      // Load actual team players from API
      const response = await apiService.getTeamById(teamId);
      
      if (response.team && response.team.players) {
        // Transform team players to match our Player interface
        const teamPlayers: Player[] = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId || tp.player?.id || `player-${Math.random()}`,
          name: tp.player?.name || tp.player_name || tp.name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'MID',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber || Math.floor(Math.random() * 99) + 1
        }));

        // Assign positions based on selected formation
        const playersWithPositions = assignPlayersToFormation(teamPlayers, selectedFormation);
        setPlayers(playersWithPositions);
      } else {
        // If no players in team, show empty formation with placeholders
        const playersWithPositions = assignPlayersToFormation([], selectedFormation);
        setPlayers(playersWithPositions);
      }
    } catch (error) {
      console.error('Error loading team players:', error);
      Alert.alert('Error', 'Failed to load team players');
      // Show empty formation on error
      const playersWithPositions = assignPlayersToFormation([], selectedFormation);
      setPlayers(playersWithPositions);
    } finally {
      setIsLoading(false);
    }
  };

  const assignPlayersToFormation = useCallback((teamPlayers: Player[], formation: Formation): Player[] => {
    const assignedPlayers: Player[] = [];
    
    // Group players by position
    const playersByPosition = {
      GK: teamPlayers.filter(p => p.position === 'GK'),
      DEF: teamPlayers.filter(p => p.position === 'DEF'), 
      MID: teamPlayers.filter(p => p.position === 'MID'),
      FWD: teamPlayers.filter(p => p.position === 'FWD'),
    };

    // Define zones on the pitch (Y coordinates)
    const zones = {
      GK: { minY: 5, maxY: 15 },      // Goalkeeper area
      DEF: { minY: 15, maxY: 25 },    // Defensive zone  
      MID: { minY: 25, maxY: 35 },    // Midfield zone
      FWD: { minY: 35, maxY: 45 },    // Forward zone
    };

    // Assign goalkeepers (limit to 1, use formation GK position)
    if (playersByPosition.GK.length > 0) {
      const gkPosition = formation.positions.find(p => p.position === 'GK');
      if (gkPosition) {
        assignedPlayers.push({
          ...playersByPosition.GK[0],
          x: gkPosition.x,
          y: gkPosition.y,
        });
      }
    }

    // Function to distribute players in a zone
    const distributePlayersInZone = (players: Player[], position: keyof typeof zones) => {
      if (players.length === 0) return;
      
      const zone = zones[position];
      const positions = [];
      
      // Calculate positions based on number of players
      if (players.length === 1) {
        positions.push({ x: 50, y: (zone.minY + zone.maxY) / 2 });
      } else if (players.length === 2) {
        positions.push(
          { x: 25, y: (zone.minY + zone.maxY) / 2 },
          { x: 75, y: (zone.minY + zone.maxY) / 2 }
        );
      } else if (players.length === 3) {
        positions.push(
          { x: 15, y: (zone.minY + zone.maxY) / 2 },
          { x: 50, y: (zone.minY + zone.maxY) / 2 },
          { x: 85, y: (zone.minY + zone.maxY) / 2 }
        );
      } else if (players.length === 4) {
        positions.push(
          { x: 10, y: (zone.minY + zone.maxY) / 2 },
          { x: 35, y: (zone.minY + zone.maxY) / 2 },
          { x: 65, y: (zone.minY + zone.maxY) / 2 },
          { x: 90, y: (zone.minY + zone.maxY) / 2 }
        );
      } else if (players.length === 5) {
        positions.push(
          { x: 10, y: zone.minY + 3 },
          { x: 30, y: zone.maxY - 3 },
          { x: 50, y: (zone.minY + zone.maxY) / 2 },
          { x: 70, y: zone.maxY - 3 },
          { x: 90, y: zone.minY + 3 }
        );
      } else {
        // For 6+ players, arrange in two rows
        const playersPerRow = Math.ceil(players.length / 2);
        for (let i = 0; i < players.length; i++) {
          const row = Math.floor(i / playersPerRow);
          const col = i % playersPerRow;
          const y = row === 0 ? zone.minY + 3 : zone.maxY - 3;
          const x = ((col + 1) * 100) / (playersPerRow + 1);
          positions.push({ x, y });
        }
      }

      // Assign players to calculated positions
      players.forEach((player, index) => {
        if (positions[index]) {
          assignedPlayers.push({
            ...player,
            x: positions[index].x,
            y: positions[index].y,
          });
        }
      });
    };

    // Distribute players in their respective zones
    distributePlayersInZone(playersByPosition.DEF, 'DEF');
    distributePlayersInZone(playersByPosition.MID, 'MID'); 
    distributePlayersInZone(playersByPosition.FWD, 'FWD');

    return assignedPlayers;
  }, []);

  const handleGameFormatChange = useCallback(async (gameFormat: GameFormat) => {
    setSelectedGameFormat(gameFormat);
    const availableFormations = FORMATIONS[gameFormat.id as keyof typeof FORMATIONS];
    const newFormation = availableFormations[0];
    setSelectedFormation(newFormation);
    
    // Re-load team players for new formation
    try {
      const response = await apiService.getTeamById(teamId);
      
      if (response.team && response.team.players) {
        const teamPlayers: Player[] = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId || tp.player?.id || `player-${Math.random()}`,
          name: tp.player?.name || tp.player_name || tp.name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'MID',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber || Math.floor(Math.random() * 99) + 1
        }));

        const updatedPlayers = assignPlayersToFormation(teamPlayers, newFormation);
        setPlayers(updatedPlayers);
      } else {
        const updatedPlayers = assignPlayersToFormation([], newFormation);
        setPlayers(updatedPlayers);
      }
    } catch (error) {
      console.error('Error loading team players:', error);
      const updatedPlayers = assignPlayersToFormation([], newFormation);
      setPlayers(updatedPlayers);
    }
  }, [teamId]);

  const handleFormationChange = useCallback(async (formation: Formation) => {
    setSelectedFormation(formation);
    // Re-load team players for new formation
    try {
      const response = await apiService.getTeamById(teamId);
      
      if (response.team && response.team.players) {
        const teamPlayers: Player[] = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId || tp.player?.id || `player-${Math.random()}`,
          name: tp.player?.name || tp.player_name || tp.name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'MID',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber || Math.floor(Math.random() * 99) + 1
        }));

        const updatedPlayers = assignPlayersToFormation(teamPlayers, formation);
        setPlayers(updatedPlayers);
      } else {
        const updatedPlayers = assignPlayersToFormation([], formation);
        setPlayers(updatedPlayers);
      }
    } catch (error) {
      console.error('Error reloading team players:', error);
      const updatedPlayers = assignPlayersToFormation([], formation);
      setPlayers(updatedPlayers);
    }
    setIsCustomFormation(false); // Reset custom flag when changing templates
  }, [teamId]);


  const saveCustomFormation = () => {
    Alert.alert(
      'Save Formation',
      'Would you like to save this custom formation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: () => {
            Alert.alert('Success', 'Custom formation saved!');
            // Here you would typically save to backend or local storage
          }
        }
      ]
    );
  };

  const saveFormationForMatch = () => {
    const formationData = {
      formationName: selectedFormation.name,
      gameFormat: selectedGameFormat.id,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        x: p.x || 0,
        y: p.y || 0,
        jerseyNumber: p.jerseyNumber,
      })),
    };

    if (isPreMatch && onFormationSaved) {
      onFormationSaved(formationData);
      navigation.goBack();
    } else {
      Alert.alert('Success', 'Formation saved for match!');
    }
  };

  const resetToFormation = async () => {
    try {
      const response = await apiService.getTeamById(teamId);
      
      if (response.team && response.team.players) {
        const teamPlayers: Player[] = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId || tp.player?.id || `player-${Math.random()}`,
          name: tp.player?.name || tp.player_name || tp.name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'MID',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber || Math.floor(Math.random() * 99) + 1
        }));

        const updatedPlayers = assignPlayersToFormation(teamPlayers, selectedFormation);
        setPlayers(updatedPlayers);
      } else {
        const updatedPlayers = assignPlayersToFormation([], selectedFormation);
        setPlayers(updatedPlayers);
      }
    } catch (error) {
      console.error('Error resetting formation:', error);
      const updatedPlayers = assignPlayersToFormation([], selectedFormation);
      setPlayers(updatedPlayers);
    }
    setIsCustomFormation(false); // Reset custom flag
    setIsDragMode(false);
  };

  const getPositionColor = useCallback((position: string) => {
    switch (position) {
      case 'GK': return '#FF5722';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'FWD': return '#FF9800';
      default: return '#9E9E9E';
    }
  }, []);

  const DraggablePlayer = React.memo(({ player, feature, index }: { player: Player; feature: any; index: number }) => {
    if (!player.x || !player.y) return null;
    
    const [position, setPosition] = useState({ 
      x: (player.x / 100) * PITCH_WIDTH - feature.playerRadius, 
      y: (player.y / 100) * PITCH_HEIGHT - feature.playerRadius 
    });
    const isBeingDragged = draggedPlayerId === player.id;
    
    useEffect(() => {
      setPosition({
        x: (player.x / 100) * PITCH_WIDTH - feature.playerRadius,
        y: (player.y / 100) * PITCH_HEIGHT - feature.playerRadius
      });
    }, [player.x, player.y]);
    
    const panResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: () => isDragMode,
      onMoveShouldSetPanResponder: () => isDragMode,
      
      onPanResponderGrant: (evt) => {
        console.log('🎯 Touch detected on player:', player.name);
        setDraggedPlayerId(player.id);
        
        // Disable scroll
        setIsScrollEnabled(false);
      },
      
      onPanResponderMove: (evt, gestureState) => {
        const newX = position.x + gestureState.dx;
        const newY = position.y + gestureState.dy;
        
        // Throttle position updates for better performance
        requestAnimationFrame(() => {
          setPosition({
            x: Math.max(0, Math.min(PITCH_WIDTH - feature.playerRadius * 2, newX)),
            y: Math.max(0, Math.min(PITCH_HEIGHT * 0.46 - feature.playerRadius * 2, newY))
          });
        });
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        // Re-enable scroll
        setIsScrollEnabled(true);
        
        const finalX = position.x + gestureState.dx + feature.playerRadius;
        const finalY = position.y + gestureState.dy + feature.playerRadius;
        
        const percentX = Math.max(5, Math.min(95, (finalX / PITCH_WIDTH) * 100));
        const percentY = Math.max(5, Math.min(46, (finalY / PITCH_HEIGHT) * 100)); // Stop at 46% to leave room for names
        
        console.log('🎯 Released at:', { percentX, percentY });
        
        // Debounce player data updates for better performance
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        updateTimeoutRef.current = setTimeout(() => {
          setPlayers(prevPlayers => 
            prevPlayers.map(p => 
              p.id === player.id 
                ? { ...p, x: percentX, y: percentY }
                : p
            )
          );
        }, 16); // ~60fps throttling
        
        // Mark formation as customized
        setIsCustomFormation(true);
        
        setDraggedPlayerId(null);
      },
      
      onPanResponderTerminate: () => {
        // Handle gesture interruption
        setIsScrollEnabled(true);
        setDraggedPlayerId(null);
      },
    }), [isDragMode, position.x, position.y, player.id]);
    
    return (
      <View
        {...panResponder.panHandlers}
        style={[
          {
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: feature.playerRadius * 2,
            height: feature.playerRadius * 2,
            zIndex: isBeingDragged ? 1000 : 1,
          },
        ]}
      >
        <View style={{ width: feature.playerRadius * 2, height: feature.playerRadius * 2 }}>
          <Svg width={feature.playerRadius * 2} height={feature.playerRadius * 2} style={{ position: 'absolute' }}>
            <Circle
              cx={feature.playerRadius}
              cy={feature.playerRadius}
              r={feature.playerRadius}
              fill={getPositionColor(player.position)}
              stroke={isBeingDragged ? '#FFD700' : '#FFFFFF'}
              strokeWidth={isBeingDragged ? 4 : 2}
              opacity={isBeingDragged ? 0.8 : 1}
            />
            {/* Jersey Number */}
            <SvgText
              x={feature.playerRadius}
              y={feature.playerRadius + 4}
              textAnchor="middle"
              fontSize="12"
              fill="#FFFFFF"
              fontWeight="bold"
            >
              {player.jerseyNumber || index + 1}
            </SvgText>
          </Svg>
          {/* Optimized touch area */}
          <View style={[
            styles.touchArea,
            {
              width: feature.playerRadius * 2.5,
              height: feature.playerRadius * 2.5,
              left: -feature.playerRadius * 0.25,
              top: -feature.playerRadius * 0.25,
            }
          ]} />
        </View>
        
        {/* Player Name Outside Circle */}
        <View style={{
          position: 'absolute',
          top: feature.playerRadius * 2 + 4,
          left: -feature.playerRadius * 0.8,
          width: feature.playerRadius * 3.6,
          alignItems: 'center',
        }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 8,
            fontWeight: '600',
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            paddingHorizontal: 2,
            paddingVertical: 1,
            borderRadius: 2,
            minHeight: 12,
            maxWidth: 40,
          }}>
            {player.name.split(' ')[0]}
          </Text>
        </View>
        
        {/* Player name tooltip when dragging */}
        {isBeingDragged && (
          <View style={styles.playerTooltip}>
            <Text style={styles.playerTooltipText}>{player.name}</Text>
          </View>
        )}
      </View>
    );
  });

  const footballPitchComponent = useMemo(() => {
    // FIFA standard football pitch proportions (105m x 68m ratio ≈ 1.54:1)
    const feature = {
      centerCircleRadius: PITCH_HEIGHT * 0.13,  // 9.15m radius on 105m length ≈ 8.7%
      penaltyAreaWidth: PITCH_WIDTH * 0.647,    // 44m width on 68m ≈ 64.7%
      penaltyAreaHeight: PITCH_HEIGHT * 0.171,  // 18m length on 105m ≈ 17.1%
      goalAreaWidth: PITCH_WIDTH * 0.294,       // 20m width on 68m ≈ 29.4%
      goalAreaHeight: PITCH_HEIGHT * 0.057,     // 6m length on 105m ≈ 5.7%
      goalWidth: PITCH_WIDTH * 0.108,           // 7.32m goal width on 68m ≈ 10.8%
      playerRadius: selectedGameFormat.id === '5v5' ? 12 : selectedGameFormat.id === '7v7' ? 13 : 14,
    };
    
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

        {/* Formation area highlight (defensive half) */}
        <Rect
          x="0"
          y="0"
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT / 2}
          fill="rgba(255, 255, 255, 0.03)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
          strokeDasharray="5,5"
          rx="8"
        />
        
        {/* Formation area label */}
        <SvgText
          x={PITCH_WIDTH / 2}
          y={PITCH_HEIGHT / 2 - 10}
          textAnchor="middle"
          fontSize="10"
          fill="rgba(255, 255, 255, 0.5)"
          fontStyle="italic"
        >
          Formation Area (Your Half)
        </SvgText>
        
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

        {/* Penalty spots */}
        <Circle
          cx={PITCH_WIDTH / 2}
          cy={feature.penaltyAreaHeight * 0.67}
          r="2"
          fill="#FFFFFF"
        />
        <Circle
          cx={PITCH_WIDTH / 2}
          cy={PITCH_HEIGHT - feature.penaltyAreaHeight * 0.67}
          r="2"
          fill="#FFFFFF"
        />

        {/* Goals (FIFA standard 7.32m width) */}
        <Rect
          x={(PITCH_WIDTH - feature.goalWidth) / 2}
          y="-3"
          width={feature.goalWidth}
          height="6"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
        />
        <Rect
          x={(PITCH_WIDTH - feature.goalWidth) / 2}
          y={PITCH_HEIGHT - 3}
          width={feature.goalWidth}
          height="6"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
        />

        {/* Render players - static in non-drag mode */}
        {!isDragMode && players.map((player, index) => {
          if (!player.x || !player.y) return null;
          
          const x = (player.x / 100) * PITCH_WIDTH;
          const y = (player.y / 100) * PITCH_HEIGHT;
          
          return (
            <G key={`${player.id}-${x}-${y}`}>
              <Circle
                cx={x}
                cy={y}
                r={feature.playerRadius}
                fill={getPositionColor(player.position)}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* Jersey Number */}
              <SvgText
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize="12"
                fill="#FFFFFF"
                fontWeight="bold"
              >
                {player.jerseyNumber || index + 1}
              </SvgText>
              {/* Player Name Below Circle */}
              <SvgText
                x={x}
                y={y + feature.playerRadius + 16}
                textAnchor="middle"
                fontSize="8"
                fill="#FFFFFF"
                fontWeight="600"
              >
                {player.name.split(' ')[0]}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    );
  }, [selectedGameFormat.id, isDragMode, players]);

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

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={isScrollEnabled}
      >
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

        {/* Formation Controls */}
        <View style={styles.formationControls}>
          <View style={styles.formationHeader}>
            <Text style={styles.sectionTitle}>
              Formation: {isCustomFormation ? `${selectedFormation.name} (Custom)` : selectedFormation.name}
            </Text>
            {isCustomFormation && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>✨ CUSTOM</Text>
              </View>
            )}
          </View>
          
          {/* Main Edit Toggle */}
          <TouchableOpacity
            style={[styles.editToggleButton, isDragMode && styles.editToggleButtonActive]}
            onPress={() => {
              setIsDragMode(!isDragMode);
              setDraggedPlayerId(null);
            }}
          >
            <Text style={[styles.editToggleText, isDragMode && styles.editToggleTextActive]}>
              {isDragMode ? '🔒 Stop Editing' : '✏️ Edit Positions'}
            </Text>
          </TouchableOpacity>
          
          {/* Action Buttons (only in edit mode) */}
          {isDragMode && (
            <View style={styles.editActionButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetToFormation}
              >
                <Text style={styles.resetButtonText}>↺ Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveTemplateButton}
                onPress={saveCustomFormation}
              >
                <Text style={styles.saveTemplateButtonText}>💾 Save Template</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {isDragMode && (
            <Text style={styles.buttonExplanation}>
              Reset = Restore original • Save = Create new template
            </Text>
          )}
          
          {isDragMode && (
            <Text style={styles.dragInstructions}>
              🎯 DRAG MODE ACTIVE - Touch and hold any player circle to drag them around the pitch!
            </Text>
          )}
          
          {!isDragMode && (
            <Text style={styles.formationInstructions}>
              ⚽ Formation positions are locked. Tap "Edit Positions" to customize player locations.
            </Text>
          )}
        </View>

        {/* Football Pitch */}
        <View style={styles.pitchContainer}>
          <View style={{ position: 'relative' }}>
            {footballPitchComponent}
            
            {/* Draggable Player Overlay */}
            {isDragMode && (
              <View style={styles.playerOverlay}>
                {players.map((player, index) => {
                  const feature = {
                    small: { playerRadius: 14 },
                    medium: { playerRadius: 15 },
                    full: { playerRadius: 16 },
                  }[selectedGameFormat.pitchType];
                  
                  return (
                    <DraggablePlayer
                      key={`draggable-${player.id}`}
                      player={player}
                      feature={feature}
                      index={index}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Player List */}
        <View style={styles.playerList}>
          <Text style={styles.sectionTitle}>
            Players on Pitch ({players.length})
          </Text>
          {players.length > 0 ? (
            players.map((player, index) => (
              <View key={player.id} style={styles.playerItem}>
                <View style={[styles.positionBadge, { backgroundColor: getPositionColor(player.position) }]}>
                  <Text style={styles.positionText}>{player.position}</Text>
                </View>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.jerseyNumber}>#{player.jerseyNumber || index + 1}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyPlayerList}>
              <Text style={styles.emptyPlayerListText}>
                No players available for this formation.
              </Text>
              <Text style={styles.emptyPlayerListSubtext}>
                Add players to your team to see them in formation.
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isPreMatch ? (
            <>
              <TouchableOpacity 
                style={styles.saveForMatchButton}
                onPress={saveFormationForMatch}
              >
                <Text style={styles.saveForMatchButtonText}>
                  ✅ Confirm Formation for {isHomeTeam ? 'Home' : 'Away'} Team
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.saveButton}>
                <Text style={styles.saveButtonText}>💾 Save Formation to Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.proceedButton}>
                <Text style={styles.proceedButtonText}>⚽ Use This Formation</Text>
              </TouchableOpacity>
            </>
          )}
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
  emptyPlayerList: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyPlayerListText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyPlayerListSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  saveButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  proceedButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  proceedButtonText: {
    fontSize: 16,
    color: '#121212',
    fontWeight: 'bold',
  },
  
  // Formation Controls Styles
  formationControls: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  customBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  customBadgeText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editToggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  editToggleButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  editToggleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editToggleTextActive: {
    color: '#121212',
  },
  editActionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveTemplateButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  saveTemplateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dragInstructions: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  formationInstructions: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonExplanation: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PITCH_WIDTH,
    height: PITCH_HEIGHT,
  },
  playerTooltip: {
    position: 'absolute',
    top: -30,
    left: -30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  playerTooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  touchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  
  // Pre-Match Mode Styles
  saveForMatchButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#388E3C',
  },
  saveForMatchButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
});