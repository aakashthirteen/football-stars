import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { TeamPlayerStats } from '../../types';

const { width } = Dimensions.get('window');

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
  const [refreshing, setRefreshing] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadTeamDetails();
    animateEntrance();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTeamDetails();
    });
    return unsubscribe;
  }, [navigation]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadTeamDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTeamById(teamId);
      
      if (response.team && response.team.players) {
        const transformedPlayers = response.team.players.map((tp: any) => ({
          id: tp.player_id || tp.playerId,
          name: tp.player?.name || tp.player_name || 'Unknown Player',
          position: tp.player?.position || tp.position || 'Unknown',
          jerseyNumber: tp.jersey_number || tp.jerseyNumber,
          role: tp.role || 'PLAYER'
        }));
        
        setTeam({
          ...response.team,
          players: transformedPlayers
        });
      } else {
        setTeam(response.team);
      }
      
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
      setTeamStats(response.players || []);
    } catch (error: any) {
      console.error('Error loading team stats:', error);
      // Set default stats if API fails
      setTeamStats([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamDetails();
    setRefreshing(false);
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'GK': return '#9C27B0';
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
    const stats = teamStats.find(stats => stats.playerId === playerId);
    return stats || {
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    };
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
              loadTeamDetails();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove player');
            }
          }
        }
      ]
    );
  };

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => {
    const playerStats = getPlayerStats(item.id);
    const animDelay = index * 100;
    
    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50 + animDelay/10],
              })
            }]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
          style={styles.playerCard}
        >
          <View style={styles.playerHeader}>
            <View style={styles.playerInfo}>
              <LinearGradient
                colors={[getPositionColor(item.position), getPositionColor(item.position) + '80']}
                style={styles.playerAvatar}
              >
                <Text style={styles.playerNumber}>
                  {item.jerseyNumber || item.name.charAt(0)}
                </Text>
              </LinearGradient>
              
              <View style={styles.playerDetails}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.roleIcon}>{getRoleIcon(item.role)}</Text>
                  <Text style={styles.playerName}>{item.name}</Text>
                </View>
                <View style={styles.playerMeta}>
                  <View style={[styles.positionBadge, { backgroundColor: getPositionColor(item.position) + '20' }]}>
                    <Text style={[styles.positionText, { color: getPositionColor(item.position) }]}>
                      {item.position}
                    </Text>
                  </View>
                  <Text style={styles.roleText}>{item.role.replace('_', ' ')}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removePlayerFromTeam(item.id, item.name)}
            >
              <Ionicons name="close-circle" size={24} color="#ff4757" />
            </TouchableOpacity>
          </View>
          
          {/* Player Stats */}
          <View style={styles.playerStatsContainer}>
            {statsLoading ? (
              <View style={styles.statsLoading}>
                <ActivityIndicator size="small" color="#4CAF50" />
              </View>
            ) : (
              <View style={styles.playerStats}>
                <StatItem label="Matches" value={playerStats.matchesPlayed} icon="calendar" />
                <StatItem label="Goals" value={playerStats.goals} icon="football" color="#4CAF50" />
                <StatItem label="Assists" value={playerStats.assists} icon="hand-left" color="#2196F3" />
                <StatItem label="Cards" value={playerStats.yellowCards + playerStats.redCards} icon="card" color="#FF9800" />
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading team details...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.errorGradient}>
          <Ionicons name="warning" size={64} color="#ff4757" />
          <Text style={styles.errorText}>Team not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const totalGoals = teamStats.reduce((sum, player) => sum + (player.goals || 0), 0);
  const totalAssists = teamStats.reduce((sum, player) => sum + (player.assists || 0), 0);
  const totalMatches = teamStats.length > 0 
    ? Math.max(...teamStats.map(p => p.matchesPlayed || 0)) 
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.backgroundGradient} />
      
      {/* Header */}
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.teamName}>{team.name}</Text>
          {team.description && (
            <Text style={styles.teamDescription} numberOfLines={2}>
              {team.description}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.headerMenuButton}
          onPress={() => {}}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
      >
        {/* Team Stats */}
        <Animated.View 
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <StatCard
              icon="people"
              value={team.players.length}
              label="Players"
              gradient={['#2196F3', '#1976D2']}
            />
            <StatCard
              icon="football"
              value={totalGoals}
              label="Total Goals"
              gradient={['#4CAF50', '#2E7D32']}
            />
            <StatCard
              icon="hand-left"
              value={totalAssists}
              label="Total Assists"
              gradient={['#FF9800', '#F57C00']}
            />
            <StatCard
              icon="calendar"
              value={totalMatches}
              label="Matches"
              gradient={['#9C27B0', '#7B1FA2']}
            />
          </ScrollView>
        </Animated.View>

        {/* Squad Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Squad ({team.players.length})</Text>
            <TouchableOpacity 
              style={styles.addPlayerButton}
              onPress={() => navigation.navigate('AddPlayer', { teamId, teamName: team.name })}
            >
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.addPlayerGradient}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addPlayerText}>Invite Player</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {team.players.length === 0 ? (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
              style={styles.emptyState}
            >
              <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyText}>No players in this team yet</Text>
              <Text style={styles.emptySubtext}>Invite friends to build your squad</Text>
            </LinearGradient>
          ) : (
            <FlatList
              data={team.players}
              renderItem={renderPlayer}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.playersList}
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
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="football" size={24} color="#fff" />
              <Text style={styles.primaryButtonText}>Create Match</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Ionicons name="stats-chart" size={24} color="#4CAF50" />
            <Text style={styles.secondaryButtonText}>View Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const StatItem: React.FC<{
  label: string;
  value: number;
  icon: string;
  color?: string;
}> = ({ label, value, icon, color = '#fff' }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon as any} size={16} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatCard: React.FC<{
  icon: string;
  value: number;
  label: string;
  gradient: string[];
}> = ({ icon, value, label, gradient }) => (
  <LinearGradient colors={gradient} style={styles.statCard}>
    <Ionicons name={icon as any} size={32} color="#fff" />
    <Text style={styles.statCardValue}>{value}</Text>
    <Text style={styles.statCardLabel}>{label}</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  statsSection: {
    paddingVertical: 20,
  },
  statCard: {
    width: 120,
    height: 120,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: 20,
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
    color: '#fff',
  },
  addPlayerButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addPlayerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  addPlayerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playersList: {
    gap: 12,
  },
  playerCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerDetails: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'capitalize',
  },
  removeButton: {
    padding: 4,
  },
  playerStatsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsLoading: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});