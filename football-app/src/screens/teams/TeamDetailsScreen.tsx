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
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadTeamDetails();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload team details when screen comes into focus
      loadTeamDetails();
    });

    return unsubscribe;
  }, [navigation]);

  const loadTeamDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTeamById(teamId);
      console.log('📊 Team details response:', JSON.stringify(response, null, 2));
      
      // Transform the player data to match our interface
      if (response.team && response.team.players) {
        const transformedPlayers = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId,
          name: tp.player?.name || tp.player_name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'Unknown',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber,
          role: tp.role || 'PLAYER'
        }));
        
        console.log('🔄 Transformed players:', transformedPlayers);
        
        setTeam({
          ...response.team,
          players: transformedPlayers
        });
      } else {
        setTeam(response.team);
      }
      
      // Load team stats after getting team details
      await loadTeamStats();
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
      setStatsLoading(true);
      const response = await apiService.getTeamPlayersStats(teamId);
      setTeamStats(response.players);
    } catch (error: any) {
      console.error('Error loading team stats:', error);
      // Don't show alert for stats error, just log it
    } finally {
      setStatsLoading(false);
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
      default: return '⚽';
    }
  };

  const getPlayerStats = (playerId: string) => {
    const stats = teamStats.find(stats => stats.playerId === playerId);
    console.log(`📈 Stats for player ${playerId}:`, stats);
    return stats;
  };

  const removePlayerFromTeam = async (playerId: string, playerName: string) => {
    Alert.alert(
      'Remove Player',
      `Are you sure you want to remove ${playerName} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removePlayerFromTeam(teamId, playerId);
              Alert.alert('Success', `${playerName} has been removed from the team`);
              loadTeamDetails(); // Refresh team details
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove player');
            }
          }
        }
      ]
    );
  };

  const renderPlayer = ({ item }: { item: Player }) => {
    const playerStats = getPlayerStats(item.id);
    
    return (
      <View style={styles.playerCard}>
        <View style={styles.playerInfo}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerName}>{getRoleIcon(item.role)} {item.name}</Text>
            <View style={styles.playerHeaderRight}>
              {item.jerseyNumber && (
                <View style={styles.jerseyBadge}>
                  <Text style={styles.jerseyNumber}>#{item.jerseyNumber}</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removePlayerFromTeam(item.id, item.name)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.playerDetails}>
            <View style={[styles.positionBadge, { backgroundColor: getPositionColor(item.position) }]}>
              <Text style={styles.positionText}>{item.position}</Text>
            </View>
            <Text style={styles.roleText}>{item.role.replace('_', ' ')}</Text>
          </View>
          
          {/* Player Stats */}
          {statsLoading ? (
            <View style={styles.statsLoading}>
              <ActivityIndicator size="small" color="#2E7D32" />
              <Text style={styles.statsLoadingText}>Loading stats...</Text>
            </View>
          ) : playerStats ? (
            <View style={styles.playerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerStats.goals}</Text>
                <Text style={styles.statName}>Goals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerStats.assists}</Text>
                <Text style={styles.statName}>Assists</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerStats.matchesPlayed}</Text>
                <Text style={styles.statName}>Matches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{playerStats.yellowCards + playerStats.redCards}</Text>
                <Text style={styles.statName}>Cards</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noStats}>
              <Text style={styles.noStatsText}>No stats available</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading team details...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Team not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Teams</Text>
          </TouchableOpacity>
          <Text style={styles.teamName}>{team.name}</Text>
          {team.description && (
            <Text style={styles.teamDescription}>{team.description}</Text>
          )}
        </View>

        {/* Team Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{team.players.length}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {teamStats.reduce((sum, player) => sum + player.goals, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Goals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {teamStats.reduce((sum, player) => sum + player.assists, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Assists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {Math.max(...teamStats.map(p => p.matchesPlayed), 0)}
            </Text>
            <Text style={styles.statLabel}>Matches Played</Text>
          </View>
        </View>

        {/* Squad Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Squad ({team.players.length})</Text>
            <TouchableOpacity 
              style={styles.addPlayerButton}
              onPress={() => navigation.navigate('AddPlayer', { teamId, teamName: team.name })}
            >
              <Text style={styles.addPlayerText}>+ Invite Player</Text>
            </TouchableOpacity>
          </View>

          {team.players.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No players in this team yet</Text>
              <Text style={styles.emptySubtext}>Invite friends to build your squad</Text>
            </View>
          ) : (
            <FlatList
              data={team.players}
              renderItem={renderPlayer}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Matches', { 
              screen: 'CreateMatch',
              params: { homeTeamId: teamId, homeTeamName: team.name }
            })}
          >
            <Text style={styles.primaryButtonText}>🏆 Create Match</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={styles.secondaryButtonText}>📊 View Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  teamName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  teamDescription: {
    fontSize: 16,
    color: '#e8f5e8',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addPlayerButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addPlayerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  playerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  playerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jerseyBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4757',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  jerseyNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  statsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statsLoadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  playerStats: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  statName: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  noStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  noStatsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  secondaryButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
});