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
  Animated,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
}

interface TournamentsScreenProps {
  navigation: any;
}

export default function TournamentsScreen({ navigation }: TournamentsScreenProps) {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadTournaments();
    // Beautiful entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTournaments();
      setTournaments(response.tournaments || []);
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

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'UPCOMING': return ['#2196F3', '#1976D2', '#0D47A1'];
      case 'ACTIVE': return ['#4CAF50', '#2E7D32', '#1B5E20'];
      case 'COMPLETED': return ['#9E9E9E', '#616161', '#424242'];
      default: return ['#666', '#444', '#333'];
    }
  };

  const getTypeGradient = (type: string) => {
    switch (type) {
      case 'LEAGUE': return ['#FF6B35', '#E55100', '#BF360C'];
      case 'KNOCKOUT': return ['#E91E63', '#C2185B', '#AD1457'];
      case 'GROUP_STAGE': return ['#9C27B0', '#7B1FA2', '#6A1B9A'];
      default: return ['#607D8B', '#455A64', '#37474F'];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LEAGUE': return 'trophy';
      case 'KNOCKOUT': return 'flash';
      case 'GROUP_STAGE': return 'grid';
      default: return 'flag';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderTournament = ({ item, index }: { item: Tournament; index: number }) => {
    const progressPercentage = (item.registeredTeams / item.maxTeams) * 100;

    return (
      <Animated.View
        style={[
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('TournamentDetails', { tournamentId: item.id })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.tournamentCard}
          >
            {/* Status glow effect */}
            <LinearGradient
              colors={getStatusGradient(item.status)}
              style={styles.statusGlow}
            />
            
            <View style={styles.tournamentHeader}>
              <View style={styles.tournamentTitle}>
                <LinearGradient
                  colors={getTypeGradient(item.tournamentType)}
                  style={styles.tournamentIconContainer}
                >
                  <Ionicons name={getTypeIcon(item.tournamentType) as any} size={24} color="#fff" />
                </LinearGradient>
                
                <View style={styles.titleContainer}>
                  <Text style={styles.tournamentName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.tournamentType}>{item.tournamentType.replace('_', ' ')}</Text>
                </View>
              </View>
              
              <LinearGradient
                colors={getStatusGradient(item.status)}
                style={styles.statusBadge}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </LinearGradient>
            </View>

            {item.description && (
              <Text style={styles.tournamentDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.tournamentInfo}>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="people" size={16} color="#4CAF50" />
                  <Text style={styles.infoLabel}>Teams</Text>
                  <Text style={styles.infoValue}>{item.registeredTeams}/{item.maxTeams}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="calendar" size={16} color="#2196F3" />
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{formatDate(item.startDate)}</Text>
                </View>

                {item.prizePool && (
                  <View style={styles.infoItem}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.infoLabel}>Prize</Text>
                    <Text style={styles.prizeText}>₹{item.prizePool.toLocaleString()}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Registration Progress</Text>
                <Text style={styles.progressPercent}>{Math.round(progressPercentage)}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={getStatusGradient(item.status)}
                  style={[styles.progressBar, { width: `${progressPercentage}%` }]}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE');
  const upcomingTournaments = tournaments.filter(t => t.status === 'UPCOMING');
  const completedTournaments = tournaments.filter(t => t.status === 'COMPLETED');

  return (
    <View style={styles.container}>
      {/* Stadium Background Pattern */}
      <View style={styles.backgroundPattern} />
      
      {/* Header with Stadium Lighting Effect */}
      <LinearGradient
        colors={['#0A0E27', '#1A1F3A', '#2D3748']}
        style={styles.header}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View>
            <Text style={styles.headerTitle}>Tournaments</Text>
            <Text style={styles.headerSubtitle}>Compete for glory and prizes</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('CreateTournament')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.createButton}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.loadingCard}
            >
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading tournaments...</Text>
            </LinearGradient>
          </View>
        ) : (
          <>
            {/* Quick Stats */}
            <Animated.View 
              style={[
                styles.statsContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.statCard}
              >
                <Ionicons name="flash" size={24} color="#fff" />
                <Text style={styles.statNumber}>{activeTournaments.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.statCard}
              >
                <Ionicons name="calendar" size={24} color="#fff" />
                <Text style={styles.statNumber}>{upcomingTournaments.length}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={['#9E9E9E', '#616161']}
                style={styles.statCard}
              >
                <Ionicons name="trophy" size={24} color="#fff" />
                <Text style={styles.statNumber}>{completedTournaments.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </LinearGradient>
            </Animated.View>

            {/* Active Tournaments */}
            {activeTournaments.length > 0 && (
              <Animated.View 
                style={[
                  styles.section,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="flash" size={20} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Live Tournaments</Text>
                </View>
                <FlatList
                  data={activeTournaments}
                  renderItem={renderTournament}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </Animated.View>
            )}

            {/* Upcoming Tournaments */}
            {upcomingTournaments.length > 0 && (
              <Animated.View 
                style={[
                  styles.section,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={20} color="#2196F3" />
                  <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
                </View>
                <FlatList
                  data={upcomingTournaments}
                  renderItem={renderTournament}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </Animated.View>
            )}

            {/* Completed Tournaments */}
            {completedTournaments.length > 0 && (
              <Animated.View 
                style={[
                  styles.section,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={20} color="#9E9E9E" />
                  <Text style={styles.sectionTitle}>Completed Tournaments</Text>
                </View>
                <FlatList
                  data={completedTournaments}
                  renderItem={renderTournament}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </Animated.View>
            )}

            {/* Empty State */}
            {tournaments.length === 0 && (
              <Animated.View 
                style={[
                  styles.emptyState,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.emptyContainer}
                >
                  <Ionicons name="trophy-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.emptyTitle}>No Tournaments Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create your first tournament to organize competitions
                  </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('CreateTournament')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4CAF50', '#2E7D32']}
                      style={styles.primaryButton}
                    >
                      <Ionicons name="add-circle" size={24} color="#fff" />
                      <Text style={styles.primaryButtonText}>Create Tournament</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
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
    backgroundColor: '#0A0E27',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: '#0A0E27',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tournamentCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  statusGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
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
  tournamentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  titleContainer: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  tournamentType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  tournamentDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
    lineHeight: 20,
  },
  tournamentInfo: {
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  prizeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  progressSection: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});