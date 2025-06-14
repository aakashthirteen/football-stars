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
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

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

const TABS = ['Overview', 'Standings', 'Schedule', 'Stats'];

export default function TournamentDetailsScreen({ navigation, route }: TournamentDetailsScreenProps) {
  const { tournamentId } = route.params;
  const { user } = useAuthStore();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [matches, setMatches] = useState<any[]>([]);
  
  const tabSlideAnimation = new Animated.Value(0);

  useEffect(() => {
    loadTournamentDetails();
    loadStandings();
    loadUserTeams();
  }, []);

  useEffect(() => {
    // Animate tab change
    Animated.timing(tabSlideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      tabSlideAnimation.setValue(0);
    });
  }, [activeTab]);

  const loadTournamentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTournamentById(tournamentId);
      setTournament(response.tournament);
      setMatches(response.tournament.matches || []);
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
      console.log('🏆 Raw standings response:', response);
      
      // Normalize standings data - backend might use different field names
      const normalizedStandings = (response.standings || []).map((standing: any) => ({
        ...standing,
        teamName: standing.teamName || standing.team_name || standing.name || standing.team?.name || 'Unknown Team',
        matches: standing.matches || standing.matchesPlayed || standing.gamesPlayed || 0,
        wins: standing.wins || standing.victories || 0,
        draws: standing.draws || standing.ties || 0,
        losses: standing.losses || standing.defeats || 0,
        goalsFor: standing.goalsFor || standing.goals_for || standing.scored || 0,
        goalsAgainst: standing.goalsAgainst || standing.goals_against || standing.conceded || 0,
        goalDifference: standing.goalDifference || standing.goal_difference || 
          ((standing.goalsFor || standing.goals_for || 0) - (standing.goalsAgainst || standing.goals_against || 0)),
        points: standing.points || standing.pts || 0,
      }));
      
      console.log('✅ Normalized standings:', normalizedStandings);
      setStandings(normalizedStandings);
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
      loadTournamentDetails();
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
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderTabContent = () => {
    const fadeIn = 1; // Remove opacity animation to prevent greying out

    switch (activeTab) {
      case 'Overview':
        return (
          <Animated.View style={{ opacity: fadeIn }}>
            {renderOverview()}
          </Animated.View>
        );
      
      case 'Standings':
        return (
          <Animated.View style={{ opacity: fadeIn }}>
            {renderStandings()}
          </Animated.View>
        );
      
      case 'Schedule':
        return (
          <Animated.View style={{ opacity: fadeIn }}>
            {renderSchedule()}
          </Animated.View>
        );
      
      case 'Stats':
        return (
          <Animated.View style={{ opacity: fadeIn }}>
            {renderStats()}
          </Animated.View>
        );
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Tournament Info Card */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
        style={styles.infoCard}
      >
        <View style={styles.tournamentHeader}>
          <Text style={styles.tournamentIcon}>{getTypeIcon(tournament!.tournamentType)}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.tournamentName}>{tournament!.name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament!.status) }]}>
                <Text style={styles.statusText}>{tournament!.status}</Text>
              </View>
              <Text style={styles.tournamentType}>{tournament!.tournamentType.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {tournament!.description && (
          <Text style={styles.description}>{tournament!.description}</Text>
        )}

        <View style={styles.infoGrid}>
          <InfoItem
            icon="people"
            label="Teams"
            value={`${tournament!.registeredTeams}/${tournament!.maxTeams}`}
          />
          <InfoItem
            icon="calendar"
            label="Duration"
            value={`${formatDate(tournament!.startDate)} - ${formatDate(tournament!.endDate)}`}
          />
          {tournament!.prizePool && (
            <InfoItem
              icon="trophy"
              label="Prize Pool"
              value={`₹${tournament!.prizePool.toLocaleString()}`}
              valueColor="#FFD700"
            />
          )}
        </View>

        {tournament!.status === 'UPCOMING' && tournament!.registeredTeams < tournament!.maxTeams && (
          <TouchableOpacity onPress={() => setShowTeamSelector(true)}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.registerButton}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.registerButtonText}>Register Team</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );

  const renderStandings = () => (
    <View style={styles.tabContent}>
      {standings.length > 0 ? (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
          style={styles.standingsCard}
        >
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
            renderItem={renderStandingRow}
            keyExtractor={(item) => item.teamId}
            scrollEnabled={false}
          />
        </LinearGradient>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="podium-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.emptyTitle}>No Standings Yet</Text>
          <Text style={styles.emptySubtitle}>
            Standings will appear once matches begin
          </Text>
        </View>
      )}
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.tabContent}>
      {matches.length > 0 ? (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.emptyTitle}>No Matches Scheduled</Text>
          <Text style={styles.emptySubtitle}>
            Match schedule will be available soon
          </Text>
        </View>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
        style={styles.statsCard}
      >
        <Text style={styles.statsTitle}>Tournament Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Top Scorer</Text>
          <Text style={styles.statValue}>Coming Soon</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Most Assists</Text>
          <Text style={styles.statValue}>Coming Soon</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Goals</Text>
          <Text style={styles.statValue}>0</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderStandingRow = ({ item, index }: { item: Standing; index: number }) => (
    <View style={[styles.standingRow, index === 0 && styles.firstPlace]}>
      <View style={styles.positionContainer}>
        <Text style={[styles.position, index === 0 && styles.firstPlaceText]}>
          {item.position}
        </Text>
      </View>
      <View style={styles.teamContainer}>
        <Text style={[styles.teamName, index === 0 && styles.firstPlaceText]}>
          {item.teamName}
        </Text>
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

  const renderMatch = ({ item }: { item: any }) => (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
      style={styles.matchCard}
    >
      <Text style={styles.matchDate}>{formatDate(item.matchDate)}</Text>
      <View style={styles.matchTeams}>
        <Text style={styles.matchTeamName}>{item.homeTeam?.name || 'TBD'}</Text>
        <Text style={styles.matchVs}>vs</Text>
        <Text style={styles.matchTeamName}>{item.awayTeam?.name || 'TBD'}</Text>
      </View>
      {item.venue && <Text style={styles.matchVenue}>{item.venue}</Text>}
    </LinearGradient>
  );

  const renderTeamOption = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.teamOption}
      onPress={() => handleRegisterTeam(item.id)}
      disabled={registering}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
        style={styles.teamOptionGradient}
      >
        <View style={styles.teamOptionInfo}>
          <Text style={styles.teamOptionName}>{item.name}</Text>
          <Text style={styles.teamOptionPlayers}>
            <Ionicons name="people" size={14} color="rgba(255, 255, 255, 0.6)" />
            {' '}{item.players?.length || 0} players
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading tournament...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.errorGradient}>
          <Text style={styles.errorText}>Tournament not found</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.backgroundGradient} />
      
      {/* Header */}
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{tournament.name}</Text>
        
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Team Selection Modal */}
      <Modal
        visible={showTeamSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#0A0E27', '#1A1F3A']} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowTeamSelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
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
                  <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.noTeamsTitle}>No Teams Available</Text>
                  <Text style={styles.noTeamsSubtitle}>
                    Create a team first to register for tournaments
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowTeamSelector(false);
                      navigation.navigate('Teams');
                    }}
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#2E7D32']}
                      style={styles.createTeamButton}
                    >
                      <Text style={styles.createTeamButtonText}>Create Team</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const InfoItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}> = ({ icon, label, value, valueColor = '#fff' }) => (
  <View style={styles.infoItem}>
    <View style={styles.infoItemHeader}>
      <Ionicons name={icon as any} size={16} color="rgba(255, 255, 255, 0.6)" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
  </View>
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
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4757',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingVertical: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#fff',
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
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoGrid: {
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  standingsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  firstPlace: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  firstPlaceText: {
    color: '#FFD700',
  },
  positionContainer: {
    width: 30,
    alignItems: 'center',
  },
  position: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  teamName: {
    fontSize: 16,
    color: '#fff',
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
    color: '#4CAF50',
    textAlign: 'center',
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    minWidth: 20,
  },
  pointsText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  matchCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  matchDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  matchTeamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  matchVs: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  matchVenue: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  teamOption: {
    marginBottom: 12,
  },
  teamOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamOptionInfo: {
    flex: 1,
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  teamOptionPlayers: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  noTeamsState: {
    alignItems: 'center',
    padding: 60,
  },
  noTeamsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  noTeamsSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createTeamButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createTeamButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});