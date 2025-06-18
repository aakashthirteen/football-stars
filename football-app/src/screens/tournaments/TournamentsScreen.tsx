import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingActionButton } from '../../components/FloatingActionButton';

// Professional Components
import {
  ProfessionalButton,
  ProfessionalHeader,
  DesignSystem,
} from '../../components/professional';

const { colors, typography, spacing, borderRadius, shadows } = DesignSystem;

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
  const [selectedTab, setSelectedTab] = useState<'active' | 'upcoming' | 'completed'>('active');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTournaments();
      setTournaments(response.tournaments || []);
    } catch (error: any) {
      console.error('Error loading tournaments:', error);
      // Show user-friendly error message
      if (!refreshing) {
        Alert.alert(
          'Connection Error',
          'Unable to load tournaments. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => loadTournaments() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
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
      case 'UPCOMING': return '#4A9FFF';
      case 'ACTIVE': return '#FF6B6B';
      case 'COMPLETED': return '#14B8A6';
      default: return colors.text.secondary;
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'LEAGUE': 
        return { icon: 'trophy' };
      case 'KNOCKOUT': 
        return { icon: 'flash' };
      case 'GROUP_STAGE': 
        return { icon: 'people' };
      default: 
        return { icon: 'flag' };
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

  const renderTournamentCard = (tournament: Tournament) => {
    const progressPercentage = (tournament.registeredTeams / tournament.maxTeams) * 100;
    const typeConfig = getTypeConfig(tournament.tournamentType);

    return (
      <TouchableOpacity 
        key={tournament.id}
        onPress={() => navigation.navigate('TournamentDetails', { tournamentId: tournament.id })}
        activeOpacity={0.8}
        style={styles.tournamentCard}
      >
        <View style={styles.tournamentContent}>
          {/* Icon and Basic Info */}
          <View style={styles.tournamentHeader}>
            <View style={[styles.tournamentIcon, { backgroundColor: colors.primary.main }]}>
              <Ionicons name={typeConfig.icon as any} size={28} color="#FFFFFF" />
            </View>
            
            <View style={styles.tournamentInfo}>
              <Text style={styles.tournamentName} numberOfLines={1}>
                {tournament.name}
              </Text>
              <View style={styles.metaRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tournament.status) }]}>
                  <Text style={styles.statusText}>{tournament.status}</Text>
                </View>
                <Text style={styles.tournamentType}>
                  {tournament.tournamentType.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.statText}>
                {tournament.registeredTeams}/{tournament.maxTeams}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.statText}>
                {formatDate(tournament.startDate)}
              </Text>
            </View>
            
            {tournament.prizePool && (
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={16} color={colors.accent.gold} />
                <Text style={[styles.statText, { color: colors.accent.gold }]}>
                  ₹{tournament.prizePool.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: getStatusColor(tournament.status)
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabSelector = () => {
    const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE');
    const upcomingTournaments = tournaments.filter(t => t.status === 'UPCOMING');
    const completedTournaments = tournaments.filter(t => t.status === 'COMPLETED');

    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
          onPress={() => setSelectedTab('active')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
            Active
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
          onPress={() => setSelectedTab('completed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filteredTournaments = tournaments.filter(t => {
    if (selectedTab === 'active') return t.status === 'ACTIVE';
    if (selectedTab === 'upcoming') return t.status === 'UPCOMING';
    return t.status === 'COMPLETED';
  });

  const renderEmptyState = () => {
    const emptyConfig = {
      active: {
        icon: 'flash-outline',
        title: 'No Active Tournaments',
        subtitle: 'Check upcoming tournaments or create a new one',
      },
      upcoming: {
        icon: 'calendar-outline',
        title: 'No Upcoming Tournaments',
        subtitle: 'Create a tournament to get started',
      },
      completed: {
        icon: 'trophy-outline',
        title: 'No Completed Tournaments',
        subtitle: 'Tournaments you\'ve participated in will appear here',
      },
    }[selectedTab];

    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary.main }]}>
          <Ionicons name={emptyConfig.icon as any} size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.emptyTitle}>{emptyConfig.title}</Text>
        <Text style={styles.emptySubtitle}>{emptyConfig.subtitle}</Text>
        {selectedTab !== 'completed' && (
          <ProfessionalButton
            title="Create Tournament"
            icon="add-circle"
            onPress={() => navigation.navigate('CreateTournament')}
            style={styles.createButton}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
            colors={[colors.primary.main]}
          />
        }
      >
        {/* Professional Header */}
        <ProfessionalHeader
          title="Tournaments"
          subtitle="Compete and win prizes"
          showNotifications
          onNotifications={() => navigation.getParent()?.navigate('Profile')}
        />

        {/* Tab Selector */}
        <View style={styles.tabSection}>
          {renderTabSelector()}
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary.main} />
                <Text style={styles.loadingText}>Loading tournaments...</Text>
                <Text style={styles.loadingSubtext}>Finding competitions near you</Text>
              </View>
            </View>
          ) : (
            <>
              {filteredTournaments.length > 0 ? (
                <View style={styles.tournamentsList}>
                  {filteredTournaments.map(renderTournamentCard)}
                </View>
              ) : (
                renderEmptyState()
              )}
            </>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => navigation.navigate('CreateTournament')}
        icon="add"
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  loadingCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    ...shadows.md,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  loadingSubtext: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Tab Section - La Liga style
  tabSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  activeTabCount: {
    color: '#FFFFFF',
  },

  // Content Section
  contentSection: {
    paddingHorizontal: spacing.screenPadding,
  },
  tournamentsList: {
    gap: spacing.md,
  },

  // Tournament Card - Modern design
  tournamentCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  tournamentContent: {
    padding: spacing.lg,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tournamentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.badge,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tournamentType: {
    fontSize: 13,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surface.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 35,
    textAlign: 'right',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  createButton: {
    marginTop: spacing.sm,
  },

  bottomSpacing: {
    height: 120,
  },
  fab: {
    bottom: 100,
  },
});