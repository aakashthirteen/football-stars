import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

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
}

interface TournamentsScreenProps {
  navigation: any;
}

export default function TournamentsScreen({ navigation }: TournamentsScreenProps) {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTournaments();
      setTournaments(response.tournaments);
    } catch (error: any) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTournaments();
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
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderTournament = ({ item }: { item: Tournament }) => (
    <TouchableOpacity 
      style={styles.tournamentCard}
      onPress={() => navigation.navigate('TournamentDetails', { tournamentId: item.id })}
    >
      <View style={styles.tournamentHeader}>
        <View style={styles.tournamentTitle}>
          <Text style={styles.tournamentIcon}>{getTypeIcon(item.tournamentType)}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.tournamentName}>{item.name}</Text>
            <Text style={styles.tournamentType}>{item.tournamentType.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.tournamentDescription}>{item.description}</Text>
      )}

      <View style={styles.tournamentInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teams:</Text>
          <Text style={styles.infoValue}>{item.registeredTeams}/{item.maxTeams}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duration:</Text>
          <Text style={styles.infoValue}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>

        {item.prizePool && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prize Pool:</Text>
            <Text style={styles.prizeText}>₹{item.prizePool.toLocaleString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${(item.registeredTeams / item.maxTeams) * 100}%`,
                backgroundColor: getStatusColor(item.status)
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((item.registeredTeams / item.maxTeams) * 100)}% Full
        </Text>
      </View>
    </TouchableOpacity>
  );

  const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE');
  const upcomingTournaments = tournaments.filter(t => t.status === 'UPCOMING');
  const completedTournaments = tournaments.filter(t => t.status === 'COMPLETED');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tournaments</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateTournament')}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>Loading tournaments...</Text>
          </View>
        ) : (
          <>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{activeTournaments.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{upcomingTournaments.length}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{completedTournaments.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            {/* Active Tournaments */}
            {activeTournaments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔥 Active Tournaments</Text>
                <FlatList
                  data={activeTournaments}
                  renderItem={renderTournament}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Upcoming Tournaments */}
            {upcomingTournaments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Upcoming Tournaments</Text>
                <FlatList
                  data={upcomingTournaments}
                  renderItem={renderTournament}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Completed Tournaments */}
            {completedTournaments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏁 Completed Tournaments</Text>
                <FlatList
                  data={completedTournaments}
                  renderItem={renderTournament}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {tournaments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>No Tournaments Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first tournament to organize competitions
                </Text>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('CreateTournament')}
                >
                  <Text style={styles.primaryButtonText}>Create Tournament</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tournamentCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tournamentTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tournamentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  tournamentType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tournamentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  tournamentInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  prizeText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});