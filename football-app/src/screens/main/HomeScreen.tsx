import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

// Professional Components
import { 
  ProfessionalHeader, 
  ProfessionalMatchCard, 
  ProfessionalPlayerStats,
  ProfessionalButton,
  DesignSystem 
} from '../../components/professional';

import { FloatingActionButton } from '../../components/FloatingActionButton';

const { width, height } = Dimensions.get('window');
const { colors, typography, spacing, borderRadius, shadows, gradients } = DesignSystem;

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tickerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateEntrance();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
      return () => {};
    }, [])
  );

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

  const startTickerAnimation = (matchesCount: number) => {
    // Reset and start ticker animation for live matches
    tickerAnim.setValue(0);
    Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: -matchesCount * 200, // Each match takes ~200px width
        duration: matchesCount * 5000, // 5 seconds per match
        useNativeDriver: true,
      })
    ).start();
  };

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Load matches
      try {
        const matchesResponse = await apiService.getMatches();
        const matches = matchesResponse.matches || [];
        
        setAllMatches(matches);
        
        // Start ticker animation if there are live matches
        const liveMatches = matches.filter((m: any) => m.status === 'LIVE');
        if (liveMatches.length > 0) {
          startTickerAnimation(liveMatches.length);
        }
        
        // Filter upcoming matches
        const now = new Date();
        const userUpcomingMatches = matches
          .filter((match: any) => {
            if (!match.matchDate) return false;
            const matchDate = new Date(match.matchDate);
            return matchDate > now && match.status === 'SCHEDULED';
          })
          .sort((a: any, b: any) => 
            new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
          )
          .slice(0, 5);
        
        setUpcomingMatches(userUpcomingMatches);
      } catch (error) {
        console.error('Error loading matches:', error);
        setUpcomingMatches([]);
        setAllMatches([]);
      }
      
      // Load player stats
      try {
        const stats = await apiService.getCurrentUserStats();
        
        if (!stats) {
          throw new Error('No stats data');
        }
        
        const matchesPlayed = parseInt(stats.matchesPlayed || stats.matches_played || '0');
        const goals = parseInt(stats.goals || '0');
        const assists = parseInt(stats.assists || '0');
        
        let averageRating = parseFloat(stats.averageRating || stats.average_rating || '0');
        if (averageRating === 0 && matchesPlayed > 0) {
          averageRating = Math.min(5.0 + ((goals + assists) / matchesPlayed), 10.0);
        }
        
        setPlayerStats({
          matchesPlayed,
          goals,
          assists,
          averageRating,
          position: stats.position || 'MID',
          yellowCards: parseInt(stats.yellowCards || stats.yellow_cards || '0'),
          redCards: parseInt(stats.redCards || stats.red_cards || '0'),
          minutesPlayed: parseInt(stats.minutesPlayed || stats.minutes_played || '0'),
        });
        
      } catch (error) {
        console.error('Error loading stats:', error);
        setPlayerStats({
          goals: 0,
          assists: 0,
          matchesPlayed: 0,
          averageRating: 0,
          position: 'MID',
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderLiveMatchTicker = () => {
    const liveMatches = allMatches.filter(m => m.status === 'LIVE');
    if (liveMatches.length === 0) return null;

    // Duplicate matches for continuous scroll
    const tickerMatches = [...liveMatches, ...liveMatches];

    return (
      <View style={styles.liveTickerContainer}>
        <LinearGradient
          colors={[colors.accent.coral, colors.accent.orange]}
          style={styles.liveTickerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          
          <View style={styles.tickerContent}>
            <Animated.View 
              style={[
                styles.tickerScroll,
                {
                  transform: [{ translateX: tickerAnim }],
                },
              ]}
            >
              {tickerMatches.map((match, index) => (
                <TouchableOpacity
                  key={`${match.id}-${index}`}
                  style={styles.tickerItem}
                  onPress={() => navigation.getParent()?.navigate('Matches', { 
                    screen: 'MatchScoring', 
                    params: { matchId: match.id } 
                  })}
                >
                  <Text style={styles.tickerMatch}>
                    {match.homeTeam?.name} {match.homeScore} - {match.awayScore} {match.awayTeam?.name}
                  </Text>
                  <View style={styles.tickerSeparator} />
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        id: 'match',
        title: 'Quick Match',
        icon: 'football',
        gradient: gradients.quickMatch,
        screen: 'Matches',
        nested: { screen: 'CreateMatch' },
      },
      {
        id: 'team',
        title: 'My Teams',
        icon: 'people',
        gradient: gradients.quickTeam,
        screen: 'Teams',
      },
      {
        id: 'tournament',
        title: 'Tournaments',
        icon: 'trophy',
        gradient: gradients.quickTournament,
        screen: 'Tournaments',
      },
      {
        id: 'discover',
        title: 'Find Players',
        icon: 'search',
        gradient: gradients.quickDiscover,
        screen: 'PlayerDiscovery',
      },
    ];

    return (
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => {
                if (action.nested) {
                  navigation.getParent()?.navigate(action.screen, action.nested);
                } else {
                  navigation.getParent()?.navigate(action.screen);
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={action.gradient}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.quickActionContent}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                </View>
                <View style={styles.quickActionArrow}>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMatches = () => {
    const liveMatches = allMatches.filter(match => match.status === 'LIVE');
    const recentMatches = allMatches
      .filter(match => match.status === 'COMPLETED')
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
      .slice(0, 3);
    
    const displayMatches = [...liveMatches, ...recentMatches];
    
    if (displayMatches.length === 0 && upcomingMatches.length === 0) {
      return (
        <View style={styles.emptySection}>
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary.main }]}>
              <Ionicons name="football-outline" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptySubtitle}>Start your football journey!</Text>
            <ProfessionalButton
              title="Create First Match"
              icon="add"
              onPress={() => navigation.getParent()?.navigate('Matches', { screen: 'CreateMatch' })}
              style={styles.emptyButton}
            />
          </View>
        </View>
      );
    }

    return (
      <>
        {displayMatches.length > 0 && (
          <View style={styles.matchesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {liveMatches.length > 0 ? '🔴 Live & Recent' : 'Recent Matches'}
              </Text>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Matches')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {displayMatches.map((match) => (
              <View key={match.id} style={styles.matchCardWrapper}>
                <ProfessionalMatchCard
                  match={{
                    ...match,
                    competition: 'Grassroots League',
                  }}
                  onPress={() => navigation.getParent()?.navigate('Matches', { 
                    screen: 'MatchScoring', 
                    params: { matchId: match.id } 
                  })}
                />
              </View>
            ))}
          </View>
        )}

        {upcomingMatches.length > 0 && (
          <View style={styles.matchesSection}>
            <Text style={styles.sectionTitle}>📅 Upcoming Matches</Text>
            {upcomingMatches.map((match) => (
              <View key={match.id} style={styles.matchCardWrapper}>
                <ProfessionalMatchCard
                  match={{
                    ...match,
                    competition: 'Grassroots League',
                  }}
                  onPress={() => navigation.getParent()?.navigate('Matches', { 
                    screen: 'MatchScoring', 
                    params: { matchId: match.id } 
                  })}
                />
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
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
          showNotifications
          showProfile
          onNotifications={() => navigation.getParent()?.navigate('Profile')}
          onProfile={() => navigation.getParent()?.navigate('Profile')}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {getGreeting()}, <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>!
            </Text>
            <Text style={styles.subGreeting}>Ready to dominate the field? ⚽</Text>
          </View>
        </ProfessionalHeader>
        
        {/* Live Match Ticker */}
        {renderLiveMatchTicker()}
        
        <View style={styles.content}>
          {/* Player Stats */}
          {!loadingStats && playerStats && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <ProfessionalPlayerStats
                playerName={user?.name || 'Player'}
                position={playerStats?.position || 'MID'}
                stats={{
                  goals: playerStats?.goals || 0,
                  assists: playerStats?.assists || 0,
                  matches: playerStats?.matchesPlayed || 0,
                  rating: playerStats?.averageRating || 0,
                }}
                onPress={() => navigation.getParent()?.navigate('Profile')}
              />
            </Animated.View>
          )}
          
          {/* Quick Actions */}
          {renderQuickActions()}
          
          {/* Matches */}
          {renderMatches()}
          
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      
      <FloatingActionButton
        onPress={() => navigation.getParent()?.navigate('Matches', { screen: 'CreateMatch' })}
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
  headerContent: {
    marginTop: 0, // Removed extra margin
  },
  greeting: {
    fontSize: typography.fontSize.title2,
    fontWeight: typography.fontWeight.light,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  userName: {
    fontWeight: typography.fontWeight.bold,
  },
  subGreeting: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
  },
  liveTickerContainer: {
    height: 36,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    overflow: 'hidden',
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  liveTickerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    height: '100%',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xs,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  tickerContent: {
    flex: 1,
    overflow: 'hidden',
  },
  tickerScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  tickerMatch: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.medium,
  },
  tickerSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginLeft: spacing.xl,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: typography.fontSize.small,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semibold,
  },
  quickActionsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.screenPadding,
  },
  quickActionsScroll: {
    paddingLeft: 0,
  },
  quickActionCard: {
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  quickActionGradient: {
    width: 120,
    height: 90,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionTitle: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  quickActionArrow: {
    alignSelf: 'flex-end',
  },
  matchesSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  matchCardWrapper: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  emptySection: {
    padding: spacing.screenPadding,
    marginTop: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
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
    fontSize: typography.fontSize.title3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.regular,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    // Style passed from parent
  },
});