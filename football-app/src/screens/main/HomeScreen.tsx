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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayerStatsCard } from '../../components/PlayerStatsCard';
import { MatchCard } from '../../components/MatchCard';
import { FloatingActionButton } from '../../components/FloatingActionButton';
import { Colors, Gradients } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

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
  const headerSlideAnim = useRef(new Animated.Value(-100)).current;

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
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Load player stats
      try {
        const stats = await apiService.getCurrentUserStats();
        console.log('📊 Loaded player stats from API:', stats);
        
        // Handle different field names from backend
        const normalizedStats = {
          goals: stats.goals || 0,
          assists: stats.assists || 0,
          matchesPlayed: stats.matchesPlayed || stats.matches_played || stats.matches || 0,
          position: stats.position || 'MID',
          yellowCards: stats.yellowCards || stats.yellow_cards || 0,
          redCards: stats.redCards || stats.red_cards || 0,
          minutesPlayed: stats.minutesPlayed || stats.minutes_played || 0,
          averageRating: stats.averageRating || stats.average_rating || 0,
        };
        
        setPlayerStats(normalizedStats);
      } catch (error) {
        console.error('Error loading stats:', error);
        setPlayerStats({
          goals: 0,
          assists: 0,
          matchesPlayed: 0,
          position: 'MID',
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0,
          averageRating: 0,
        });
      }
      
      // Load matches
      try {
        const matchesResponse = await apiService.getMatches();
        const matches = matchesResponse.matches || [];
        
        // Calculate matches played by this user
        const userData = await apiService.getCurrentUser();
        const userId = userData?.id || userData?.user?.id;
        
        const userPlayedMatches = matches.filter((match: any) => {
          if (match.status !== 'COMPLETED') return false;
          
          // Check if user is in either team
          const inHomeTeam = match.homeTeam?.players?.some((p: any) => 
            p.id === userId || p.playerId === userId || p.userId === userId
          );
          const inAwayTeam = match.awayTeam?.players?.some((p: any) => 
            p.id === userId || p.playerId === userId || p.userId === userId
          );
          
          return inHomeTeam || inAwayTeam;
        });
        
        console.log(`📊 User has played in ${userPlayedMatches.length} matches`);
        
        // Calculate average rating from all matches where user was rated
        let totalRating = 0;
        let ratedMatches = 0;
        
        for (const match of userPlayedMatches) {
          try {
            const ratingsResponse = await apiService.getMatchRatings(match.id);
            const userRatings = ratingsResponse.ratings?.filter((r: any) => 
              r.playerId === userId || r.raterId === userId
            );
            
            if (userRatings && userRatings.length > 0) {
              const avgRatingForMatch = userRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / userRatings.length;
              totalRating += avgRatingForMatch;
              ratedMatches++;
            }
          } catch (error) {
            console.log(`No ratings found for match ${match.id}`);
          }
        }
        
        const averageRating = ratedMatches > 0 ? (totalRating / ratedMatches) : 0;
        console.log(`📊 Calculated average rating: ${averageRating.toFixed(1)} from ${ratedMatches} rated matches`);
        
        // Update player stats with actual match count and calculated rating
        setPlayerStats(prev => {
          const updates: any = {};
          
          if (!prev?.matchesPlayed || prev.matchesPlayed === 0) {
            updates.matchesPlayed = userPlayedMatches.length;
          }
          
          if (!prev?.averageRating || prev.averageRating === 0) {
            updates.averageRating = averageRating;
          }
          
          return prev ? { ...prev, ...updates } : prev;
        });
        
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
        setAllMatches(matches);
      } catch (error) {
        console.error('Error loading matches:', error);
        setUpcomingMatches([]);
        setAllMatches([]);
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

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          transform: [{ translateY: headerSlideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={Gradients.field}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" />

        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {getGreeting()}, <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>! ⚽
              </Text>
              <Text style={styles.subGreeting}>Ready to dominate the field?</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.notificationGradient}>
                <Ionicons name="notifications" size={24} color="#fff" />
                <View style={styles.notificationBadge} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Live Score Ticker */}
          {allMatches.filter(m => m.status === 'LIVE').length > 0 && (
            <View style={styles.liveScoreTicker}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE NOW</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {allMatches
                  .filter(m => m.status === 'LIVE')
                  .map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      style={styles.liveScoreItem}
                      onPress={() => navigation.navigate('MatchScoring', { matchId: match.id })}
                    >
                      <Text style={styles.liveScoreText}>
                        {match.homeTeam?.name} {match.homeScore} - {match.awayScore} {match.awayTeam?.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderPlayerStats = () => {
    if (!playerStats && loadingStats) return null;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <PlayerStatsCard
          playerName={user?.name || 'Player'}
          position={playerStats?.position || 'MID'}
          stats={{
            goals: playerStats?.goals || 0,
            assists: playerStats?.assists || 0,
            matches: playerStats?.matchesPlayed || 0,
            rating: playerStats?.averageRating || 0,
          }}
          onPress={() => navigation.navigate('Profile')}
        />
      </Animated.View>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        id: 'match',
        title: 'Quick Match',
        subtitle: 'Start now',
        icon: 'football',
        gradient: Gradients.live,
        screen: 'CreateMatch',
      },
      {
        id: 'team',
        title: 'My Teams',
        subtitle: 'Manage',
        icon: 'people',
        gradient: ['#2196F3', '#1976D2'],
        screen: 'Teams',
      },
      {
        id: 'tournament',
        title: 'Tournaments',
        subtitle: 'Compete',
        icon: 'trophy',
        gradient: Gradients.victory,
        screen: 'Tournaments',
      },
      {
        id: 'discover',
        title: 'Find Players',
        subtitle: 'Scout',
        icon: 'search',
        gradient: ['#9C27B0', '#7B1FA2'],
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
                navigation.navigate(action.screen);
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={action.gradient}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon as any} size={32} color="#fff" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
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
          <LinearGradient
            colors={Gradients.card}
            style={styles.emptyCard}
          >
            <Ionicons name="football-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyTitle}>No Matches Yet</Text>
            <Text style={styles.emptySubtitle}>Start your football journey!</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreateMatch')}
            >
              <LinearGradient
                colors={Gradients.field}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>Create First Match</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    }

    return (
      <>
        {displayMatches.length > 0 && (
          <View style={styles.matchesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {liveMatches.length > 0 ? '🔴 Live & Recent' : '📊 Recent Matches'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {displayMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onPress={() => navigation.navigate('MatchScoring', { matchId: match.id })}
              />
            ))}
          </View>
        )}

        {upcomingMatches.length > 0 && (
          <View style={styles.matchesSection}>
            <Text style={styles.sectionTitle}>📅 Upcoming Matches</Text>
            {upcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onPress={() => navigation.navigate('MatchScoring', { matchId: match.id })}
              />
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E27', '#1A1F3A']}
        style={styles.backgroundGradient}
      />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.primary.light}
            colors={[Colors.primary.main]}
          />
        }
      >
        {renderHeader()}
        <View style={styles.content}>
          {renderPlayerStats()}
          {renderQuickActions()}
          {renderMatches()}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
      
      <FloatingActionButton
        onPress={() => navigation.navigate('CreateMatch')}
        icon="add"
      />
    </View>
  );
}

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
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  notificationButton: {
    padding: 4,
  },
  notificationGradient: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.live.main,
    borderWidth: 2,
    borderColor: Colors.text.primary,
  },
  liveScoreTicker: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.live.main,
    marginRight: 6,
  },
  liveText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  liveScoreItem: {
    marginRight: 20,
  },
  liveScoreText: {
    color: Colors.text.primary,
    fontSize: 14,
  },
  content: {
    marginTop: -20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary.light,
    fontWeight: '600',
  },
  quickActionsSection: {
    marginTop: 24,
  },
  quickActionsScroll: {
    paddingHorizontal: 20,
  },
  quickActionCard: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionGradient: {
    width: 120,
    height: 120,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  matchesSection: {
    marginTop: 32,
  },
  emptySection: {
    padding: 20,
    marginTop: 32,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
});