import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { getTournamentTypeGradient } from '../../utils/gradients';

// Professional Components
import {
  ProfessionalButton,
  ProfessionalHeader,
  DesignSystem,
} from '../../components/professional';

const { width } = Dimensions.get('window');
const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;

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
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadTournaments();
    animateEntrance();
  }, []);

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

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
        return { icon: 'trophy', emoji: '🏆' };
      case 'KNOCKOUT': 
        return { icon: 'flash', emoji: '⚔️' };
      case 'GROUP_STAGE': 
        return { icon: 'people', emoji: '🏟️' };
      default: 
        return { icon: 'flag', emoji: '🎯' };
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

  const renderTournamentCard = (tournament: Tournament, index: number) => {
    const progressPercentage = (tournament.registeredTeams / tournament.maxTeams) * 100;
    const typeConfig = getTypeConfig(tournament.tournamentType);
    const tournamentGradient = getTournamentTypeGradient(tournament.tournamentType);

    return (
      <Animated.View
        key={tournament.id}
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity 
          onPress={() => navigation.navigate('TournamentDetails', { tournamentId: tournament.id })}
          activeOpacity={0.9}
          style={styles.tournamentCard}
        >
          {/* Gradient Background */}
          <LinearGradient
            colors={tournamentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tournamentGradient}
          />
          
          {/* Glass Effect Overlay */}
          <View style={styles.glassOverlay}>
            <View style={styles.tournamentContent}>
              {/* Header Section */}
              <View style={styles.tournamentHeader}>
                <View style={styles.tournamentIconWrapper}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                    style={styles.tournamentIconGradient}
                  >
                    <Text style={styles.tournamentEmoji}>{typeConfig.emoji || '🏆'}</Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.tournamentInfo}>
                  <Text style={styles.tournamentName} numberOfLines={1}>
                    {tournament.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.statusBadge, tournament.status === 'ACTIVE' && styles.activeBadge]}>
                      {tournament.status === 'ACTIVE' && (
                        <View style={styles.liveDot} />
                      )}
                      <Text style={styles.statusText}>{tournament.status}</Text>
                    </View>
                    <Text style={styles.tournamentType}>
                      {tournament.tournamentType.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                
                {/* Prize Badge */}
                {tournament.prizePool && (
                  <View style={styles.prizeBadge}>
                    <Ionicons name="trophy" size={16} color={colors.accent.gold} />
                    <Text style={styles.prizeText}>₹{tournament.prizePool.toLocaleString()}</Text>
                  </View>
                )}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="people" size={20} color={colors.primary.main} />
                  <Text style={styles.statNumber}>{tournament.registeredTeams}</Text>
                  <Text style={styles.statLabel}>Teams</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="flag" size={20} color={colors.accent.blue} />
                  <Text style={styles.statNumber}>{tournament.maxTeams}</Text>
                  <Text style={styles.statLabel}>Max</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="calendar" size={20} color={colors.accent.purple} />
                  <Text style={styles.statNumber}>{new Date(tournament.startDate).getDate()}</Text>
                  <Text style={styles.statLabel}>{new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short' })}</Text>
                </View>
              </View>

              {/* Modern Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Registration Progress</Text>
                  <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${progressPercentage}%`,
                      }
                    ]} 
                  >
                    <LinearGradient
                      colors={['#00FF66', '#00D757']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressGradient}
                    />
                  </Animated.View>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTabSelector = () => {
    const tabs = [
      { 
        key: 'active', 
        label: 'Active',
        count: tournaments.filter(t => t.status === 'ACTIVE').length,
        icon: 'flash',
      },
      { 
        key: 'upcoming', 
        label: 'Upcoming',
        count: tournaments.filter(t => t.status === 'UPCOMING').length,
        icon: 'calendar',
      },
      { 
        key: 'completed', 
        label: 'Completed',
        count: tournaments.filter(t => t.status === 'COMPLETED').length,
        icon: 'trophy',
      },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={selectedTab === tab.key ? '#FFFFFF' : colors.text.tertiary} 
            />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, selectedTab === tab.key && styles.activeTabBadge]}>
                <Text style={[styles.tabCount, selectedTab === tab.key && styles.activeTabCount]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
        gradient: gradients.primary,
      },
      upcoming: {
        icon: 'calendar-outline',
        title: 'No Upcoming Tournaments',
        subtitle: 'Create a tournament to get started',
        gradient: gradients.accent,
      },
      completed: {
        icon: 'trophy-outline',
        title: 'No Completed Tournaments',
        subtitle: 'Tournaments you\'ve participated in will appear here',
        gradient: gradients.success,
      },
    }[selectedTab];

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <LinearGradient
            colors={emptyConfig.gradient}
            style={styles.emptyIconGradient}
          >
            <Ionicons name={emptyConfig.icon as any} size={48} color="#FFFFFF" />
          </LinearGradient>
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
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
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
          {/* Professional Header with Gradient */}
          <LinearGradient
            colors={gradients.header}
            style={styles.headerGradient}
          >
            <ProfessionalHeader
              title="Tournaments"
              subtitle="Compete and win prizes"
              showNotifications
              onNotifications={() => navigation.getParent()?.navigate('Profile')}
              style={styles.transparentHeader}
            />
          </LinearGradient>

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
                    {filteredTournaments.map((tournament, index) => renderTournamentCard(tournament, index))}
                  </View>
                ) : (
                  renderEmptyState()
                )}
              </>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
      
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
  animatedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: spacing.lg,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
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
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.primary,
  },
  loadingSubtext: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Modern Tab Section
  tabSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface.glass,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xxs,
  },
  activeTab: {
    backgroundColor: colors.primary.main,
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text.tertiary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabCount: {
    fontSize: 10,
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
    gap: spacing.lg,
  },

  // Modern Tournament Card
  tournamentCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.lg,
  },
  tournamentGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  glassOverlay: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  tournamentContent: {
    padding: spacing.xl,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tournamentIconWrapper: {
    marginRight: spacing.md,
  },
  tournamentIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentEmoji: {
    fontSize: 28,
  },
  tournamentInfo: {
    flex: 1,
  },
  tournamentName: {
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold as any,
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
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.badge,
    backgroundColor: colors.surface.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeBadge: {
    backgroundColor: colors.status.live,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: typography.fontSize.micro,
    fontWeight: typography.fontWeight.bold as any,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tournamentType: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    fontWeight: typography.fontWeight.medium as any,
  },
  prizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.badge,
  },
  prizeText: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.accent.gold,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  statNumber: {
    fontSize: typography.fontSize.large,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginTop: spacing.xxs,
  },
  statLabel: {
    fontSize: typography.fontSize.micro,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },

  // Progress Section
  progressSection: {
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
  },
  progressPercentage: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.primary.main,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.regular,
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