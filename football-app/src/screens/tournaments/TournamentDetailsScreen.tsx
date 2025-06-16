import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import Svg, { 
  Rect, 
  Circle, 
  Line, 
  Text as SvgText,
  G 
} from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

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
  position: number;
  teamId: string;
  teamName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
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
    console.log('🎯 USEEFFECT: tournament:', tournament?.name, 'type:', tournament?.tournamentType);
    console.log('🎯 USEEFFECT: activeTab:', activeTab);
    console.log('🎯 USEEFFECT: matches count:', matches.length);
    
    if (tournament && activeTab === 'bracket' && tournament.tournamentType === 'KNOCKOUT') {
      console.log('✅ USEEFFECT: Conditions met, calling generateBracketNodes');
      generateBracketNodes();
    } else {
      console.log('❌ USEEFFECT: Conditions not met');
      console.log('   - tournament exists:', !!tournament);
      console.log('   - activeTab === bracket:', activeTab === 'bracket');
      console.log('   - tournament type === KNOCKOUT:', tournament?.tournamentType === 'KNOCKOUT');
    }
  }, [tournament, matches, activeTab]);

  const loadTournamentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTournamentById(tournamentId);
      console.log('🏆 TOURNAMENT_DETAILS: Loaded tournament:', response.tournament);
      console.log('🏆 TOURNAMENT_DETAILS: Tournament type:', response.tournament?.tournamentType);
      console.log('🏆 TOURNAMENT_DETAILS: Should show bracket?', response.tournament?.tournamentType === 'KNOCKOUT');
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
      // Use matches from the tournament data if available
      if (tournament && tournament.matches && tournament.matches.length > 0) {
        console.log('🏟️ MATCHES: Using tournament matches from API:', tournament.matches.length);
        setMatches(tournament.matches);
      } else {
        console.log('🏟️ MATCHES: No matches found in tournament data');
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
    console.log('🏟️ BRACKET: generateBracketNodes called');
    console.log('🏟️ BRACKET: matches.length:', matches.length);
    console.log('🏟️ BRACKET: matches:', matches);
    
    if (!matches.length) {
      console.log('❌ BRACKET: No matches found, returning early');
      return;
    }

    const rounds = Math.max(...matches.map(m => m.round));
    console.log('🏟️ BRACKET: rounds:', rounds);
    
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
        // Calculate position with proper bracket spacing
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
    
    console.log('🏟️ BRACKET: Generated nodes:', nodes.length);
    console.log('🏟️ BRACKET: nodes:', nodes);
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
      case 'UPCOMING': return '#2196F3';
      case 'ACTIVE': return '#4CAF50';
      case 'COMPLETED': return '#9E9E9E';
      default: return '#999';
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

  const renderStanding = ({ item, index }: { item: Standing; index: number }) => (
    <View style={[styles.standingRow, index % 2 === 0 && styles.standingRowEven]}>
      <View style={styles.positionContainer}>
        <Text style={styles.position}>{item.position}</Text>
      </View>
      <View style={styles.teamContainer}>
        <Text style={styles.teamName}>{item.teamName}</Text>
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>{item.matches}</Text>
        <Text style={styles.statText}>{item.wins}</Text>
        <Text style={styles.statText}>{item.draws}</Text>
        <Text style={styles.statText}>{item.losses}</Text>
        <Text style={styles.statText}>{item.goalDifference}</Text>
        <Text style={[styles.statText, styles.pointsText]}>{item.points}</Text>
      </View>
    </View>
  );

  const renderTeamOption = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.teamOption}
      onPress={() => handleRegisterTeam(item.id)}
      disabled={registering}
    >
      <Text style={styles.teamOptionName}>{item.name}</Text>
      <Text style={styles.teamOptionPlayers}>{item.players?.length || 0} players</Text>
    </TouchableOpacity>
  );

  const renderTabs = () => {
    const tabs = [
      { key: 'standings', title: 'Standings', icon: '🏆' },
      { key: 'schedule', title: 'Schedule', icon: '📅' },
      { key: 'stats', title: 'Stats', icon: '📊' },
    ];

    // Add bracket tab for knockout tournaments
    console.log('🔍 TABS: Checking tournament type:', tournament?.tournamentType);
    console.log('🔍 TABS: Is KNOCKOUT?', tournament?.tournamentType === 'KNOCKOUT');
    if (tournament?.tournamentType === 'KNOCKOUT') {
      console.log('✅ TABS: Adding bracket tab');
      tabs.splice(1, 0, { key: 'bracket', title: 'Bracket', icon: '🏟️' });
    } else {
      console.log('❌ TABS: Not adding bracket tab - tournament type is:', tournament?.tournamentType);
    }
    console.log('🔍 TABS: Final tabs array:', tabs.map(t => t.key));

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
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
                stroke={node1.winner ? '#4CAF50' : '#E0E0E0'}
                strokeWidth="3"
                strokeDasharray={node1.winner ? '0' : '5,5'}
              />
              
              {node1.winner && (
                <Circle
                  cx={node1.x + 150}
                  cy={node1.y + 35}
                  r="3"
                  fill="#4CAF50"
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
                stroke={node2.winner ? '#4CAF50' : '#E0E0E0'}
                strokeWidth="3"
                strokeDasharray={node2.winner ? '0' : '5,5'}
              />
              
              {node2.winner && (
                <Circle
                  cx={node2.x + 150}
                  cy={node2.y + 35}
                  r="3"
                  fill="#4CAF50"
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
                stroke="#E0E0E0"
                strokeWidth="2"
              />
              
              {/* Horizontal line to target match */}
              <Line
                x1={midX}
                y1={(node1.y + node2.y) / 2 + 35}
                x2={targetNode.x}
                y2={targetNode.y + 35}
                stroke="#E0E0E0"
                strokeWidth="2"
              />
              
              {/* Junction point */}
              <Circle
                cx={midX}
                cy={(node1.y + node2.y) / 2 + 35}
                r="3"
                fill="#E0E0E0"
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
        <View style={styles.emptyBracket}>
          <Text style={styles.emptyIcon}>🏟️</Text>
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
                  stroke="#F5F5F5"
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
                    node.match?.status === 'COMPLETED' ? '#E8F5E8' : 
                    node.match?.status === 'ACTIVE' ? '#FFF3E0' : 
                    '#F8F9FA'
                  }
                  stroke={
                    node.winner ? '#4CAF50' : 
                    node.match?.status === 'ACTIVE' ? '#FF9800' :
                    '#E0E0E0'
                  }
                  strokeWidth={node.winner ? "3" : "2"}
                  rx="12"
                  filter={node.match?.status === 'ACTIVE' ? "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" : "none"}
                />
                
                {/* Home team section */}
                <Rect
                  x={node.x + 2}
                  y={node.y + 2}
                  width="136"
                  height="33"
                  fill={
                    node.winner?.id === node.homeTeam?.id ? '#C8E6C9' :
                    node.match?.status === 'COMPLETED' ? '#F5F5F5' : 'transparent'
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
                    node.winner?.id === node.awayTeam?.id ? '#C8E6C9' :
                    node.match?.status === 'COMPLETED' ? '#F5F5F5' : 'transparent'
                  }
                  rx="10"
                />
                
                {/* Home team name */}
                <SvgText
                  x={node.x + 8}
                  y={node.y + 22}
                  fontSize="11"
                  fill={node.winner?.id === node.homeTeam?.id ? '#2E7D32' : '#333'}
                  fontWeight={node.winner?.id === node.homeTeam?.id ? 'bold' : 'normal'}
                >
                  {node.homeTeam?.name.substring(0, 14) || 'TBD'}
                </SvgText>
                
                {/* Away team name */}
                <SvgText
                  x={node.x + 8}
                  y={node.y + 55}
                  fontSize="11"
                  fill={node.winner?.id === node.awayTeam?.id ? '#2E7D32' : '#333'}
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
                      fill={node.winner?.id === node.homeTeam?.id ? '#2E7D32' : '#666'}
                      fontWeight="bold"
                    >
                      {node.match.homeScore}
                    </SvgText>
                    <SvgText
                      x={node.x + 125}
                      y={node.y + 55}
                      textAnchor="middle"
                      fontSize="14"
                      fill={node.winner?.id === node.awayTeam?.id ? '#2E7D32' : '#666'}
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
                    fill="#4CAF50"
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
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchTeams}>
                  <Text style={styles.teamName}>{match.homeTeamName}</Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.teamName}>{match.awayTeamName}</Text>
                </View>
                
                {match.status === 'COMPLETED' && (
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>
                      {match.homeScore} - {match.awayScore}
                    </Text>
                  </View>
                )}
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
                  <Text style={styles.statusText}>{match.status}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderStats = () => {
    const statCategories = [
      { key: 'goals', title: 'Top Scorers', icon: '⚽' },
      { key: 'assists', title: 'Top Assists', icon: '🅰️' },
      { key: 'yellowCards', title: 'Most Yellow Cards', icon: '🟨' },
      { key: 'redCards', title: 'Most Red Cards', icon: '🟥' },
    ];

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {statCategories.map((category) => (
          <View key={category.key} style={styles.statSection}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>{category.icon}</Text>
              <Text style={styles.statTitle}>{category.title}</Text>
            </View>
            
            <View style={styles.statList}>
              {getTopStats(category.key as keyof PlayerStat).map((player, index) => (
                <View key={player.playerId} style={styles.statRow}>
                  <View style={styles.rankContainer}>
                    <Text style={styles.rank}>{index + 1}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.playerName}</Text>
                    <Text style={styles.playerTeam}>{player.teamName}</Text>
                  </View>
                  <Text style={styles.statValue}>
                    {player[category.key as keyof PlayerStat]}
                  </Text>
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
              <View style={styles.positionContainer}>
                <Text style={styles.headerText}>#</Text>
              </View>
              <View style={styles.teamContainer}>
                <Text style={styles.headerText}>Team</Text>
              </View>
              <View style={styles.statsContainer}>
                <Text style={styles.headerText}>MP</Text>
                <Text style={styles.headerText}>W</Text>
                <Text style={styles.headerText}>D</Text>
                <Text style={styles.headerText}>L</Text>
                <Text style={styles.headerText}>GD</Text>
                <Text style={styles.headerText}>Pts</Text>
              </View>
            </View>
            <FlatList
              data={standings}
              renderItem={renderStanding}
              keyExtractor={(item) => item.teamId}
              scrollEnabled={false}
            />
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Standings Yet</Text>
            <Text style={styles.emptySubtitle}>
              Standings will appear once matches begin
            </Text>
          </View>
        );
      
      case 'bracket':
        return renderBracket();
      
      case 'schedule':
        return renderSchedule();
      
      case 'stats':
        return renderStats();
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tournament not found</Text>
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
          <Text style={styles.backButtonText}>← Tournaments</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tournament.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tournament Info */}
        <View style={styles.infoCard}>
          <View style={styles.tournamentHeader}>
            <Text style={styles.tournamentIcon}>{getTypeIcon(tournament.tournamentType)}</Text>
            <View style={styles.titleContainer}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                  <Text style={styles.statusText}>{tournament.status}</Text>
                </View>
                <Text style={styles.tournamentType}>{tournament.tournamentType.replace('_', ' ')}</Text>
              </View>
            </View>
          </View>

          {tournament.description && (
            <Text style={styles.description}>{tournament.description}</Text>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Teams</Text>
              <Text style={styles.infoValue}>{tournament.registeredTeams}/{tournament.maxTeams}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </Text>
            </View>
            {tournament.prizePool && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Prize Pool</Text>
                <Text style={styles.prizeValue}>₹{tournament.prizePool.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {tournament.status === 'UPCOMING' && tournament.registeredTeams < tournament.maxTeams && (
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => setShowTeamSelector(true)}
            >
              <Text style={styles.registerButtonText}>Register Team</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* Team Selection Modal */}
      <Modal
        visible={showTeamSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowTeamSelector(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Team to Register</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalContent}>
            {teams.length > 0 ? (
              <FlatList
                data={teams}
                renderItem={renderTeamOption}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noTeamsState}>
                <Text style={styles.noTeamsIcon}>👥</Text>
                <Text style={styles.noTeamsTitle}>No Teams Available</Text>
                <Text style={styles.noTeamsSubtitle}>
                  Create a team first to register for tournaments
                </Text>
                <TouchableOpacity 
                  style={styles.createTeamButton}
                  onPress={() => {
                    setShowTeamSelector(false);
                    navigation.navigate('Teams');
                  }}
                >
                  <Text style={styles.createTeamButtonText}>Create Team</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#2E7D32',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tournamentIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tournamentType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoGrid: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  prizeValue: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  standingsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  standingHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2E7D32',
    marginBottom: 8,
  },
  standingRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  standingRowEven: {
    backgroundColor: '#f8f9fa',
  },
  positionContainer: {
    width: 30,
    alignItems: 'center',
  },
  position: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  teamContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  teamName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    width: 150,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    minWidth: 20,
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#2E7D32',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  teamOption: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teamOptionPlayers: {
    fontSize: 14,
    color: '#666',
  },
  noTeamsState: {
    alignItems: 'center',
    padding: 40,
  },
  noTeamsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noTeamsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noTeamsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createTeamButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTeamButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // New Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Bracket Styles
  bracketContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  roundLabels: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    position: 'relative',
  },
  roundLabel: {
    position: 'absolute',
  },
  roundLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bracket: {
    backgroundColor: '#fff',
  },
  emptyBracket: {
    alignItems: 'center',
    padding: 40,
  },

  // Schedule Styles
  roundSection: {
    marginBottom: 24,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  matchCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },

  // Stats Styles
  statSection: {
    marginBottom: 24,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  playerTeam: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});