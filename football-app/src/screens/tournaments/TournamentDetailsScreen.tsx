import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  Text as SvgText,
  G 
} from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

// Professional Components
import {
  ProfessionalButton,
  ProfessionalTeamBadge,
  ProfessionalHeader,
} from '../../components/professional';

// Import DesignSystem directly
import DesignSystem from '../../theme/designSystem';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;
const { width: screenWidth } = Dimensions.get('window');

interface Tournament {
  id: string;
  name: string;
  description?: string;
  tournamentType: 'LEAGUE' | 'KNOCKOUT' | 'GROUP_STAGE';
  startDate: string;
  endDate: string;
  maxTeams: number;
  registeredTeams: number;
  entryFee?: number;
  prizePool?: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  createdBy: string;
  teams?: any[];
  matches?: any[];
}

interface Standing {
  position: number | string;
  teamId: string;
  team_id?: string;  // API might return snake_case
  teamName: string;
  team_name?: string;  // API might return snake_case
  matches: number | string;
  wins: number | string;
  draws: number | string;
  losses: number | string;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number | string;
}

interface TournamentMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  round: number;
  scheduledTime?: string;
  winnerId?: string;
}

interface BracketNode {
  id: string;
  round: number;
  match?: TournamentMatch;
  homeTeam?: { id: string; name: string };
  awayTeam?: { id: string; name: string };
  winner?: { id: string; name: string };
  x: number;
  y: number;
}

