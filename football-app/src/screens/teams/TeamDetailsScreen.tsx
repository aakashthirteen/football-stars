import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiService } from '../../services/api';
import { TeamPlayerStats } from '../../types';

interface TeamDetailsScreenProps {
  navigation: any;
  route: any;
}

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
  role: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  players: Player[];
  createdBy: string;
}

export default function TeamDetailsScreen({ navigation, route }: TeamDetailsScreenProps) {
  const { teamId } = route.params;
  const [team, setTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamPlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingDemoStats, setUsingDemoStats] = useState(false);

  useEffect(() => {
    loadTeamDetails();
  }, []);

  const loadTeamDetails = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Loading team details for teamId:', teamId);
      
      const response = await apiService.getTeamById(teamId);
      console.log('✅ Team response:', response);
      
      if (response.team && response.team.players) {
        
        const transformedPlayers = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId || tp.player?.id,
          name: tp.player?.name || tp.player_name || tp.name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'Unknown',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber,
          role: tp.role || 'PLAYER'
        }));
        
        setTeam({
          ...response.team,
          players: transformedPlayers
        });
        
        // Load real team stats from backend
        await loadTeamStats();
      } else {
        setTeam(response.team);
      }
    } catch (error: any) {
      console.error('❌ Error loading team details:', error);
      Alert.alert('Error', 'Failed to load team details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamStats = async () => {
    try {
      console.log('📊 Loading REAL team stats for teamId:', teamId);
      
      const response = await apiService.getTeamPlayersStats(teamId);
      console.log('📊 Raw backend stats response structure:', {
        hasResponse: !!response,
        hasPlayers: !!(response?.players),
        isPlayersArray: Array.isArray(response?.players),
        playersLength: response?.players?.length || 0,
        fullResponse: JSON.stringify(response, null, 2)
      });
      
      if (response && response.players && Array.isArray(response.players)) {
        console.log('✅ Backend returned', response.players.length, 'player stats');
        
        // Check if any players have actual match data
        const playersWithStats = response.players.filter((p: any) => 
          (p.goals > 0) || (p.assists > 0) || (p.matches_played > 0) || (p.matchesPlayed > 0)
        );
        
        console.log('📊 Players with non-zero stats:', playersWithStats.length);
        console.log('📊 Sample player data:', response.players[0]);
        
        
        setTeamStats(response.players);
        setUsingDemoStats(false);
      } else {
        console.log('⚠️ No valid stats data from backend - response structure invalid');
        setTeamStats([]);
        setUsingDemoStats(false);
      }
    } catch (error: any) {
      console.error('❌ Error loading REAL team stats:', error);
      console.log('📋 API Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data,
        stack: error.stack
      });
      // Show empty stats instead of dummy data
      setTeamStats([]);
      setUsingDemoStats(false);
    }
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CAPTAIN': return '👑';
      case 'VICE_CAPTAIN': return '⭐';
      default: return '';
    }
  };

  const getPlayerStats = (playerId: string) => {
    return teamStats.find(stats => stats.playerId === playerId || stats.player_id === playerId);
  };

  // Calculate team totals from REAL backend data only
  const calculateTeamTotals = () => {
    const baseTotals = {
      totalPlayers: team?.players.length || 0,
      totalGoals: 0,
      totalAssists: 0,
      totalMatches: 0
    };

    if (teamStats.length === 0) {
      console.log('📊 No stats available, showing base totals');
      return baseTotals;
    }


    // Only calculate if we have real backend data - convert strings to numbers
    const totalGoals = teamStats.reduce((sum, player) => {
      const goals = parseInt(player.goals) || 0;
      return sum + goals;
    }, 0);
    
    const totalAssists = teamStats.reduce((sum, player) => {
      const assists = parseInt(player.assists) || 0;
      return sum + assists;
    }, 0);
    
    const totalMatches = teamStats.length > 0 ? Math.max(...teamStats.map(player => 
      parseInt(player.matchesPlayed || player.matches_played) || 0), 0) : 0;

    console.log('📊 Calculated totals from REAL data:', {
      totalPlayers: baseTotals.totalPlayers,
      totalGoals,
      totalAssists,
      totalMatches
    });

    return {
      totalPlayers: baseTotals.totalPlayers,
      totalGoals,
      totalAssists,
      totalMatches
    };
  };

  const renderPlayerCard = (player: Player) => {
    const playerStats = getPlayerStats(player.id);
    
    
    return (
      <View key={player.id} style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <View style={styles.playerInfo}>
            <View style={styles.playerNameRow}>
              <Text style={styles.playerName}>{player.name}</Text>
              {getRoleIcon(player.role) ? (
                <Text style={styles.roleIcon}>{getRoleIcon(player.role)}</Text>
              ) : null}
            </View>
            <View style={styles.playerDetails}>
              <View style={[styles.positionTag, { backgroundColor: getPositionColor(player.position) }]}>
                <Text style={styles.positionText}>{player.position}</Text>
              </View>
              {player.jerseyNumber && (
                <Text style={styles.jerseyNumber}>#{player.jerseyNumber}</Text>
              )}
            </View>
          </View>
        </View>
        
        {playerStats ? (
          <View style={styles.playerStatsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{parseInt(playerStats.goals) || 0}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Goals</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{parseInt(playerStats.assists) || 0}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Assists</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {parseInt(playerStats.matchesPlayed || playerStats.matches_played) || 0}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>Matches</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {(parseInt(playerStats.yellowCards || playerStats.yellow_cards) || 0) + 
                 (parseInt(playerStats.redCards || playerStats.red_cards) || 0)}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>Cards</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noStatsAvailable}>
            <Text style={styles.noStatsText}>No match data available</Text>
            <Text style={styles.noStatsSubtext}>Stats will appear after playing matches</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E676" />
        <Text style={styles.loadingText}>Loading team details...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Team not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totals = calculateTeamTotals();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.teamName}>{team.name}</Text>
        {team.description && (
          <Text style={styles.teamDescription}>{team.description}</Text>
        )}
        {teamStats.length === 0 && (
          <View style={styles.noDataIndicator}>
            <Text style={styles.noDataText}>⚠️ No match data yet</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Team Stats Overview */}
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.totalPlayers}</Text>
            <Text style={styles.statTitle} numberOfLines={1}>Players</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.totalGoals}</Text>
            <Text style={styles.statTitle} numberOfLines={1}>Goals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.totalAssists}</Text>
            <Text style={styles.statTitle} numberOfLines={1}>Assists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totals.totalMatches}</Text>
            <Text style={styles.statTitle} numberOfLines={1}>Matches</Text>
          </View>
        </View>

        {/* Team Actions */}
        <View style={styles.teamActions}>
          <TouchableOpacity 
            style={styles.formationButton}
            onPress={() => {
              // Navigate to TeamFormation within the Teams stack
              navigation.navigate('TeamFormation', {
                teamId: team.id,
                teamName: team.name
              });
            }}
          >
            <View style={styles.formationButtonContent}>
              <View style={styles.formationIcon}>
                <Text style={styles.formationIconText}>⚽</Text>
              </View>
              <View style={styles.formationTextContainer}>
                <Text style={styles.formationButtonTitle}>Team Formation</Text>
                <Text style={styles.formationButtonSubtitle}>Plan your tactics • 5v5, 7v7, 11v11</Text>
              </View>
              <Text style={styles.formationArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Squad Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Squad</Text>
          <View style={styles.playersContainer}>
            {team.players.map(renderPlayerCard)}
          </View>
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
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#1F1F1F',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerBackButton: {
    marginBottom: 12,
    padding: 8,
    alignSelf: 'flex-start',
  },
  headerBackText: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: '500',
  },
  teamName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  teamDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    marginBottom: 12,
  },
  noDataIndicator: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  noDataText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  statsOverview: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 70,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1F1F1F',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  playersContainer: {
    gap: 16,
  },
  playerCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerHeader: {
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  roleIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  jerseyNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  playerStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    fontWeight: '500',
    textAlign: 'center',
  },
  noStatsAvailable: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  noStatsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  noStatsSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#00E676',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  teamActions: {
    marginVertical: 20,
    paddingHorizontal: 0,
  },
  formationButton: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderWidth: 1,
    borderColor: '#00E676',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  formationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  formationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  formationIconText: {
    fontSize: 20,
  },
  formationTextContainer: {
    flex: 1,
  },
  formationButtonTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  formationButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formationArrow: {
    fontSize: 18,
    color: '#00E676',
    fontWeight: 'bold',
  },
});