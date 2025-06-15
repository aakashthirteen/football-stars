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

interface TournamentDetailsScreenProps {
  navigation: any;
  route: any;
}

export default function TournamentDetailsScreen({ navigation, route }: TournamentDetailsScreenProps) {
  const { tournamentId } = route.params;
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadTournamentDetails();
    loadStandings();
    loadUserTeams();
  }, []);

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

        {/* Standings */}
        {standings.length > 0 && (
          <View style={styles.standingsCard}>
            <Text style={styles.sectionTitle}>Standings</Text>
            
            {/* Header */}
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
          </View>
        )}

        {/* Empty State for New Tournament */}
        {standings.length === 0 && tournament.status === 'UPCOMING' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Tournament Not Started</Text>
            <Text style={styles.emptySubtitle}>
              Standings will appear once matches begin
            </Text>
          </View>
        )}
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
});