interface PlayerStat {
  playerId: string;
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

type TabType = 'standings' | 'schedule' | 'stats' | 'bracket';

interface TournamentDetailsScreenProps {
  navigation: any;
  route: any;
}

export default function TournamentDetailsScreen({ navigation, route }: TournamentDetailsScreenProps) {
  const { tournamentId } = route.params;
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('standings');
  const [bracketNodes, setBracketNodes] = useState<BracketNode[]>([]);

  useEffect(() => {
    loadTournamentDetails();
    loadStandings();
    loadUserTeams();
    loadTournamentStats();
  }, []);

  // Load matches after tournament data is available
  useEffect(() => {
    if (tournament) {
      loadTournamentMatches();
    }
  }, [tournament]);

  useEffect(() => {
    if (tournament && activeTab === 'bracket' && tournament.tournamentType === 'KNOCKOUT') {
      generateBracketNodes();
    }
  }, [tournament, matches, activeTab]);

  const loadTournamentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTournamentById(tournamentId);
      setTournament(response.tournament);
    } catch (error: any) {
      console.error('Error loading tournament:', error);
      Alert.alert('Error', 'Failed to load tournament details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadStandings = async () => {
    try {
      const response = await apiService.getTournamentStandings(tournamentId);
      setStandings(response.standings || []);
    } catch (error: any) {
      console.error('Error loading standings:', error);
    }
  };

  const loadUserTeams = async () => {
    try {
      const response = await apiService.getTeams();
      setTeams(response.teams || []);
    } catch (error: any) {
      console.error('Error loading teams:', error);
    }
  };

  const loadTournamentMatches = async () => {
    try {
      if (tournament && tournament.matches && tournament.matches.length > 0) {
        setMatches(tournament.matches);
      } else {
        setMatches([]);
      }
    } catch (error: any) {
      console.error('Error loading tournament matches:', error);
      setMatches([]);
    }
  };

  const loadTournamentStats = async () => {
    try {
      // This will need to be implemented in the backend
      // For now, using mock data to demonstrate the UI
      const mockStats: PlayerStat[] = [
        { playerId: '1', playerName: 'John Striker', teamName: 'Team Alpha', goals: 8, assists: 3, yellowCards: 1, redCards: 0, matchesPlayed: 4 },
        { playerId: '2', playerName: 'Mike Scorer', teamName: 'Team Beta', goals: 6, assists: 2, yellowCards: 2, redCards: 0, matchesPlayed: 3 },
        { playerId: '3', playerName: 'Alex Forward', teamName: 'Team Gamma', goals: 5, assists: 4, yellowCards: 0, redCards: 1, matchesPlayed: 4 },
        { playerId: '4', playerName: 'Chris Assist', teamName: 'Team Delta', goals: 2, assists: 7, yellowCards: 3, redCards: 0, matchesPlayed: 4 },
        { playerId: '5', playerName: 'David Goal', teamName: 'Team Alpha', goals: 4, assists: 1, yellowCards: 1, redCards: 0, matchesPlayed: 3 },
      ];
      setPlayerStats(mockStats);
    } catch (error: any) {
      console.error('Error loading tournament stats:', error);
    }
  };

  const handleRegisterTeam = async (teamId: string) => {
    try {
      setRegistering(true);
      await apiService.registerTeamToTournament(tournamentId, teamId);
      
      Alert.alert('Success', 'Team registered successfully!');
      setShowTeamSelector(false);
      loadTournamentDetails(); // Refresh tournament data
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register team');
    } finally {
      setRegistering(false);
    }
  };

  const generateBracketNodes = () => {
    if (!matches.length) {
      return;
    }

    const rounds = Math.max(...matches.map(m => m.round));
    const bracketWidth = screenWidth * 1.5;
    const nodeWidth = 140;
    const nodeHeight = 70;
    const roundSpacing = bracketWidth / (rounds + 1);
    const verticalSpacing = 90;
    
    const nodes: BracketNode[] = [];
    
    // Generate nodes for each round with proper spacing
    for (let round = 1; round <= rounds; round++) {
      const roundMatches = matches.filter(m => m.round === round);
      const totalRoundHeight = (roundMatches.length * nodeHeight) + ((roundMatches.length - 1) * verticalSpacing);
      const startY = Math.max(50, (600 - totalRoundHeight) / 2);
      
      roundMatches.forEach((match, index) => {
        const matchPosition = Math.pow(2, rounds - round) * (index + 0.5);
        const y = startY + (index * (nodeHeight + verticalSpacing));
        
        nodes.push({
          id: match.id,
          round,
          match,
          homeTeam: { id: match.homeTeamId, name: match.homeTeamName },
          awayTeam: { id: match.awayTeamId, name: match.awayTeamName },
          winner: match.winnerId ? 
            (match.winnerId === match.homeTeamId ? 
              { id: match.homeTeamId, name: match.homeTeamName } : 
              { id: match.awayTeamId, name: match.awayTeamName }) : undefined,
          x: 60 + (round - 1) * roundSpacing,
          y
        });
      });
    }
    
    setBracketNodes(nodes);
  };

  const getTopStats = (category: keyof PlayerStat, limit: number = 5) => {
    if (category === 'playerId' || category === 'playerName' || category === 'teamName') return [];
    
    return [...playerStats]
      .sort((a, b) => (b[category] as number) - (a[category] as number))
      .slice(0, limit);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return colors.accent.blue;
      case 'ACTIVE': return colors.status.live;
      case 'COMPLETED': return colors.text.tertiary;
      default: return colors.text.secondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LEAGUE': return '🏆';
      case 'KNOCKOUT': return '⚔️';
      case 'GROUP_STAGE': return '🏟️';
      default: return '🏁';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatStandingValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '0';
    return String(value);
  };

  const renderStanding = ({ item, index }: { item: Standing; index: number }) => {
    const isTop3 = index < 3;
    const positionColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
    
    // Handle both camelCase and snake_case from API
    const teamName = item.teamName || item.team_name || 'Unknown Team';
    const position = Number(item.position) || item.position;
    const matches = Number(item.matches) || 0;
    const wins = Number(item.wins) || 0;
    const draws = Number(item.draws) || 0;
    const losses = Number(item.losses) || 0;
    const points = Number(item.points) || 0;
    const goalDiff = item.goalDifference || 0;
    
    return (
      <View style={styles.standingRow}>
        <View style={[
          styles.positionBadge,
          isTop3 && { backgroundColor: positionColors[index] }
        ]}>
          <Text style={[
            styles.positionText,
            isTop3 && styles.topPositionText
          ]}>
            {position}
          </Text>
        </View>
        
        <View style={styles.teamInfo}>
          <ProfessionalTeamBadge 
            teamName={teamName} 
            size="small" 
          />
          <Text style={styles.teamName} numberOfLines={2}>
          {teamName}
          </Text>
        </View>
        
        <View style={styles.statsGrid}>
        <Text style={styles.statValue}>{formatStandingValue(matches)}</Text>
        <Text style={styles.statValue}>{formatStandingValue(wins)}</Text>
        <Text style={styles.statValue}>{formatStandingValue(draws)}</Text>
        <Text style={styles.statValue}>{formatStandingValue(losses)}</Text>
        <Text style={[styles.statValue, styles.goalDiff]}>
        {goalDiff > 0 ? '+' : ''}{formatStandingValue(goalDiff)}
        </Text>
        <Text style={[styles.statValue, styles.points]}>{formatStandingValue(points)}</Text>
        </View>
      </View>
    );
  };


  const renderTabs = () => {
    const tabs = [
      { key: 'standings', title: 'Standings', icon: 'trophy' },
      { key: 'schedule', title: 'Schedule', icon: 'calendar' },
      { key: 'stats', title: 'Stats', icon: 'stats-chart' },
    ];

    if (tournament?.tournamentType === 'KNOCKOUT') {
      tabs.splice(1, 0, { key: 'bracket', title: 'Bracket', icon: 'git-branch' });
    }

    return (
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#FFFFFF' : colors.text.secondary} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const handleMatchPress = (match: TournamentMatch) => {
    Alert.alert(
      'Match Details',
      `${match.homeTeamName} vs ${match.awayTeamName}\n` +
      `Round: ${match.round}\n` +
      `Status: ${match.status}` +
      (match.homeScore !== undefined ? `\nScore: ${match.homeScore} - ${match.awayScore}` : ''),
      [
        { text: 'Close', style: 'cancel' },
        ...(match.status === 'PENDING' ? [{ text: 'View Details', onPress: () => console.log('Navigate to match details') }] : [])
      ]
    );
  };

  const drawProgressionLines = (nodes: BracketNode[]) => {
    const lines: JSX.Element[] = [];
    const maxRound = Math.max(...nodes.map(n => n.round));
    
    // Group nodes by round for easier pairing
    const nodesByRound: { [key: number]: BracketNode[] } = {};
    nodes.forEach(node => {
      if (!nodesByRound[node.round]) nodesByRound[node.round] = [];
      nodesByRound[node.round].push(node);
    });
    
    // Draw progression lines for each round
    for (let round = 1; round < maxRound; round++) {
      const currentRoundNodes = nodesByRound[round] || [];
      const nextRoundNodes = nodesByRound[round + 1] || [];
      
      // Each pair of current round matches feeds into one next round match
      for (let i = 0; i < currentRoundNodes.length; i += 2) {
        const node1 = currentRoundNodes[i];
        const node2 = currentRoundNodes[i + 1];
        const targetNode = nextRoundNodes[Math.floor(i / 2)];
        
        if (node1 && targetNode) {
          const midX = node1.x + 140 + (targetNode.x - node1.x - 140) / 2;
          
          // Line from first match
          lines.push(
            <G key={`progression-${node1.id}-to-${targetNode.id}`}>
              <Line
                x1={node1.x + 140}
                y1={node1.y + 35}
                x2={midX}
                y2={node1.y + 35}
                stroke={node1.winner ? colors.status.success : colors.surface.border}
                strokeWidth="3"
                strokeDasharray={node1.winner ? '0' : '5,5'}
              />
              
              {node1.winner && (
                <Circle
                  cx={node1.x + 150}
                  cy={node1.y + 35}
                  r="3"
                  fill={colors.status.success}
                />
              )}
            </G>
          );
        }
        
        if (node2 && targetNode) {
          const midX = node2.x + 140 + (targetNode.x - node2.x - 140) / 2;
          
          // Line from second match
          lines.push(
            <G key={`progression-${node2.id}-to-${targetNode.id}`}>
              <Line
                x1={node2.x + 140}
                y1={node2.y + 35}
                x2={midX}
                y2={node2.y + 35}
                stroke={node2.winner ? colors.status.success : colors.surface.border}
                strokeWidth="3"
                strokeDasharray={node2.winner ? '0' : '5,5'}
              />
              
              {node2.winner && (
                <Circle
                  cx={node2.x + 150}
                  cy={node2.y + 35}
                  r="3"
                  fill={colors.status.success}
                />
              )}
            </G>
          );
        }
        
        // Vertical connector and line to target
        if (node1 && node2 && targetNode) {
          const midX = node1.x + 140 + (targetNode.x - node1.x - 140) / 2;
          
          lines.push(
            <G key={`connector-${round}-${i}`}>
              {/* Vertical connector between the two matches */}
              <Line
                x1={midX}
                y1={node1.y + 35}
                x2={midX}
                y2={node2.y + 35}
                stroke={colors.surface.border}
                strokeWidth="2"
              />
              
              {/* Horizontal line to target match */}
              <Line
                x1={midX}
                y1={(node1.y + node2.y) / 2 + 35}
                x2={targetNode.x}
                y2={targetNode.y + 35}
                stroke={colors.surface.border}
                strokeWidth="2"
              />
              
              {/* Junction point */}
              <Circle
                cx={midX}
                cy={(node1.y + node2.y) / 2 + 35}
                r="3"
                fill={colors.surface.border}
              />
            </G>
          );
        }
      }
    }
    
    return lines;
  };

  const renderBracket = () => {
    if (bracketNodes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="git-branch-outline" size={64} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Tournament Bracket</Text>
          <Text style={styles.emptySubtitle}>
            Bracket will appear once tournament matches are generated
          </Text>
        </View>
      );
    }

    const rounds = Math.max(...bracketNodes.map(n => n.round));
    const svgWidth = Math.max(screenWidth * 1.5, rounds * 200 + 120);
    const svgHeight = 600;

    return (
      <View style={styles.bracketContainer}>
        {/* Round Labels */}
        <View style={styles.roundLabels}>
          {Array.from({ length: rounds }, (_, i) => {
            const roundNumber = i + 1;
            const roundName = roundNumber === rounds ? 'FINAL' : 
                             roundNumber === rounds - 1 ? 'SEMI-FINAL' :
                             roundNumber === rounds - 2 ? 'QUARTER-FINAL' :
                             `ROUND ${roundNumber}`;
            
            return (
              <View 
                key={roundNumber} 
                style={[
                  styles.roundLabel,
                  { left: 60 + i * (svgWidth / rounds) - 60 }
                ]}
              >
                <Text style={styles.roundLabelText}>{roundName}</Text>
              </View>
            );
          })}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <Svg width={svgWidth} height={svgHeight} style={styles.bracket}>
            {/* Background grid */}
            <G>
              {Array.from({ length: rounds }, (_, i) => (
                <Line
                  key={`grid-${i}`}
                  x1={60 + i * (svgWidth / rounds)}
                  y1={0}
                  x2={60 + i * (svgWidth / rounds)}
                  y2={svgHeight}
                  stroke={colors.surface.subtle}
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />
              ))}
            </G>

            {/* Draw progression lines */}
            {drawProgressionLines(bracketNodes)}

            {/* Draw bracket nodes */}
            {bracketNodes.map((node) => (
              <G 
                key={node.id}
                onPress={() => node.match && handleMatchPress(node.match)}
              >
                {/* Main match box */}
                <Rect
                  x={node.x}
                  y={node.y}
                  width="140"
                  height="70"
                  fill={
                    node.match?.status === 'COMPLETED' ? colors.surface.secondary : 
                    node.match?.status === 'ACTIVE' ? colors.accent.orange : 
                    colors.surface.primary
                  }
                  stroke={
                    node.winner ? colors.status.success : 
                    node.match?.status === 'ACTIVE' ? colors.accent.orange :
                    colors.surface.border
                  }
                  strokeWidth={node.winner ? "3" : "2"}
                  rx="12"
                />
                
                {/* Home team section */}
                <Rect
                  x={node.x + 2}
                  y={node.y + 2}
                  width="136"
                  height="33"
                  fill={
                    node.winner?.id === node.homeTeam?.id ? 'rgba(0, 220, 100, 0.2)' :
                    node.match?.status === 'COMPLETED' ? colors.surface.subtle : 'transparent'
                  }
                  rx="10"
                />
                
                {/* Away team section */}
                <Rect
                  x={node.x + 2}
                  y={node.y + 35}
                  width="136"
                  height="33"
                  fill={
                    node.winner?.id === node.awayTeam?.id ? 'rgba(0, 220, 100, 0.2)' :
                    node.match?.status === 'COMPLETED' ? colors.surface.subtle : 'transparent'
                  }
                  rx="10"
                />
                
                {/* Home team name */}
                <SvgText
                  x={node.x + 8}
                  y={node.y + 22}
                  fontSize="11"
                  fill={node.winner?.id === node.homeTeam?.id ? colors.primary.main : colors.text.primary}
                  fontWeight={node.winner?.id === node.homeTeam?.id ? 'bold' : 'normal'}
                >
                  {node.homeTeam?.name.substring(0, 14) || 'TBD'}
                </SvgText>
                
                {/* Away team name */}
                <SvgText
                  x={node.x + 8}
                  y={node.y + 55}
                  fontSize="11"
                  fill={node.winner?.id === node.awayTeam?.id ? colors.primary.main : colors.text.primary}
                  fontWeight={node.winner?.id === node.awayTeam?.id ? 'bold' : 'normal'}
                >
                  {node.awayTeam?.name.substring(0, 14) || 'TBD'}
                </SvgText>

                {/* Score display */}
                {node.match?.homeScore !== undefined && (
                  <G>
                    <SvgText
                      x={node.x + 125}
                      y={node.y + 22}
                      textAnchor="middle"
                      fontSize="14"
                      fill={node.winner?.id === node.homeTeam?.id ? colors.primary.main : colors.text.secondary}
                      fontWeight="bold"
                    >
                      {node.match.homeScore}
                    </SvgText>
                    <SvgText
                      x={node.x + 125}
                      y={node.y + 55}
                      textAnchor="middle"
                      fontSize="14"
                      fill={node.winner?.id === node.awayTeam?.id ? colors.primary.main : colors.text.secondary}
                      fontWeight="bold"
                    >
                      {node.match.awayScore}
                    </SvgText>
                  </G>
                )}

                {/* Status indicator */}
                {node.match?.status === 'ACTIVE' && (
                  <Circle
                    cx={node.x + 130}
                    cy={node.y + 10}
                    r="4"
                    fill={colors.status.live}
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </Circle>
                )}

                {/* Winner crown */}
                {node.winner && node.round === Math.max(...bracketNodes.map(n => n.round)) && (
                  <SvgText
                    x={node.x + 70}
                    y={node.y - 10}
                    textAnchor="middle"
                    fontSize="20"
                  >
                    👑
                  </SvgText>
                )}
              </G>
            ))}
          </Svg>
        </ScrollView>
      </View>
    );
  };

  const renderSchedule = () => {
    const groupedMatches = matches.reduce((acc, match) => {
      const round = `Round ${match.round}`;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {} as Record<string, TournamentMatch[]>);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(groupedMatches).map(([round, roundMatches]) => (
          <View key={round} style={styles.roundSection}>
            <Text style={styles.roundTitle}>{round}</Text>
            {roundMatches.map((match) => (
              <TouchableOpacity 
                key={match.id} 
                style={styles.matchCard}
                onPress={() => handleMatchPress(match)}
              >
                <View style={styles.matchHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
                    <Text style={styles.statusText}>{match.status}</Text>
                  </View>
                  {match.scheduledTime && (
                    <Text style={styles.matchTime}>
                      {new Date(match.scheduledTime).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  )}
                </View>
                
                <View style={styles.matchContent}>
                  <View style={styles.teamRow}>
                    <ProfessionalTeamBadge teamName={match.homeTeamName} size="small" />
                    <Text style={styles.teamName} numberOfLines={1}>{match.homeTeamName}</Text>
                    {match.status === 'COMPLETED' && (
                      <Text style={[
                        styles.score,
                        match.winnerId === match.homeTeamId && styles.winnerScore
                      ]}>
                        {match.homeScore}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.vsContainer}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  
                  <View style={styles.teamRow}>
                    <ProfessionalTeamBadge teamName={match.awayTeamName} size="small" />
                    <Text style={styles.teamName} numberOfLines={1}>{match.awayTeamName}</Text>
                    {match.status === 'COMPLETED' && (
                      <Text style={[
                        styles.score,
                        match.winnerId === match.awayTeamId && styles.winnerScore
                      ]}>
                        {match.awayScore}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderStats = () => {
    const statCategories = [
      { key: 'goals', title: 'Top Scorers', icon: 'football', color: colors.primary.main },
      { key: 'assists', title: 'Top Assists', icon: 'people', color: colors.accent.blue },
      { key: 'yellowCards', title: 'Yellow Cards', icon: 'square', color: colors.accent.orange },
      { key: 'redCards', title: 'Red Cards', icon: 'square', color: colors.status.error },
    ];

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {statCategories.map((category) => (
          <View key={category.key} style={styles.statSection}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: category.color + '20' }]}>
                <Ionicons 
                  name={category.icon as any} 
                  size={20} 
                  color={category.color} 
                />
              </View>
              <Text style={styles.statTitle}>{category.title}</Text>
            </View>
            
            <View style={styles.statList}>
              {getTopStats(category.key as keyof PlayerStat).map((player, index) => (
                <View key={player.playerId} style={styles.statRow}>
                  <View style={[
                    styles.rankBadge,
                    index === 0 && styles.goldRank,
                    index === 1 && styles.silverRank,
                    index === 2 && styles.bronzeRank,
                  ]}>
                    <Text style={[
                      styles.rankText,
                      index < 3 && styles.topRankText
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.playerName}</Text>
                    <Text style={styles.playerTeam}>{player.teamName}</Text>
                  </View>
                  
                  <View style={[styles.statValueContainer, { backgroundColor: category.color + '10' }]}>
                    <Text style={[styles.statValue, { color: category.color }]}>
                      {player[category.key as keyof PlayerStat]}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'standings':
        return standings.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.standingHeader}>
              <Text style={styles.headerLabel}>#</Text>
              <Text style={[styles.headerLabel, styles.teamHeaderLabel]}>Team</Text>
              <View style={styles.statsGrid}>
                <Text style={styles.headerLabel}>P</Text>
                <Text style={styles.headerLabel}>W</Text>
                <Text style={styles.headerLabel}>D</Text>
                <Text style={styles.headerLabel}>L</Text>
                <Text style={styles.headerLabel}>GD</Text>
                <Text style={styles.headerLabel}>Pts</Text>
              </View>
            </View>
            <FlatList
              key="tournament-standings"
              data={standings}
              renderItem={renderStanding}
              keyExtractor={(item, index) => item.teamId || item.team_id || `standing-${index}-${item.position}`}
              scrollEnabled={false}
            />
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Standings Yet</Text>
            <Text style={styles.emptySubtitle}>
              Standings will appear once matches begin
            </Text>
          </View>
        );
      
      case 'bracket':
        return renderBracket();
      
      case 'schedule':
        return matches.length > 0 ? renderSchedule() : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Matches Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              Match schedule will appear here
            </Text>
          </View>
        );
      
      case 'stats':
        return renderStats();
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tournament not found</Text>
        <ProfessionalButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Professional Header */}
        <ProfessionalHeader
          title={tournament.name}
          subtitle={`${tournament.tournamentType.replace('_', ' ')} • ${tournament.status}`}
          showBack
          onBack={() => navigation.goBack()}
        >
          <View style={styles.headerActions}>
            <View style={styles.tournamentBadge}>
              <Text style={styles.tournamentIcon}>{getTypeIcon(tournament.tournamentType)}</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: getStatusColor(tournament.status) }]}>
              <Text style={styles.statusChipText}>{tournament.status}</Text>
            </View>
          </View>
        </ProfessionalHeader>

        <View style={styles.content}>
          {/* Tournament Info Card */}
          <View style={styles.infoCard}>
            {tournament.description && (
              <Text style={styles.description}>{tournament.description}</Text>
            )}
            
            {/* Tournament Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.primary.main + '20' }]}>
                  <Ionicons name="people" size={20} color={colors.primary.main} />
                </View>
                <Text style={styles.statNumber}>{tournament.registeredTeams}/{tournament.maxTeams}</Text>
                <Text style={styles.statLabel}>Teams</Text>
              </View>
              
              {tournament.prizePool && (
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: colors.accent.gold + '20' }]}>
                    <Ionicons name="trophy" size={20} color={colors.accent.gold} />
                  </View>
                  <Text style={styles.statNumber}>₹{tournament.prizePool.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Prize Pool</Text>
                </View>
              )}
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.accent.blue + '20' }]}>
                  <Ionicons name="calendar" size={20} color={colors.accent.blue} />
                </View>
                <Text style={styles.statNumber}>
                  {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.statLabel}>Start Date</Text>
              </View>
            </View>
          </View>

          {/* Register Team Button */}
          {tournament.status === 'UPCOMING' && tournament.registeredTeams < tournament.maxTeams && (
            <View style={styles.registerSection}>
              <ProfessionalButton
                title="Register Your Team"
                icon="add-circle"
                variant="primary"
                onPress={() => setShowTeamSelector(true)}
                fullWidth
              />
            </View>
          )}

          {/* Tabs */}
          {renderTabs()}

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {renderTabContent()}
          </View>
        </View>
      </ScrollView>

      {/* Team Selection Modal */}
      <Modal
        visible={showTeamSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTeamSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Team to Register</Text>
            <TouchableOpacity 
              onPress={() => setShowTeamSelector(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {teams.length > 0 ? (
              <View style={styles.teamList}>
                {teams.map((team, index) => (
                  <TouchableOpacity
                    key={team.id || `team-${index}`}
                    style={styles.teamOption}
                    onPress={() => handleRegisterTeam(team.id)}
                    disabled={registering}
                  >
                    <ProfessionalTeamBadge teamName={team.name} size="medium" />
                    <View style={styles.teamOptionInfo}>
                      <Text style={styles.teamOptionName}>{team.name}</Text>
                      <Text style={styles.teamOptionPlayers}>{team.players?.length || 0} players</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noTeamsState}>
                <Ionicons name="people-outline" size={64} color={colors.text.tertiary} />
                <Text style={styles.noTeamsTitle}>No Teams Available</Text>
                <Text style={styles.noTeamsSubtitle}>
                  Create a team first to register for tournaments
                </Text>
                <ProfessionalButton
                  title="Create Team"
                  icon="add"
                  variant="primary"
                  onPress={() => {
                    setShowTeamSelector(false);
                    navigation.navigate('Teams');
                  }}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.large,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  // Professional Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tournamentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentIcon: {
    fontSize: 16,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  // Tournament Info Card
  infoCard: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  description: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.md,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statNumber: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  registerSection: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xl,
  },
  // Professional Tabs
  tabContainer: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  tabScroll: {
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    borderRadius: borderRadius.badge,
    minWidth: 80,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },

  // Standings Styles
  standingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
  },
  headerLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    width: 30,
    textAlign: 'center',
  },
  teamHeaderLabel: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: spacing.sm,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    marginBottom: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  positionBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  topPositionText: {
    color: '#FFFFFF',
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  teamName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 210,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    width: 30,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  goalDiff: {
    fontWeight: typography.fontWeight.medium,
  },
  points: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },

  // Bracket Styles
  bracketContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  roundLabels: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
    position: 'relative',
  },
  roundLabel: {
    position: 'absolute',
  },
  roundLabelText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bracket: {
    backgroundColor: colors.surface.primary,
  },

  // Schedule Styles
  roundSection: {
    marginBottom: spacing.xl,
  },
  roundTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  matchCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  matchTime: {
    fontSize: typography.fontSize.caption,
    color: colors.text.secondary,
  },
  matchContent: {
    paddingVertical: spacing.sm,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  vsText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
  },
  score: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    marginLeft: 'auto',
  },
  winnerScore: {
    color: colors.primary.main,
  },

  // Stats Styles
  statSection: {
    marginBottom: spacing.xl,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  statTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  statList: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldRank: {
    backgroundColor: '#FFD700',
  },
  silverRank: {
    backgroundColor: '#C0C0C0',
  },
  bronzeRank: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  topRankText: {
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  playerName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  playerTeam: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  statValueContainer: {
    minWidth: 40,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.bold,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Modal Styles
  // Professional Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
    ...shadows.sm,
  },
  modalTitle: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.secondary,
  },
  modalContent: {
    flex: 1,
  },
  teamList: {
    padding: spacing.screenPadding,
  },
  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  teamOptionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  teamOptionName: {
    fontSize: typography.fontSize.regular,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  teamOptionPlayers: {
    fontSize: typography.fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  noTeamsState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  noTeamsTitle: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  noTeamsSubtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});